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


########## Modele challenge step #############

from sqlalchemy import Text

class ChallengeStep(db.Model):
    __tablename__ = 'challenge_steps'

    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id'), nullable=False)
    step_number = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String, nullable=False)
    description = db.Column(db.Text, nullable=False)

    challenge = db.relationship('Challenge', backref=db.backref('steps', lazy=True, cascade="all, delete-orphan"))


########## Modele challenge test case #############

class ChallengeStepTestcase(db.Model):
    __tablename__ = 'challenge_testcases'

    id = db.Column(db.Integer, primary_key=True)
    step_id = db.Column(db.Integer, db.ForeignKey('challenge_steps.id', ondelete='CASCADE'), nullable=False)
    input = db.Column(db.Text, nullable=False)
    expected_output = db.Column(db.Text, nullable=False)

    step = db.relationship('ChallengeStep', backref=db.backref('testcases', lazy=True, cascade="all, delete-orphan"))
