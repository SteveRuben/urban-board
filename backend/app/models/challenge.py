import uuid
from sqlalchemy import Boolean, Column, Integer, String, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app import db
from app.types.challenge import ChallengeStatus, UserChallengeStatus
from datetime import datetime

class Challenge(db.Model):
    __tablename__ = 'challenges'

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)

    status = Column(
        SQLEnum(ChallengeStatus, name='challenge_status', create_constraint=True),
        default=ChallengeStatus.draft,
        nullable=False
    )

    # created_at = db.Column(DateTime, default=datetime.utcnow)
    # updated_at = db.Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    owner = db.relationship('User', backref='challenges')



########## Modele user challenge #############

from sqlalchemy import UUID, Integer, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from app import db

class UserChallenge(db.Model):
    __tablename__ = 'user_challenges'

    id = db.Column(Integer, primary_key=True)
    challenge_id = db.Column(Integer, db.ForeignKey('challenges.id'), nullable=False)

    current_step = db.Column(Integer, default=0, nullable=True)
    attempts = db.Column(Integer, default=3, nullable=True)

    token_id = db.Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True, nullable=True)

    used = db.Column(Boolean, default=False, nullable=True) # à supprimer...

    status = db.Column(
        Enum(UserChallengeStatus),
        nullable=False,
        default=UserChallengeStatus.pending
    )

    created_at = db.Column(DateTime, default=datetime.utcnow)
    updated_at = db.Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = db.Column(DateTime)

    # Relations
    challenge = relationship('Challenge', backref='user_challenges')
