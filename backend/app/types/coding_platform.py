from enum import Enum

class ExerciseCategory(Enum):
    """Catégorie d'exercice pour différencier les types de tests"""
    DEVELOPER = "developer"
    DATA_ANALYST = "data_analyst"
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