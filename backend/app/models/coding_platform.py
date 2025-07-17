import uuid
from sqlalchemy import JSON, Boolean, Column, Float, Integer, String, Text, Enum as SQLEnum, ForeignKey, Integer,DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app import db
from datetime import datetime, timezone

from app.types.coding_platform import ( 
    ChallengeDifficulty, ChallengeStatus, 
    ProgrammingLanguage, UserChallengeStatus, 
    ExerciseCategory, ExecutionEnvironment, TestcaseType, DatasetType, VisualizationType
    , DiagramFormat,DiagramType, FinancialDocumentType, DocumentFormat)

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
    category = db.Column(db.Enum(ExerciseCategory), nullable=False, default=ExerciseCategory.DEVELOPER)

    language = db.Column(db.Enum(ProgrammingLanguage), nullable=True)
    difficulty = db.Column(db.Enum(ChallengeDifficulty), nullable=False)
    order_index = db.Column(db.Integer, default=0)  # For sorting exercises
    
    required_skills = db.Column(db.JSON, default=list)  # ["sql", "python", "statistics"]
    estimated_duration_minutes = db.Column(db.Integer, default=60)
    
    business_domain = db.Column(db.String(255), nullable=False)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    challenges = db.relationship('Challenge', back_populates='exercise', cascade='all, delete-orphan')
    datasets = relationship("ExerciseDataset", back_populates="exercise", cascade="all, delete-orphan")

    
    def to_dict(self):
        return {
            'id': self.id,
            'created_by': self.created_by,
            'title': self.title,
            'category': self.category.value,
            'language': self.language.value if self.language else None,
            'difficulty': self.difficulty.value,
            'order_index': self.order_index,
            'required_skills': self.required_skills,
            'estimated_duration_minutes': self.estimated_duration_minutes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'challenge_count': len(self.challenges),
            'dataset_count': len(self.datasets) if self.datasets else 0,
            'business_domain': self.business_domain
        }

