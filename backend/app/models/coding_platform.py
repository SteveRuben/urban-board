import uuid
from sqlalchemy import Boolean, Column, Integer, String, Text, Enum as SQLEnum, ForeignKey, Integer,DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app import db
from datetime import datetime, timezone

from app.types.coding_platform import ChallengeDifficulty, ChallengeStatus, ProgrammingLanguage, UserChallengeStatus

from .organization import GUID
    
class Exercise(db.Model):
    """
    Curriculum layer - groups challenges into learning paths
    """
    __tablename__ = 'exercises'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_by = db.Column(db.String(36), nullable=False)  # Reference to users table
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    language = db.Column(db.Enum(ProgrammingLanguage), nullable=False)
    difficulty = db.Column(db.Enum(ChallengeDifficulty), nullable=False)
    order_index = db.Column(db.Integer, default=0)  # For sorting exercises
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    challenges = db.relationship('Challenge', back_populates='exercise', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'created_by': self.created_by,
            'title': self.title,
            'description': self.description,
            'language': self.language.value,
            'difficulty': self.difficulty.value,
            'order_index': self.order_index,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'challenge_count': len(self.challenges)
        }

class Challenge(db.Model):
    """
    Core problem entity - represents a standalone coding problem
    """
    __tablename__ = 'challenges'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exercise_id = Column(String(36), db.ForeignKey('exercises.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    constraints = db.Column(db.Text)  # Problem constraints and limits
    tags = db.Column(db.JSON, default=list)  # List of tags for categorization
    status = db.Column(db.Enum(ChallengeStatus), default=ChallengeStatus.DRAFT)
    order_index = db.Column(db.Integer, default=0)  # Order within exercise
    estimated_time_minutes = db.Column(db.Integer, default=30)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    exercise = db.relationship('Exercise', back_populates='challenges')
    steps = db.relationship('ChallengeStep', back_populates='challenge', cascade='all, delete-orphan', order_by='ChallengeStep.order_index')
    user_challenges = db.relationship('UserChallenge', back_populates='challenge', cascade='all, delete-orphan')
    
    def to_dict(self, include_steps=False):
        result = {
            'id': self.id,
            'exercise_id': self.exercise_id,
            'title': self.title,
            'description': self.description,
            'constraints': self.constraints,
            'tags': self.tags,
            'status': self.status.value,
            'order_index': self.order_index,
            'estimated_time_minutes': self.estimated_time_minutes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'step_count': len(self.steps)
        }
        
        if include_steps:
            result['steps'] = [step.to_dict() for step in self.steps]
            
        return result

class ChallengeStep(db.Model):
    """
    Progressive step-by-step problem solving
    """
    __tablename__ = 'challenge_steps'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    challenge_id = Column(String(36), db.ForeignKey('challenges.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    instructions = db.Column(db.Text, nullable=False)
    hint = db.Column(db.Text)
    starter_code = db.Column(db.Text)  # Initial code template
    solution_code = db.Column(db.Text)  # Reference solution (admin only)
    order_index = db.Column(db.Integer, nullable=False)
    is_final_step = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    challenge = db.relationship('Challenge', back_populates='steps')
    testcases = db.relationship('ChallengeStepTestcase', back_populates='step', cascade='all, delete-orphan')
    progress_entries = db.relationship('UserChallengeProgress', back_populates='step', cascade='all, delete-orphan')
    
    def to_dict(self, include_testcases=False, include_solution=False):
        result = {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'title': self.title,
            'instructions': self.instructions,
            'hint': self.hint,
            'starter_code': self.starter_code,
            'order_index': self.order_index,
            'is_final_step': self.is_final_step,
            'created_at': self.created_at.isoformat(),
            'testcase_count': len(self.testcases)
        }
        
        if include_solution:
            result['solution_code'] = self.solution_code
            
        if include_testcases:
            result['testcases'] = [tc.to_dict() for tc in self.testcases]
            
        return result

class ChallengeStepTestcase(db.Model):
    """
    Execution & validation layer - test cases for validating user solutions
    """
    __tablename__ = 'challenge_step_testcases'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    step_id = Column(String(36), db.ForeignKey('challenge_steps.id'), nullable=False)
    input_data = db.Column(db.Text, nullable=False)  # JSON string or plain text
    expected_output = db.Column(db.Text, nullable=False)
    is_hidden = db.Column(db.Boolean, default=False)  # Hidden from user during development
    is_example = db.Column(db.Boolean, default=False)  # Show as example in problem description
    timeout_seconds = db.Column(db.Integer, default=5)
    memory_limit_mb = db.Column(db.Integer, default=128)
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    step = db.relationship('ChallengeStep', back_populates='testcases')
    
    def to_dict(self, show_hidden=False):
        result = {
            'id': self.id,
            'step_id': self.step_id,
            'input_data': self.input_data,
            'is_hidden': self.is_hidden,
            'is_example': self.is_example,
            'timeout_seconds': self.timeout_seconds,
            'memory_limit_mb': self.memory_limit_mb,
            'order_index': self.order_index,
            'created_at': self.created_at.isoformat()
        }
        
        # Only show expected output to admins or when explicitly requested
        if show_hidden or not self.is_hidden:
            result['expected_output'] = self.expected_output
            
        return result

class UserChallenge(db.Model):
    """
    User session tracking - tracks where a user is within a challenge
    Supports both authenticated users and anonymous sessions
    """
    __tablename__ = 'user_challenges'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=True)  # Nullable for anonymous users
    challenge_id = Column(String(36), db.ForeignKey('challenges.id'), nullable=False)
    current_step_id = Column(String(36), db.ForeignKey('challenge_steps.id'), nullable=True)
    status = db.Column(db.Enum(UserChallengeStatus), default=UserChallengeStatus.NOT_STARTED)
    attempt_count = db.Column(db.Integer, default=0)
    started_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)
    session_token = db.Column(db.String(255), nullable=False, unique=True, default=lambda: str(uuid.uuid4()))  # Always present for session identification
    
    # Optional user information for anonymous sessions
    anonymous_identifier = db.Column(db.String(255), nullable=True)  # Email, name, or custom identifier
    
    # Relationships
    challenge = db.relationship('Challenge', back_populates='user_challenges')
    current_step = db.relationship('ChallengeStep', foreign_keys=[current_step_id])
    progress_entries = db.relationship('UserChallengeProgress', back_populates='user_challenge', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'challenge_id': self.challenge_id,
            'current_step_id': self.current_step_id,
            'status': self.status.value,
            'attempt_count': self.attempt_count,
            'started_at': self.started_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'session_token': self.session_token,
            'anonymous_identifier': self.anonymous_identifier,
            'is_anonymous': self.user_id is None
        }

class UserChallengeProgress(db.Model):
    """
    Code snapshot for autosave & recovery
    """
    __tablename__ = 'user_challenge_progress'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_challenge_id = Column(String(36), db.ForeignKey('user_challenges.id'), nullable=False)
    step_id = Column(String(36), db.ForeignKey('challenge_steps.id'), nullable=False)
    code = db.Column(db.Text, default='')
    language = db.Column(db.Enum(ProgrammingLanguage), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    tests_passed = db.Column(db.Integer, default=0)
    tests_total = db.Column(db.Integer, default=0)
    last_execution_result = db.Column(db.JSON)  # Store last execution details
    last_edited = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user_challenge = db.relationship('UserChallenge', back_populates='progress_entries')
    step = db.relationship('ChallengeStep', back_populates='progress_entries')
    
    # Unique constraint: one progress entry per user per step
    __table_args__ = (db.UniqueConstraint('user_challenge_id', 'step_id', name='unique_user_step_progress'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_challenge_id': self.user_challenge_id,
            'step_id': self.step_id,
            'code': self.code,
            'language': self.language.value,
            'is_completed': self.is_completed,
            'tests_passed': self.tests_passed,
            'tests_total': self.tests_total,
            'last_execution_result': self.last_execution_result,
            'last_edited': self.last_edited.isoformat()
        }
