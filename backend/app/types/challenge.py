from enum import Enum

class ChallengeStatus(Enum):
    draft = 'DRAFT'
    published = 'PUBLISHED'
    archived = 'ARCHIVED'

class UserChallengeStatus(Enum):
    pending = 'PENDING'
    in_progress = 'IN_PROGRESS'
    failed = 'FAILED'
    completed = 'COMPLETED'
    abandoned = 'ABANDONED'
    disqualified = 'DISQUALIFIED'