class ExerciseDataset(db.Model):
    """
    Datasets associés aux exercices pour les analystes de données
    """
    __tablename__ = 'exercise_datasets'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exercise_id = Column(String(36), db.ForeignKey('exercises.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    dataset_type = db.Column(db.Enum(DatasetType), nullable=False)
    file_path = db.Column(db.String(500))  # Chemin vers le fichier
    connection_string = db.Column(db.Text)  # Pour les bases de données
    sample_data = db.Column(db.JSON)  # Échantillon de données pour aperçu
    schema_definition = db.Column(db.JSON)  # Structure des données
    size_mb = db.Column(db.Float, default=0.0)
    row_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    exercise = db.relationship('Exercise', back_populates='datasets')
    
    def to_dict(self):
        return {
            'id': self.id,
            'exercise_id': self.exercise_id,
            'name': self.name,
            'description': self.description,
            'dataset_type': self.dataset_type.value,
            'file_path': self.file_path,
            'sample_data': self.sample_data,
            'schema_definition': self.schema_definition,
            'size_mb': self.size_mb,
            'row_count': self.row_count,
            'created_at': self.created_at.isoformat()
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
    
    # NOUVEAU: Environnement d'exécution
    execution_environment = db.Column(db.Enum(ExecutionEnvironment), 
                                    default=ExecutionEnvironment.CODE_EXECUTOR)
    
    # NOUVEAU: Configuration spécifique selon l'environnement
    environment_config = db.Column(db.JSON, default=dict)  # Configuration flexible
    
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
            'execution_environment': self.execution_environment.value,
            'environment_config': self.environment_config,
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
    
    # NOUVEAU: Contenu pour analystes
    notebook_template = db.Column(db.Text)  # Template Jupyter notebook
    sql_schema = db.Column(db.JSON)  # Schéma de base de données
    expected_output_type = db.Column(db.String(100))  # "visualization", "analysis", "query_result"
    
    # NOUVEAU: Contenu pour business analysts
    diagram_template = db.Column(db.Text)  # Template de diagramme
    diagram_type = db.Column(db.Enum(DiagramType))  # Type de diagramme attendu
    diagram_format = db.Column(db.Enum(DiagramFormat))  # Format de sauvegarde
    business_requirements = db.Column(db.JSON)  # Exigences business
    
    # Nouveaux champs pour secrétaires
    document_template = db.Column(db.Text)  # Template de document
    document_format = db.Column(db.Enum(DocumentFormat))  # Format attendu
    text_requirements = db.Column(db.JSON)  # Exigences de rédaction
    formatting_rules = db.Column(db.JSON)  # Règles de formatage
    
    # Nouveaux champs pour comptables
    financial_template = db.Column(db.Text)  # Template financier
    financial_document_type = db.Column(db.Enum(FinancialDocumentType))  # Type de document
    accounting_rules = db.Column(db.JSON)  # Règles comptables
    calculation_parameters = db.Column(db.JSON)  # Paramètres de calcul
    
    order_index = db.Column(db.Integer, nullable=False)
    is_final_step = db.Column(db.Boolean, default=False)
    
    # NOUVEAU: Configuration d'évaluation
    evaluation_criteria = db.Column(db.JSON, default=dict)  # Critères d'évaluation flexibles
    
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
            'notebook_template': self.notebook_template,
            'sql_schema': self.sql_schema,
            'expected_output_type': self.expected_output_type,
            'diagram_template': self.diagram_template,
            'diagram_type': self.diagram_type.value if self.diagram_type else None,
            'diagram_format': self.diagram_format.value if self.diagram_format else None,
            'business_requirements': self.business_requirements,
            'document_template': self.document_template,
            'document_format': self.document_format.value if self.document_format else None,
            'text_requirements': self.text_requirements,
            'formatting_rules': self.formatting_rules,
            'financial_template': self.financial_template,
            'financial_document_type': self.financial_document_type.value if self.financial_document_type else None,
            'accounting_rules': self.accounting_rules,
            'calculation_parameters': self.calculation_parameters,
            'order_index': self.order_index,
            'is_final_step': self.is_final_step,
            'evaluation_criteria': self.evaluation_criteria,
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
    
    testcase_type = db.Column(db.Enum(TestcaseType), nullable=False, default=TestcaseType.UNIT_TEST)


    input_data = db.Column(db.Text, nullable=True)  # JSON string or plain text
    expected_output = db.Column(db.Text, nullable=True)
    
    # NOUVEAU: Tests pour analystes
    dataset_reference = db.Column(db.String(255))  # Référence au dataset à utiliser
    sql_query_expected = db.Column(db.Text)  # Requête SQL attendue
    expected_visualization = db.Column(db.JSON)  # Structure de visualisation attendue
    statistical_assertions = db.Column(db.JSON)  # Assertions statistiques
    
    numerical_tolerance = Column(Float, nullable=True, default=0.001)
    
    # 🆕 Nouveaux champs pour les tests de cellule notebook
    notebook_cell_output = Column(JSON, nullable=True)
    cell_type = Column(String, nullable=True, default='code')
    
    expected_document_structure = db.Column(db.JSON)  # Structure attendue
    text_quality_criteria = db.Column(db.JSON)  # Critères de qualité
    formatting_validation = db.Column(db.JSON)  # Validation formatage
    
    # Nouveaux champs pour tests comptables
    expected_financial_result = db.Column(db.JSON)  # Résultat financier attendu
    accounting_validation_rules = db.Column(db.JSON)  # Règles de validation
    calculation_steps = db.Column(db.JSON) 
    
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
            'testcase_type': self.testcase_type.value,
            'input_data': self.input_data,
            'dataset_reference': self.dataset_reference,
            'numerical_tolerance': self.numerical_tolerance,
            'cell_type': self.cell_type, 
            'expected_document_structure': self.expected_document_structure,
            'text_quality_criteria': self.text_quality_criteria,
            'formatting_validation': self.formatting_validation,
            'expected_financial_result': self.expected_financial_result,
            'accounting_validation_rules': self.accounting_validation_rules,
            'calculation_steps': self.calculation_steps,
            'is_hidden': self.is_hidden,
            'is_example': self.is_example,
            'timeout_seconds': self.timeout_seconds,
            'memory_limit_mb': self.memory_limit_mb,
            'order_index': self.order_index,
            'created_at': self.created_at.isoformat()
        }
        
            # Only show expected output to admins or when explicitly requested
        if show_hidden or not self.is_hidden:
            # Pour les tests de cellule notebook, exposer notebook_cell_output
            if self.testcase_type.value == 'notebook_cell_test':
                result['notebook_cell_output'] = self.notebook_cell_output
                # Pour les notebooks, expected_output peut être None ou utilisé différemment
                result['expected_output'] = self.expected_output

            # Pour les tests SQL
            elif self.testcase_type.value == 'sql_query_test':
                result['sql_query_expected'] = self.sql_query_expected
                result['expected_output'] = self.expected_output

            # Pour les tests de visualisation  
            elif self.testcase_type.value == 'visualization_test':
                result['expected_visualization'] = self.expected_visualization
                result['expected_output'] = self.expected_output

            # Pour les tests statistiques
            elif self.testcase_type.value == 'statistical_test':
                result['statistical_assertions'] = self.statistical_assertions
                result['expected_output'] = self.expected_output

            # Pour les tests unitaires classiques
            else:
                result['expected_output'] = self.expected_output

        else:
            # Si caché et pas d'autorisation, ne pas exposer les données sensibles
            # Mais garder les champs de structure pour la validation côté client
            result.update({
                'expected_output': None,
                'notebook_cell_output': None,
                'sql_query_expected': None,
                'expected_visualization': None,
                'statistical_assertions': None
            })
            
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
    
    session_metadata = db.Column(db.JSON, default=dict)  # Informations de contexte
    
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
            'session_metadata': self.session_metadata,
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
    
     # NOUVEAU: Contenu pour analystes
    notebook_content = db.Column(db.JSON)  # Contenu Jupyter notebook
    sql_queries = db.Column(db.JSON)  # Requêtes SQL soumises
    analysis_results = db.Column(db.JSON)  # Résultats d'analyse
    visualizations = db.Column(db.JSON)  # Données de visualisation
    
    # NOUVEAU: Contenu pour business analysts  
    diagram_content = db.Column(db.JSON)  # Contenu du diagramme
    diagram_metadata = db.Column(db.JSON)  # Métadonnées (format, version, etc.)
    
    is_completed = db.Column(db.Boolean, default=False)
    tests_passed = db.Column(db.Integer, default=0)
    tests_total = db.Column(db.Integer, default=0)
    last_execution_result = db.Column(db.JSON)  # Store last execution details
    last_edited = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    requires_manual_review = db.Column(db.Boolean, default=False)
    manual_review_status = db.Column(db.String(50), default='pending')  # pending, reviewed, approved
    manual_score = db.Column(db.Float, nullable=True)  # Score manuel du recruteur
    manual_feedback = db.Column(db.Text, nullable=True)  # Commentaires du recruteur
    reviewer_id = db.Column(db.String(36), nullable=True)  # ID du recruteur
    reviewed_at = db.Column(db.DateTime, nullable=True)
    
    # Score final = score automatique + score manuel
    final_score = db.Column(db.Float, nullable=True)
    
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
            'notebook_content': self.notebook_content,
            'sql_queries': self.sql_queries,
            'analysis_results': self.analysis_results,
            'visualizations': self.visualizations,
            'diagram_content': self.diagram_content,
            'diagram_metadata': self.diagram_metadata,
            'is_completed': self.is_completed,
            'tests_passed': self.tests_passed,
            'tests_total': self.tests_total,
            'last_execution_result': self.last_execution_result,
            'last_edited': self.last_edited.isoformat(),
            'requires_manual_review': self.requires_manual_review,
            'manual_review_status': self.manual_review_status,
            'manual_score': self.manual_score,
            'manual_feedback': self.manual_feedback,
            'reviewer_id': self.reviewer_id,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'final_score': self.final_score
        }
