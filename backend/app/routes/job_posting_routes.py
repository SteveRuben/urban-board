import os
import re
from uuid import UUID
from flask import g, request, jsonify, abort, current_app, send_from_directory, url_for
from app.models.job_posting import JobPosting, JobApplication
from app.routes.user import token_required
from app.services.job_posting_service import JobPostingService
from . import job_postings_bp
from werkzeug.utils import secure_filename

job_posting_service = JobPostingService()

def get_current_user_id():
    """Retourne l'ID utilisateur actuel sous forme de string"""
    return str(g.current_user.user_id)

@job_postings_bp.route('', methods=['POST'])
@token_required
def create_job_posting():
    """Crée une nouvelle offre d'emploi"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    # Validation basique des champs obligatoires
    required_fields = ['title', 'description']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"Le champ '{field}' est obligatoire"}), 400
    
    organization_id = g.current_user.current_organization_id
    
    job_posting = job_posting_service.create_job_posting(organization_id, user_id, data)
    return jsonify(job_posting.to_dict()), 201

@job_postings_bp.route('', methods=['GET'])
@token_required
def get_job_postings():
    """Récupère la liste des offres d'emploi avec filtrage et pagination"""
    user_id = get_current_user_id()  
    
    # Paramètres de filtrage et pagination
    status = request.args.get('status')
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))
    
    job_postings, total = job_posting_service.get_job_postings(
        status=status,
        user_id=user_id,
        limit=limit,
        offset=offset
    )
    
    result = {
        'data': [job.to_dict() for job in job_postings],
        'pagination': {
            'total': total,
            'limit': limit,
            'offset': offset
        }
    }
    
    return jsonify(result), 200

@job_postings_bp.route('/<job_id>', methods=['GET'])
@token_required
def get_job_posting(job_id):
    """Récupère les détails d'une offre d'emploi spécifique"""
    user_id = get_current_user_id()  
    
    job_posting = job_posting_service.get_job_posting(job_id, user_id)
    return jsonify(job_posting.to_dict()), 200


@job_postings_bp.route('/<job_id>', methods=['PUT'])
@token_required
def update_job_posting(job_id):
    """Met à jour une offre d'emploi existante"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    # Validation de base
    if not data:
        return jsonify({"error": "Aucune donnée fournie"}), 400
    
    try:
        # Cas spécial : mise à jour du statut uniquement
        if 'status' in data and len(data) == 1:
            job_posting = job_posting_service.update_job_status(job_id, data['status'], user_id)
            return jsonify(job_posting.to_dict()), 200
        
        # Sinon, c'est une mise à jour complète
        job_posting = job_posting_service.update_job_posting(job_id, user_id, data)
        return jsonify(job_posting.to_dict()), 200
        
    except Exception as e:
        # Gestion d'erreur au niveau route pour les erreurs non-HTTP
        print(f"Erreur dans update_job_posting route: {e}")
        return jsonify({"error": "Erreur lors de la mise à jour"}), 500
    

@job_postings_bp.route('/<job_id>', methods=['DELETE'])
@token_required
def delete_job_posting(job_id):
    """Supprime une offre d'emploi"""
    user_id = get_current_user_id()  
    
    result = job_posting_service.delete_job_posting(job_id, user_id)
    return jsonify({"success": result}), 200

@job_postings_bp.route('/<job_id>/publish', methods=['PUT'])
@token_required
def publish_job_posting(job_id):
    """Publie une offre d'emploi (change son statut de 'draft' à 'published')"""
    user_id = get_current_user_id()  
    
    job_posting = job_posting_service.publish_job_posting(job_id, user_id)
    return jsonify(job_posting.to_dict()), 200

@job_postings_bp.route('/<job_id>/close', methods=['PUT'])
@token_required
def close_job_posting(job_id):
    """Ferme une offre d'emploi (change son statut à 'closed')"""
    user_id = get_current_user_id()  
    
    job_posting = job_posting_service.close_job_posting(job_id, user_id)
    return jsonify(job_posting.to_dict()), 200

