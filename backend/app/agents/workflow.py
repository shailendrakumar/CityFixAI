import uuid
from datetime import datetime, timezone
from typing import Any, TypedDict

from langgraph.graph import StateGraph, END

from app.agents.civic_agent import classify_text, severity_from, detect_duplicates
from app.services.audit import persist_audit_entries


SUPPORTED_CATEGORIES = [
    'Potholes', 'Garbage accumulation', 'Waterlogging', 'Broken streetlights',
    'Damaged footpaths', 'Open drains', 'Water leakage', 'Traffic signal failures',
    'Road damage', 'Public accessibility problems',
]

DEPARTMENT_MAP = {
    'pothole': ('Roads & Infrastructure', 'Pothole Repair Crew'),
    'streetlight': ('Public Lighting', 'Streetlight Maintenance Team'),
    'water_leak': ('Water & Sewerage', 'Leak Response Team'),
    'trash': ('Sanitation', 'Solid Waste Collection Team'),
    'sidewalk': ('Roads & Infrastructure', 'Sidewalk Repair Crew'),
    'graffiti': ('Urban Maintenance', 'Graffiti Removal Team'),
    'traffic_signal': ('Traffic Management', 'Signal Maintenance Team'),
    'waterlogging': ('Drainage', 'Stormwater Response Team'),
    'accessibility': ('Accessibility Compliance', 'Accessibility Remediation Team'),
    'other': ('General Civic Services', 'Triage Team'),
}


class WorkflowState(TypedDict, total=False):
    run_id: str
    report: dict[str, Any]
    existing_reports: list[dict[str, Any]]
    human_approved: bool
    evidence: list[str]
    human_role: str
    step: int
    retry_count: int
    max_retries: int
    failed_agent: str | None
    errors: list[str]
    classification: dict[str, Any]
    validation: dict[str, Any]
    duplicates: list[dict[str, Any]]
    severity: dict[str, Any]
    priority: dict[str, Any]
    routing: dict[str, Any]
    notification: dict[str, Any]
    human_review: dict[str, Any]
    audit: list[dict[str, Any]]
    status: str
    resolution_allowed: bool


AGENTS = [
    'classification', 'validation', 'duplicate_detection', 'severity_assessment',
    'priority', 'routing_recommendation', 'notification', 'human_review',
]


def _audit_entry(run_id, agent, action, status, inp, out):
    return {
        'id': str(uuid.uuid4()),
        'workflow_run_id': run_id,
        'agent': agent,
        'action': action,
        'status': status,
        'input_summary': (str(inp)[:500] if inp is not None else None),
        'output_summary': (str(out)[:500] if out is not None else None),
        'details': {'input': inp, 'output': out},
        'created_at': datetime.now(timezone.utc).isoformat(),
    }


def _append_audit(state, agent, action, status, inp, out):
    audits = list(state.get('audit') or [])
    audits.append(_audit_entry(state.get('run_id', ''), agent, action, status, inp, out))
    return audits
def classification_agent(state):
    report = state.get('report', {})
    text = f"{report.get('title', '')} {report.get('description', '')}"
    category, confidence = classify_text(text)
    result = {
        'issue_type': category,
        'category': category,
        'confidence': round(float(confidence), 3),
        'model_version': 'heuristic-classifier-v1',
    }
    return {
        'classification': result,
        'audit': _append_audit(state, 'classification', 'classify_issue', 'ok', {'text': text}, result),
    }


def validation_agent(state):
    report = state.get('report', {})
    issues = []
    score = 1.0
    if not report.get('title'):
        issues.append('missing_title'); score -= 0.25
    if report.get('lat') is None or report.get('lng') is None:
        issues.append('missing_location'); score -= 0.25
    desc = (report.get('description') or '').strip()
    if len(desc) < 10:
        issues.append('description_too_short'); score -= 0.2
    if not report.get('category'):
        issues.append('missing_category'); score -= 0.15
    score = max(0.0, min(1.0, score))
    result = {
        'is_valid': len(issues) == 0,
        'issues': issues,
        'completeness_score': round(score, 3),
    }
    return {
        'validation': result,
        'audit': _append_audit(state, 'validation', 'validate_report', 'ok', report, result),
    }


