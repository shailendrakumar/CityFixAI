from fastapi import APIRouter, UploadFile, File, Form
from app.agents.civic_agent import classify_text, severity_from, detect_duplicates, run_agent
from app.services.vision_classifier import classify_image
from app.schemas import (
    AIClassifyRequest, AIClassifyResponse, AISeverityRequest, AISeverityResponse,
    AIDuplicateRequest, AIDuplicateResponse, AIPriorityResponse, AIAnalyzeRequest, AIAnalyzeResponse,
)

router = APIRouter(prefix='/ai', tags=['ai'])


@router.post('/classify', response_model=AIClassifyResponse)
async def classify(body: AIClassifyRequest):
    cat, conf = classify_text(body.text)
    return AIClassifyResponse(category=cat, confidence=conf)


@router.post('/severity', response_model=AISeverityResponse)
async def severity(body: AISeverityRequest):
    score, label, rationale = severity_from(body.text, body.category or 'other')
    return AISeverityResponse(score=score, label=label, rationale=rationale)


@router.post('/duplicates', response_model=AIDuplicateResponse)
async def duplicates(body: AIDuplicateRequest):
    cand = body.report
    cands = body.candidates
    return AIDuplicateResponse(matches=detect_duplicates(cand, cands))


@router.post('/priority', response_model=AIPriorityResponse)
async def priority(body: AISeverityRequest):
    score, label, rationale = severity_from(body.text, body.category or 'other')
    if score >= 80:
        prio = 'critical'
    elif score >= 60:
        prio = 'high'
    elif score >= 35:
        prio = 'medium'
    else:
        prio = 'low'
    return AIPriorityResponse(priority=prio, score=score, label=label, rationale=rationale)


@router.post('/analyze', response_model=AIAnalyzeResponse)
async def analyze(body: AIAnalyzeRequest):
    result = run_agent(body.text, body.lat, body.lng, body.candidates)
    score = result['severity_score']
    priority = 'critical' if score >= 80 else 'high' if score >= 60 else 'medium' if score >= 35 else 'low'
    return AIAnalyzeResponse(
        category=result['category'],
        confidence=result['confidence'],
        severity_score=score,
        severity_label=result['severity_label'],
        rationale=result['rationale'],
        duplicates=result['duplicates'],
        priority=priority,
    )


@router.post('/classify-image')
async def classify_image_endpoint(file: UploadFile = File(...), hint: str = Form('')):
    data = await file.read()
    mime = file.content_type or 'image/jpeg'
    result = await classify_image(data, mime, hint)
    return result