@job_postings_bp.route('/public', methods=['GET'])
def get_public_job_postings():
    """Récupère les offres d'emploi publiques (sans authentification)"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        # Récupérer les filtres
        filters = {}
        if request.args.get('location'):
            filters['location'] = request.args.get('location')
        if request.args.get('employment_type'):
            filters['employment_type'] = request.args.get('employment_type')
        if request.args.get('remote_policy'):
            filters['remote_policy'] = request.args.get('remote_policy')
        if request.args.get('salary_min'):
            filters['salary_min'] = int(request.args.get('salary_min'))
        if request.args.get('salary_max'):
            filters['salary_max'] = int(request.args.get('salary_max'))
        if request.args.get('keywords'):
            filters['keywords'] = request.args.get('keywords')
        
        result = job_posting_service.get_public_job_postings(page, per_page, filters)
        return jsonify(result), 200
            
    except Exception as e:
        print(f"Erreur dans get_public_job_postings: {e}")
        return jsonify({'error': 'Erreur lors de la récupération des offres'}), 500

@job_postings_bp.route('/public/<job_id>', methods=['GET'])
def get_public_job_posting_details(job_id):
    """Récupère les détails d'une offre d'emploi publique (sans authentification)"""
    try:
        job = job_posting_service.get_job_posting_details(job_id)
        return jsonify(job.to_dict()), 200
            
    except Exception as e:
        print(f"Erreur dans get_public_job_posting_details: {e}")
        return jsonify({'error': 'Offre d\'emploi non trouvée'}), 404

@job_postings_bp.route('/public/<job_id>/apply', methods=['POST'])
def apply_to_job_posting(job_id):
    """Permet de postuler à une offre d'emploi (sans authentification)"""
    try:
        data = request.get_json()
        
        # Validation des données requises
        required_fields = ['candidate_name', 'candidate_email']
        for field in required_fields:
            if not data.get(field) or not data[field].strip():
                return jsonify({'error': f'Le champ {field} est requis'}), 400
        
        # Validation de l'email
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data['candidate_email']):
            return jsonify({'error': 'Format d\'email invalide'}), 400
        
        application = job_posting_service.create_application(job_id, data)
        
        return jsonify({
            'success': True,
            'message': 'Candidature envoyée avec succès',
            'application_id': application.id
        }), 201
            
    except Exception as e:
        print(f"Erreur dans apply_to_job_posting: {e}")
        return jsonify({'error': str(e)}), 400


@job_postings_bp.route('/<job_id>/applications', methods=['GET'])
@token_required
def get_job_posting_applications(job_id):
    """Récupère les candidatures pour une offre d'emploi (authentifié)"""
    try:
        user_id = get_current_user_id()
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        applications, total = job_posting_service.get_applications_for_job(
            job_id, user_id, limit, offset
        )
        
        # Récupérer aussi les détails de l'offre d'emploi
        job = JobPosting.query.get(job_id)
        
        result = {
            'data': [
                {
                    'id': app.id,
                    'candidate_name': app.candidate_name,
                    'candidate_email': app.candidate_email,
                    'candidate_phone': app.candidate_phone,
                    'resume_url': app.resume_url,
                    'cover_letter': app.cover_letter,
                    'status': app.status,
                    'notes': app.notes,
                    'source': app.source,
                    'created_at': app.created_at.isoformat(),
                    'updated_at': app.updated_at.isoformat()
                }
                for app in applications
            ],
            'job_posting': job.to_dict() if job else None,
            'pagination': {
                'total': total,
                'limit': limit,
                'offset': offset
            }
        }
        
        return jsonify(result), 200
            
    except Exception as e:
        print(f"Erreur dans get_job_posting_applications: {e}")
        return jsonify({'error': str(e)}), 403

@job_postings_bp.route('/applications/<application_id>', methods=['GET'])
@token_required
def get_job_application_details(application_id):
    """Récupère les détails d'une candidature (authentifié)"""
    try:
        user_id = get_current_user_id()
        
        application = job_posting_service.get_application_details(application_id, user_id)
        
        result = {
            'id': application.id,
            'candidate_name': application.candidate_name,
            'candidate_email': application.candidate_email,
            'candidate_phone': application.candidate_phone,
            'resume_url': application.resume_url,
            'cover_letter': application.cover_letter,
            'status': application.status,
            'notes': application.notes,
            'source': application.source,
            'created_at': application.created_at.isoformat(),
            'updated_at': application.updated_at.isoformat(),
            'job_posting': application.job_posting.to_dict()
        }
        
        return jsonify(result), 200
            
    except Exception as e:
        print(f"Erreur dans get_job_application_details: {e}")
        return jsonify({'error': str(e)}), 404

