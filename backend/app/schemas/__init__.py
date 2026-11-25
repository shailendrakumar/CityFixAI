
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReportCreate(BaseModel):
    client_request_id: Optional[str] = None
    title: str
    description: Optional[str] = ''
    category: Optional[str] = 'other'
    lat: float
    lng: float
    address: Optional[str] = None
    ward_id: Optional[str] = None
    photo_urls: list[str] = Field(default_factory=list)
    anonymous: bool = False


class ReportOut(BaseModel):
    id: str
    client_request_id: Optional[str] = None
    reporter_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    severity_score: int = 0
    severity_label: str = 'low'
    status: str = 'open'
    lat: float
    lng: float
    address: Optional[str] = None
    ward_id: Optional[str] = None
    photo_urls: list[str] = Field(default_factory=list)
    ai_category: Optional[str] = None
    ai_severity: Optional[int] = None
    ai_confidence: Optional[float] = None
    ai_rationale: Optional[str] = None
    ai_model_version: Optional[str] = None
    duplicate_of: Optional[str] = None
    upvote_count: int = 0
    is_demo: bool = False
    department_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReportPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None


class SyncPushItem(BaseModel):
    client_request_id: str
    entity_type: str
    operation: str
    payload: dict


class SyncPushRequest(BaseModel):
    items: list[SyncPushItem]


class SyncPushResult(BaseModel):
    client_request_id: str
    status: str
    server_id: Optional[str] = None
    error: Optional[str] = None
    server_fields: Optional[dict] = None


class SyncPushResponse(BaseModel):
    results: list[SyncPushResult]


class WardOut(BaseModel):
    id: str
    name: str
    city: str
    population: int
    is_demo: bool

    class Config:
        from_attributes = True


class CategoryOut(BaseModel):
    id: str
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    default_severity: int = 30
    is_demo: bool = False

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    body: str


class CommentOut(BaseModel):
    id: str
    report_id: str
    user_id: Optional[str] = None
    author_name: Optional[str] = None
    body: str
    is_demo: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: str
    email: Optional[str] = None
    display_name: str
    role: str
    ward_id: Optional[str] = None
    contribution_points: int = 0
    is_demo: bool = False

    class Config:
        from_attributes = True


class SignupRequest(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = 'Citizen'


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: UserOut
# Community engagement schemas


class BadgeOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    criteria: Optional[str] = None
    points_reward: int = 0
    is_demo: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class UserBadgeOut(BaseModel):
    id: str
    user_id: str
    badge_id: str
    badge: Optional[BadgeOut] = None
    awarded_by: Optional[str] = None
    awarded_at: datetime
    verified: bool = True
    is_demo: bool = False


class ChallengeOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    goal_type: str = 'reports'
    target_count: int = 1
    reward_points: int = 0
    reward_badge_id: Optional[str] = None
    ward_id: Optional[str] = None
    is_demo: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class UserChallengeOut(BaseModel):
    id: str
    user_id: str
    challenge_id: str
    progress: int = 0
    completed_at: Optional[datetime] = None
    claimed_at: Optional[datetime] = None
    updated_at: datetime


class CampaignOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    ward_id: Optional[str] = None
    location: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    status: str = 'upcoming'
    organizer_id: Optional[str] = None
    is_demo: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class VolunteerRegistrationIn(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    ward_id: Optional[str] = None
    skills: Optional[str] = None
    availability: Optional[str] = None


class VolunteerRegistrationOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    ward_id: Optional[str] = None
    skills: Optional[str] = None
    availability: Optional[str] = None
    status: str = 'pending'
    is_demo: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class AnnouncementOut(BaseModel):
    id: str
    title: str
    body: str
    ward_id: Optional[str] = None
    priority: str = 'normal'
    author_id: Optional[str] = None
    is_demo: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class AnnouncementIn(BaseModel):
    title: str
    body: str
    ward_id: Optional[str] = None
    priority: Optional[str] = 'normal'


class ContributionEventOut(BaseModel):
    id: str
    user_id: str
    ward_id: Optional[str] = None
    report_id: Optional[str] = None
    event_type: str
    points: int = 0
    verified: bool = False
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    user_id: str
    display_name: str
    ward_id: Optional[str] = None
    points: int = 0
    rank: int = 0
    badges: list[str] = Field(default_factory=list)


class WardLeaderboardEntry(BaseModel):
    ward_id: str
    ward_name: str
    points: int = 0
    contributors: int = 0
    rank: int = 0


class AwardPointsRequest(BaseModel):
    user_id: str
    event_type: str
    points: int
    report_id: Optional[str] = None
    ward_id: Optional[str] = None
    verified: bool = True
    reason: Optional[str] = None


class CampaignParticipantIn(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


class ChallengeProgressIn(BaseModel):
    progress: int


class NotificationOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    title: str
    body: str
    type: str = 'info'
    data: Optional[dict] = None
    read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    user_id: Optional[str] = None
    title: str
    body: str
    type: Optional[str] = 'info'
    data: Optional[dict] = None

class AIClassifyRequest(BaseModel):
    text: str
    image_meta: Optional[dict] = None


class AIClassifyResponse(BaseModel):
    category: str
    subcategory: Optional[str] = None
    confidence: float


class AISeverityRequest(BaseModel):
    text: str
    category: Optional[str] = 'other'


class AISeverityResponse(BaseModel):
    score: int
    label: str
    rationale: str


class AIDuplicateRequest(BaseModel):
    report: dict
    candidates: list[dict] = Field(default_factory=list)


class AIDuplicateResponse(BaseModel):
    matches: list[dict] = Field(default_factory=list)


class AIPriorityResponse(BaseModel):
    priority: str
    score: int
    label: str
    rationale: str


class AIAnalyzeRequest(BaseModel):
    text: str
    lat: float
    lng: float
    candidates: list[dict] = Field(default_factory=list)


class AIAnalyzeResponse(BaseModel):
    category: str
    confidence: float
    severity_score: int
    severity_label: str
    rationale: str
    duplicates: list[dict] = Field(default_factory=list)
    priority: str
