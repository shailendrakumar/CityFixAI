import base64
import json
import logging
from typing import Any

from openai import AsyncOpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)

CATEGORIES = [
    'Potholes',
    'Garbage accumulation',
    'Waterlogging',
    'Broken streetlights',
    'Damaged footpaths',
    'Open drains',
    'Water leakage',
    'Traffic signal failures',
    'Road damage',
    'Public accessibility problems',
]

SYSTEM_PROMPT = (
    'You are an AI assistant for a civic issue reporting platform. '
    'Analyze the uploaded photograph and return ONLY a JSON object with these keys: '
    'issue_type (string), visible_damage (array of strings), description (string, concise), '
    'severity (one of low, medium, high, critical), safety_impact (one of low, medium, high, critical), '
    'category (one of the supported categories), confidence (number 0-1). '
    'Do not include markdown or extra text.'
)
def _fallback_result(reason: str) -> dict[str, Any]:
    return {
        'issue_type': 'Unknown civic issue',
        'visible_damage': [],
        'description': 'AI analysis unavailable. Please review the photo and enter details manually.',
        'severity': 'medium',
        'safety_impact': 'medium',
        'category': 'Road damage',
        'confidence': 0.0,
        'needs_confirmation': True,
        'ai_generated': True,
        'model_version': 'fallback-heuristic',
        'fallback_reason': reason,
        'disclaimer': 'AI-generated suggestion. Human confirmation required.',
    }


def _normalize(raw: dict[str, Any], threshold: float) -> dict[str, Any]:
    category = raw.get('category')
    if category not in CATEGORIES:
        category = 'Road damage'
    confidence = float(raw.get('confidence', 0.0) or 0.0)
    confidence = max(0.0, min(1.0, confidence))
    return {
        'issue_type': str(raw.get('issue_type') or 'Civic issue'),
        'visible_damage': [str(x) for x in (raw.get('visible_damage') or [])],
        'description': str(raw.get('description') or ''),
        'severity': str(raw.get('severity') or 'medium').lower(),
        'safety_impact': str(raw.get('safety_impact') or 'medium').lower(),
        'category': category,
        'confidence': confidence,
        'needs_confirmation': confidence < threshold,
        'ai_generated': True,
        'model_version': get_settings().openai_vision_model,
        'disclaimer': 'AI-generated suggestion. Human confirmation required.',
    }
async def classify_image(image_bytes: bytes, mime_type: str = 'image/jpeg', hint: str = '') -> dict[str, Any]:
    settings = get_settings()
    if not settings.openai_api_key:
        return _fallback_result('OPENAI_API_KEY not configured')

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    b64 = base64.b64encode(image_bytes).decode('ascii')
    data_url = f'data:{mime_type};base64,{b64}'
    user_text = 'Analyze this civic issue photo.'
    if hint:
        user_text += f' User hint: {hint}'
    user_text += f' Supported categories: {", ".join(CATEGORIES)}.'

    try:
        resp = await client.chat.completions.create(
            model=settings.openai_vision_model,
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {
                    'role': 'user',
                    'content': [
                        {'type': 'text', 'text': user_text},
                        {'type': 'image_url', 'image_url': {'url': data_url}},
                    ],
                },
            ],
            max_tokens=500,
            temperature=0.2,
        )
        content = resp.choices[0].message.content or ''
        content = content.strip()
        if content.startswith('```'):
            content = content.strip('`')
            if content.startswith('json'):
                content = content[4:]
        raw = json.loads(content)
        return _normalize(raw, settings.ai_confidence_threshold)
    except Exception as e:
        logger.exception('Vision classification failed: %s', e)
        return _fallback_result(str(e))