def duplicate_detection_agent(state):
    report = state.get('report', {})
    existing = state.get('existing_reports', [])
    cand = {
        'title': report.get('title', ''),
        'description': report.get('description', ''),
        'category': report.get('category') or state.get('classification', {}).get('category'),
        'lat': report.get('lat', 0.0),
        'lng': report.get('lng', 0.0),
    }
    matches = detect_duplicates(cand, existing)
    result = {'matches': matches, 'count': len(matches)}
    return {
        'duplicates': matches,
        'audit': _append_audit(state, 'duplicate_detection', 'detect_duplicates', 'ok', cand, result),
    }


def severity_assessment_agent(state):
    report = state.get('report', {})
    text = f"{report.get('title', '')} {report.get('description', '')}"
    category = state.get('classification', {}).get('category', report.get('category', 'other'))
    score, label, rationale = severity_from(text, category)
    safety = 'critical' if score >= 80 else 'high' if score >= 60 else 'medium' if score >= 35 else 'low'
    result = {
        'severity_score': score,
        'severity_label': label,
        'safety_impact': safety,
        'rationale': rationale,
    }
    return {
        'severity': result,
        'audit': _append_audit(state, 'severity_assessment', 'assess_severity', 'ok', text, result),
    }
def priority_agent(state):
    sev = state.get('severity', {})
    score = int(sev.get('severity_score', 0))
    if state.get('duplicates'):
        score = min(100, score + 10)
    if not state.get('validation', {}).get('is_valid', True):
        score = max(0, score - 5)
    level = 'critical' if score >= 80 else 'high' if score >= 60 else 'medium' if score >= 35 else 'low'
    result = {
        'priority_score': score,
        'priority_level': level,
        'rationale': f"severity {sev.get('severity_label')} + adjustments = {score}",
    }
    return {
        'priority': result,
        'audit': _append_audit(state, 'priority', 'rank_priority', 'ok', sev, result),
    }


def routing_recommendation_agent(state):
    cls = state.get('classification', {})
    category = (cls.get('category') or 'other').lower()
    key = 'other'
    if 'pothole' in category:
        key = 'pothole'
    elif 'garbage' in category or 'trash' in category:
        key = 'trash'
    elif 'waterlog' in category:
        key = 'waterlogging'
    elif 'streetlight' in category or 'light' in category:
        key = 'streetlight'
    elif 'footpath' in category or 'sidewalk' in category:
        key = 'sidewalk'
    elif 'drain' in category:
        key = 'water_leak' if 'leak' in category else 'waterlogging'
    elif 'traffic' in category or 'signal' in category:
        key = 'traffic_signal'
    elif 'access' in category:
        key = 'accessibility'
    dept, team = DEPARTMENT_MAP.get(key, DEPARTMENT_MAP['other'])
    result = {
        'department': dept,
        'team': team,
        'disclaimer': 'Recommendation only. No actual government integration or automated dispatch.',
    }
    return {
        'routing': result,
        'audit': _append_audit(state, 'routing_recommendation', 'recommend_routing', 'ok', category, result),
    }


def notification_agent(state):
    priority = state.get('priority', {})
    validation = state.get('validation', {})
    if not validation.get('is_valid', True):
        subject = 'Report needs more information'
        body = 'Your report is missing required details. Please update and resubmit.'
    else:
        subject = f"Report received - priority {priority.get('priority_level', 'medium')}"
        body = 'Your civic report has been recorded and queued for review.'
    result = {
        'subject': subject,
        'body': body,
        'channels': ['in_app'],
        'generated_at': datetime.now(timezone.utc).isoformat(),
    }
    return {
        'notification': result,
        'audit': _append_audit(state, 'notification', 'generate_notification', 'ok', state.get('status', 'open'), result),
    }


