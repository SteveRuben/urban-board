from enum import Enum

class ExerciseCategory(Enum):
    """Catégorie d'exercice pour différencier les types de tests"""
    DEVELOPER = "developer"
    DATA_ANALYST = "data_analyst"
    BUSINESS_ANALYST = "business_analyst"
    SECRETARY = "secretary"
    ACCOUNTANT = "accountant"
    # Extensible pour d'autres catégories futures
    # UX_DESIGNER = "ux_designer"
    # PROJECT_MANAGER = "project_manager"


class ChallengeStatus(Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class ChallengeDifficulty(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class UserChallengeStatus(Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"

class ProgrammingLanguage(Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    CPP = "cpp"
    C = "c"
    
    # Langages spécifiques à l'analyse de données
    SQL = "sql"
    R = "r"
    SCALA = "scala"
    
    # Notebooks et environnements
    JUPYTER_PYTHON = "jupyter_python"
    JUPYTER_R = "jupyter_r"

# Judge0 language IDs mapping
LANGUAGE_IDS = {
    ProgrammingLanguage.PYTHON: 71,  # Python 3.8.1
    ProgrammingLanguage.JAVASCRIPT: 63,  # JavaScript (Node.js 12.14.0)
    ProgrammingLanguage.JAVA: 62,  # Java (OpenJDK 13.0.1)
    ProgrammingLanguage.CPP: 54,  # C++ (GCC 9.2.0)
    ProgrammingLanguage.C: 50,  # C (GCC 9.2.0)
}

class ExecutionEnvironment(Enum):
    """Types d'environnement d'exécution"""
    CODE_EXECUTOR = "code_executor"      # Judge0 pour code classique
    JUPYTER_NOTEBOOK = "jupyter_notebook" # JupyterLab pour notebooks
    SQL_DATABASE = "sql_database"        # Base de données pour SQL
    DATA_VISUALIZATION = "data_visualization" # Validation de graphiques
    FILE_ANALYSIS = "file_analysis"      # Analyse de fichiers (CSV, Excel, etc.)
    DIAGRAM_EDITOR = "diagram_editor"
    TEXT_EDITOR = "text_editor"
    SPREADSHEET_EDITOR = "spreadsheet_editor"

class TestcaseType(Enum):
    """Types de cas de test selon l'environnement"""
    # Pour développeurs
    UNIT_TEST = "unit_test"              # Test classique input/output
    INTEGRATION_TEST = "integration_test" # Test d'intégration
    
    # Pour analystes de données
    SQL_QUERY_TEST = "sql_query_test"    # Test de requête SQL
    DATASET_ANALYSIS = "dataset_analysis" # Analyse de dataset
    VISUALIZATION_TEST = "visualization_test" # Test de visualisation
    NOTEBOOK_CELL_TEST = "notebook_cell_test" # Test de cellule notebook
    STATISTICAL_TEST = "statistical_test" # Test statistique
    DATA_CLEANING_TEST = "data_cleaning_test" # Test de nettoyage de données
    
    # Pour business analysts
    PROCESS_DIAGRAM = "process_diagram"
    USE_CASE_DIAGRAM = "use_case_diagram"
    SEQUENCE_DIAGRAM = "sequence_diagram"
    CLASS_DIAGRAM = "class_diagram"
    ACTIVITY_DIAGRAM = "activity_diagram"
    FLOWCHART = "flowchart"
    WIREFRAME = "wireframe",
    # Nouveaux tests pour secrétaires
    TEXT_FORMATTING_TEST = "text_formatting_test"
    SPELLING_GRAMMAR_TEST = "spelling_grammar_test"
    DOCUMENT_STRUCTURE_TEST = "document_structure_test"
    CORRESPONDENCE_TEST = "correspondence_test"
    PROOFREADING_TEST = "proofreading_test"
    
    # Nouveaux tests pour comptables
    ACCOUNTING_CALCULATION_TEST = "accounting_calculation_test"
    FINANCIAL_ANALYSIS_TEST = "financial_analysis_test"
    BUDGET_VALIDATION_TEST = "budget_validation_test"
    BALANCE_SHEET_TEST = "balance_sheet_test"
    TAX_CALCULATION_TEST = "tax_calculation_test"
    AUDIT_TRAIL_TEST = "audit_trail_test"

class DatasetType(Enum):
    """Types de datasets pour les tests"""
    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"
    SQLITE = "sqlite"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    PARQUET = "parquet"
    
class VisualizationType(Enum):
    """Types de visualisations attendues"""
    BAR_CHART = "bar_chart"
    LINE_CHART = "line_chart"
    SCATTER_PLOT = "scatter_plot"
    HISTOGRAM = "histogram"
    PIE_CHART = "pie_chart"
    HEATMAP = "heatmap"
    BOX_PLOT = "box_plot"
    DASHBOARD = "dashboard"

class DiagramType(Enum):
    """Types de diagrammes pour business analysts"""
    UML_USE_CASE = "uml_use_case"
    UML_SEQUENCE = "uml_sequence"
    UML_CLASS = "uml_class"
    UML_ACTIVITY = "uml_activity"
    BPMN_PROCESS = "bpmn_process"
    FLOWCHART = "flowchart"
    WIREFRAME = "wireframe"
    ENTITY_RELATIONSHIP = "entity_relationship"
    MOCKUP = "mockup"

class DiagramFormat(Enum):
    """Formats de sauvegarde des diagrammes"""
    STARUML = "staruml"  # .mdj
    DRAWIO = "drawio"    # .drawio
    SVG = "svg"
    PNG = "png"
    JSON = "json"        # Format propriétaire
    
class DocumentFormat(Enum):
    """Formats de documents pour les tests de rédaction"""
    WORD = "word"
    PDF = "pdf"
    PLAIN_TEXT = "plain_text"
    HTML = "html"
    MARKDOWN = "markdown"
    RTF = "rtf"

class FinancialDocumentType(Enum):
    """Types de documents financiers"""
    BALANCE_SHEET = "balance_sheet"
    INCOME_STATEMENT = "income_statement"
    CASH_FLOW = "cash_flow"
    BUDGET = "budget"
    INVOICE = "invoice"
    EXPENSE_REPORT = "expense_report"
    TAX_RETURN = "tax_return"