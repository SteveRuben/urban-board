from sqlalchemy import Column, Integer, String, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app import db
from app.types.challenge import ChallengeStatus

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

    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    owner = db.relationship('User', backref='challenges')