def human_review_agent(state):
    sev = state.get('severity', {})
    duplicates = state.get('duplicates', [])
    validation = state.get('validation', {})
    priority = state.get('priority', {})
    sensitive = (
        sev.get('severity_label') in ('high', 'critical')
        or bool(duplicates)
        or not validation.get('is_valid', True)
        or priority.get('priority_level') in ('high', 'critical')
    )
    approved = bool(state.get('human_approved', False))
    evidence = state.get('evidence') or []
    has_evidence = len(evidence) > 0
    has_authority = state.get('human_role') == 'admin'
    resolution_allowed = approved and has_evidence and has_authority
    if sensitive and not resolution_allowed:
        status = 'pending_human_review'
    else:
        status = state.get('status', 'open')
    result = {
        'requires_review': sensitive,
        'approved': approved,
        'has_evidence': has_evidence,
        'has_authority': has_authority,
        'resolution_allowed': resolution_allowed,
        'decision': 'approved' if resolution_allowed else ('pending' if sensitive else 'not_required'),
        'reason': 'Sensitive decision requires administrator approval with verified evidence.' if sensitive else 'No human review required.',
    }
    return {
        'human_review': result,
        'status': status,
        'resolution_allowed': resolution_allowed,
        'audit': _append_audit(state, 'human_review', 'human_review_gate', 'ok', {'sensitive': sensitive}, result),
    }
def _dispatch(state):
    step = state.get('step', 0)
    if step >= len(AGENTS):
        return {'status': state.get('status', 'open')}
    agent_name = AGENTS[step]
    mapping = {
        'classification': classification_agent,
        'validation': validation_agent,
        'duplicate_detection': duplicate_detection_agent,
        'severity_assessment': severity_assessment_agent,
        'priority': priority_agent,
        'routing_recommendation': routing_recommendation_agent,
        'notification': notification_agent,
        'human_review': human_review_agent,
    }
    func = mapping[agent_name]
    try:
        patch = func(state)
        patch['step'] = step + 1
        patch['failed_agent'] = None
        patch['errors'] = []
        return patch
    except Exception as e:
        return {
            'errors': state.get('errors', []) + [str(e)],
            'failed_agent': agent_name,
            'audit': _append_audit(state, agent_name, 'agent_failed', 'error', None, str(e)),
        }


def _route(state):
    if state.get('errors') and state.get('failed_agent'):
        if state.get('retry_count', 0) < state.get('max_retries', 2):
            return 'retry'
        return 'fail'
    if state.get('step', 0) >= len(AGENTS):
        return 'finalize'
    return 'dispatch'


def _retry(state):
    return {
        'retry_count': state.get('retry_count', 0) + 1,
        'errors': [],
        'failed_agent': None,
    }


def _fail(state):
    return {
        'status': 'failed',
        'notification': {
            'subject': 'Workflow failed',
            'body': f"Agent {state.get('failed_agent')} failed after retries: {state.get('errors')}",
            'channels': ['in_app'],
        },
        'audit': _append_audit(state, 'workflow', 'fail', 'error', state.get('failed_agent'), state.get('errors')),
    }


def _finalize(state):
    return {
        'status': state.get('status', 'open'),
        'audit': _append_audit(state, 'workflow', 'finalize', 'ok', None, {'status': state.get('status', 'open')}),
    }


def build_workflow():
    g = StateGraph(WorkflowState)
    g.add_node('dispatch', _dispatch)
    g.add_node('retry', _retry)
    g.add_node('fail', _fail)
    g.add_node('finalize', _finalize)
    g.set_entry_point('dispatch')
    g.add_conditional_edges('dispatch', _route, {
        'dispatch': 'dispatch',
        'retry': 'retry',
        'fail': 'fail',
        'finalize': 'finalize',
    })
    g.add_edge('retry', 'dispatch')
    g.add_edge('fail', END)
    g.add_edge('finalize', END)
    return g.compile()


WORKFLOW = build_workflow()


async def run_workflow(payload):
    run_id = str(uuid.uuid4())
    state = {
        'run_id': run_id,
        'report': payload.get('report', {}),
        'existing_reports': payload.get('existing_reports', []),
        'human_approved': bool(payload.get('human_approved', False)),
        'evidence': payload.get('evidence', []),
        'human_role': payload.get('human_role', 'citizen'),
        'step': 0,
        'retry_count': 0,
        'max_retries': int(payload.get('max_retries', 2)),
        'failed_agent': None,
        'errors': [],
        'audit': [],
        'status': 'open',
        'resolution_allowed': False,
    }
    result = await WORKFLOW.ainvoke(state)
    await persist_audit_entries(result.get('audit') or [])
    result['run_id'] = run_id
    return result
