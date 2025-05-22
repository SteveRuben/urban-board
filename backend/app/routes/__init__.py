# backend/app/routes/__init__.py
from flask import Blueprint

# Créer les blueprints pour les différentes fonctionnalités
interview_bp = Blueprint('interview', __name__, url_prefix='/api/interviews')
resume_bp = Blueprint('resume', __name__, url_prefix='/api/resumes')
user_bp = Blueprint('user', __name__, url_prefix='/api/users')
job_postings_bp = Blueprint('job_postings_routes', __name__, url_prefix='/api/job-postings')

# Importer les routes
from . import interview, resume, user, job_posting_routes
