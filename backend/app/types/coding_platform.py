from enum import Enum


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

# Judge0 language IDs mapping
LANGUAGE_IDS = {
    ProgrammingLanguage.PYTHON: 71,  # Python 3.8.1
    ProgrammingLanguage.JAVASCRIPT: 63,  # JavaScript (Node.js 12.14.0)
    ProgrammingLanguage.JAVA: 62,  # Java (OpenJDK 13.0.1)
    ProgrammingLanguage.CPP: 54,  # C++ (GCC 9.2.0)
    ProgrammingLanguage.C: 50,  # C (GCC 9.2.0)
}