@job_postings_bp.route('/applications/<application_id>/status', methods=['PUT'])
@token_required
def update_job_application_status(application_id):
    """Met à jour le statut d'une candidature (authentifié)"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if not data or not data.get('status'):
            return jsonify({'error': 'Le statut est requis'}), 400
        
        application = job_posting_service.update_application_status(
            application_id, 
            user_id, 
            data['status'], 
            data.get('notes')
        )
        
        return jsonify({
            'success': True,
            'message': 'Statut mis à jour avec succès',
            'application': {
                'id': application.id,
                'status': application.status,
                'notes': application.notes,
                'updated_at': application.updated_at.isoformat()
            }
        }), 200
            
    except Exception as e:
        print(f"Erreur dans update_job_application_status: {e}")
        return jsonify({'error': str(e)}), 400
 
@job_postings_bp.route('/upload/resume', methods=['POST'])
def upload_resume():
    """
    Upload un fichier CV via le service
    """
    try:
        # Vérifier si un fichier a été envoyé
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'Aucun fichier fourni'
            }), 400
            
        file = request.files['file']
        
        # Vérifier si un fichier a été sélectionné
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Aucun fichier sélectionné'
            }), 400
        
        # CORRECTION: Vérifier que le fichier n'est pas vide avant traitement
        file.seek(0, 2)  # Aller à la fin
        if file.tell() == 0:  # Si la position est 0, le fichier est vide
            return jsonify({
                'success': False,
                'error': 'Le fichier est vide'
            }), 400
        file.seek(0)  # Remettre au début
        
        # Utiliser le service pour l'upload
        job_service = JobPostingService()
        file_url = job_service.upload_resume(file)
        
        return jsonify({
            'success': True,
            'message': 'CV uploadé avec succès',
            'file_url': file_url
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'upload du CV: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@job_postings_bp.route('/applications/<application_id>/resume', methods=['GET'])
@token_required
def download_application_resume(application_id):
    """
    Télécharge le CV d'une candidature (authentifié)
    """
    try:
        current_user_id = get_current_user_id()
        preview = request.args.get('preview', 'false').lower() == 'true'
        
        job_service = JobPostingService()
        return job_service.get_application_resume(current_user_id, application_id, preview)
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'accès au CV {application_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@job_postings_bp.route('/applications/<application_id>/resume/url', methods=['GET'])
@token_required
def get_application_resume_url(application_id):
    """
    Récupère l'URL sécurisée pour accéder au CV d'une candidature
    """
    try:
        current_user_id = get_current_user_id()
        
        job_service = JobPostingService()
        return job_service.get_application_resume_urls(current_user_id, application_id)
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la génération de l'URL CV {application_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@job_postings_bp.route('/resumes/<filename>')
def serve_resume_file(filename):
    """
    Sert les fichiers CV uploadés
    """
    try:
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'app/static/uploads')
        resumes_folder = os.path.join(upload_folder, 'resumes')
        
        # Sécuriser le nom du fichier
        secure_name = secure_filename(filename)
        
        # Vérifier que le fichier existe et n'est pas vide
        file_path = os.path.join(resumes_folder, secure_name)
        if not os.path.exists(file_path):
            return jsonify({'error': 'Fichier non trouvé'}), 404
        
        if os.path.getsize(file_path) == 0:
            return jsonify({'error': 'Fichier vide'}), 404
        
        return send_from_directory(resumes_folder, secure_name)
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors du service du fichier {filename}: {str(e)}")
        return jsonify({'error': 'Fichier non trouvé'}), 404


@job_postings_bp.route('/upload/file', methods=['POST'])
@token_required
def upload_job_posting_file():
    """
    Upload un fichier d'offre d'emploi
    """
    try:
        # Vérifier si un fichier a été envoyé
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'Aucun fichier fourni'
            }), 400
            
        file = request.files['file']
        
        # Vérifier si un fichier a été sélectionné
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Aucun fichier sélectionné'
            }), 400
        
        # Vérifier que le fichier n'est pas vide avant traitement
        file.seek(0, 2)  # Aller à la fin
        if file.tell() == 0:  # Si la position est 0, le fichier est vide
            return jsonify({
                'success': False,
                'error': 'Le fichier est vide'
            }), 400
        file.seek(0)  # Remettre au début
        
        # Utiliser le service pour l'upload
        job_service = JobPostingService()
        file_url = job_service.upload_job_posting_file(file)
        
        return jsonify({
            'success': True,
            'message': 'Fichier d\'offre uploadé avec succès',
            'file_url': file_url,
            'filename': file.filename
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'upload du fichier d'offre: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@job_postings_bp.route('/create-from-file', methods=['POST'])
@token_required
def create_job_posting_from_file():
    """
    Crée une offre d'emploi à partir d'un fichier uploadé
    """
    try:
        user_id = get_current_user_id()
        organization_id = g.current_user.current_organization_id
        data = request.get_json()
        
        # Validation des champs obligatoires
        required_fields = ['title', 'file_url']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Le champ '{field}' est obligatoire"}), 400
        
        # Données supplémentaires optionnelles
        additional_data = {}
        optional_fields = [
            'requirements', 'responsibilities', 'location', 
            'employment_type', 'remote_policy', 'salary_range_min', 
            'salary_range_max', 'salary_currency'
        ]
        
        for field in optional_fields:
            if field in data and data[field]:
                additional_data[field] = data[field]
        
        # Créer l'offre d'emploi
        job_service = JobPostingService()
        job_posting = job_service.create_job_posting_from_file(
            organization_id, 
            user_id, 
            data['title'], 
            data['file_url'],
            additional_data
        )
        
        return jsonify({
            'success': True,
            'message': 'Offre d\'emploi créée avec succès à partir du fichier',
            'job_posting': job_posting.to_dict()
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la création d'offre depuis fichier: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@job_postings_bp.route('/<job_id>/file', methods=['GET'])
@token_required
def download_job_posting_file(job_id):
    """
    Télécharge le fichier d'une offre d'emploi (authentifié)
    """
    try:
        current_user_id = get_current_user_id()
        preview = request.args.get('preview', 'false').lower() == 'true'
        
        job_service = JobPostingService()
        return job_service.get_job_posting_file(current_user_id, job_id, preview)
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'accès au fichier d'offre {job_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@job_postings_bp.route('/<job_id>/file/url', methods=['GET'])
@token_required
def get_job_posting_file_url(job_id):
    """
    Récupère l'URL sécurisée pour accéder au fichier d'une offre d'emploi
    """
    try:
        current_user_id = get_current_user_id()
        
        # Récupérer l'offre d'emploi
        job = JobPosting.query.filter(JobPosting.id == job_id).first()
        
        if not job:
            return jsonify({'error': 'Offre d\'emploi non trouvée'}), 404
        
        if not job.source_url or job.source != 'uploaded_file':
            return jsonify({'file_available': False}), 200
        
        # Vérifier les permissions
        job_service = JobPostingService()
        if not job_service._check_job_file_access_permission(current_user_id, job):
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        # Générer les URLs sécurisées
        download_url = url_for(
            'job_postings_routes.download_job_posting_file', 
            job_id=job_id, 
            _external=True
        )
        
        preview_url = url_for(
            'job_postings_routes.download_job_posting_file', 
            job_id=job_id, 
            preview='true',
            _external=True
        )
        
        return jsonify({
            'file_available': True,
            'download_url': download_url,
            'preview_url': preview_url,
            'filename': job.source_url.split('/')[-1] if job.source_url else None
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la génération de l'URL fichier d'offre {job_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@job_postings_bp.route('/job-files/<filename>')
def serve_job_posting_file(filename):
    """
    Sert les fichiers d'offres d'emploi uploadés
    """
    try:
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'app/static/uploads')
        job_files_folder = os.path.join(upload_folder, 'job_postings')
        
        # Sécuriser le nom du fichier
        secure_name = secure_filename(filename)
        
        # Vérifier que le fichier existe et n'est pas vide
        file_path = os.path.join(job_files_folder, secure_name)
        if not os.path.exists(file_path):
            return jsonify({'error': 'Fichier non trouvé'}), 404
        
        if os.path.getsize(file_path) == 0:
            return jsonify({'error': 'Fichier vide'}), 404
        
        return send_from_directory(job_files_folder, secure_name)
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors du service du fichier d'offre {filename}: {str(e)}")
        return jsonify({'error': 'Fichier non trouvé'}), 404
    
    