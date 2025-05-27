# backend/services/job_posting_service.py
import uuid
from ..services.email_service import EmailService
from flask import abort,current_app, url_for, jsonify, send_file
import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime, timedelta, timezone
from app import db
from ..models.job_posting import JobApplication, JobPosting
from ..models.user import User
from ..services.ai_service import AIService
from sqlalchemy import and_, or_
from sqlalchemy.orm import joinedload
from werkzeug.utils import secure_filename

class JobPostingService:
    """Service pour gérer les postes à pourvoir"""
    
    def __init__(self):
        self.ai_service = AIService()
        self.email_service = EmailService()

        # Configuration pour l'upload de fichiers
        self.upload_folder = os.environ.get('UPLOAD_FOLDER', 'uploads/job_files')
        self.allowed_extensions = {'.pdf', '.doc', '.docx', '.txt'}
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        
        # Créer le dossier d'upload s'il n'existe pas
        os.makedirs(self.upload_folder, exist_ok=True)
    
    def create_job_posting(self, organization_id, user_id, data):
        """
        Crée un nouveau poste à pourvoir
        
        Args:
            organization_id: ID de l'organisation
            user_id: ID de l'utilisateur qui crée le poste
            data: Données du poste
            
        Returns:
            Le JobPosting créé
        """
        job = JobPosting(
            organization_id=organization_id,
            created_by=user_id,
            title=data.get('title'),
            description=data.get('description'),
            requirements=data.get('requirements'),
            responsibilities=data.get('responsibilities'),
            location=data.get('location'),
            employment_type=data.get('employment_type'),
            remote_policy=data.get('remote_policy'),
            salary_range_min=data.get('salary_range_min'),
            salary_range_max=data.get('salary_range_max'),
            salary_currency=data.get('salary_currency', 'EUR'),
            status=data.get('status', 'draft'),
            source_url=data.get('source_url'),
        )
        
        # Si le poste est publié directement, définir la date de publication
        if job.status == 'published':
            job.published_at = datetime.utcnow()
            
            # Définir une date de clôture par défaut (+30 jours)
            if not data.get('closes_at'):
                job.closes_at = datetime.utcnow() + timedelta(days=30)
        
        # Générer automatiquement des mots-clés et des compétences avec l'IA
        if job.description:
            job.keywords = self.ai_service.extract_keywords(job.description)
            job.skills = self.ai_service.extract_skills(job.description)
            
            # Générer une configuration pour l'entretien IA
            job.ai_interview_config = self.ai_service.generate_interview_config(
                job.title, job.description, job.requirements
            )
        
        db.session.add(job)
        db.session.commit()
        
        return job

    def import_from_website(self, organization_id, user_id, url, source_name='custom'):
        """
        Importe un poste depuis une URL
        
        Args:
            organization_id: ID de l'organisation
            user_id: ID de l'utilisateur qui importe le poste
            url: URL de l'offre d'emploi
            source_name: Nom de la source (LinkedIn, Indeed, custom, etc.)
            
        Returns:
            Le JobPosting importé
        """
        try:
            # Récupérer le contenu de la page
            response = requests.get(url)
            response.raise_for_status()
            
            # Analyser le contenu selon la source
            if source_name == 'linkedin':
                job_data = self._parse_linkedin(response.text, url)
            elif source_name == 'indeed':
                job_data = self._parse_indeed(response.text, url)
            else:
                # Analyse générique avec l'IA
                job_data = self.ai_service.extract_job_data(response.text, url)
            
            # Compléter les données
            job_data.update({
                'source': source_name,
                'source_url': url,
                'status': 'draft'  # Toujours commencer comme brouillon pour validation
            })
            
            # Créer le poste
            return self.create_job_posting(organization_id, user_id, job_data)
            
        except Exception as e:
            raise ValueError(f"Erreur lors de l'importation: {str(e)}")
    
    def _parse_linkedin(self, html_content, url):
        """Parse une offre d'emploi LinkedIn"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extraction des données
        title = soup.find('h1', class_='top-card-layout__title').text.strip()
        company = soup.find('a', class_='topcard__org-name-link').text.strip()
        location = soup.find('span', class_='topcard__flavor--bullet').text.strip()
        
        # Description - généralement dans une div avec une classe spécifique
        description_div = soup.find('div', class_='description__text')
        description = description_div.get_text(separator='\n').strip() if description_div else ""
        
        # Extraire d'autres informations si disponibles
        employment_type = None
        try:
            criteria_list = soup.find_all('li', class_='description__job-criteria-item')
            for criteria in criteria_list:
                label = criteria.find('h3').text.strip()
                if 'Employment type' in label:
                    employment_type = criteria.find('span').text.strip()
        except:
            pass
        
        return {
            'title': title,
            'description': description,
            'location': location,
            'employment_type': employment_type,
            'external_id': url.split('/')[-1] if '/jobs/view/' in url else None
        }
    
    def _parse_indeed(self, html_content, url):
        """Parse une offre d'emploi Indeed"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extraction des données
        title = soup.find('h1', class_='jobsearch-JobInfoHeader-title').text.strip()
        company = soup.find('div', class_='jobsearch-InlineCompanyRating').text.strip()
        location = soup.find('div', class_='jobsearch-JobInfoHeader-subtitle').find_all('div')[1].text.strip()
        
        # Description
        description_div = soup.find('div', id='jobDescriptionText')
        description = description_div.get_text(separator='\n').strip() if description_div else ""
        
        # Extraire d'autres informations si disponibles
        job_type = None
        try:
            job_details = soup.find_all('div', class_='jobsearch-JobDescriptionSection-sectionItem')
            for detail in job_details:
                label = detail.find('div', class_='jobsearch-JobDescriptionSection-sectionItemKey').text.strip()
                if 'Job Type' in label:
                    job_type = detail.find('div', class_='jobsearch-JobDescriptionSection-sectionItemValue').text.strip()
        except:
            pass
        
        # Indeed utilise généralement une structure d'URL avec un paramètre jk pour l'ID du poste
        from urllib.parse import urlparse, parse_qs
        parsed_url = urlparse(url)
        query_params = parse_qs(parsed_url.query)
        external_id = query_params.get('jk', [None])[0]
        
        return {
            'title': title,
            'description': description,
            'location': location,
            'employment_type': job_type,
            'external_id': external_id
        }
    
    def update_job_status(self, job_id, new_status, user_id):
        """
        Met à jour le statut d'une offre d'emploi

        Args:
            job_id: ID de l'offre d'emploi
            new_status: Nouveau statut ('draft', 'published', 'closed')
            user_id: ID de l'utilisateur effectuant la modification

        Returns:
            Le JobPosting mis à jour

        Raises:
            ValueError: Si le changement de statut n'est pas autorisé
        """
        # Vérifier que l'offre existe et appartient à l'utilisateur
        job = JobPosting.query.filter_by(id=job_id, created_by=user_id).first()

        if not job:
            abort(403, description="Offre d'emploi non trouvée ou accès non autorisé")

        current_status = job.status

        # Règles de transition de statut
        if current_status == 'draft':
            if new_status not in ['published', 'draft']:
                abort(400, description="Une offre en brouillon ne peut être que publiée ou rester en brouillon")

            if new_status == 'published':
                job.published_at = datetime.utcnow()
                # Définir une date de clôture par défaut (+30 jours) si non spécifiée
                if not job.closes_at:
                    job.closes_at = datetime.utcnow() + timedelta(days=30)

        elif current_status == 'published':
            if new_status != 'closed':
                abort(400, description="Une offre publiée ne peut être que fermée")
            job.closes_at = datetime.utcnow()

        elif current_status == 'closed':
            abort(400, description="Une offre fermée ne peut plus changer de statut")

        job.status = new_status
        job.updated_at = datetime.utcnow()

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Erreur lors de la mise à jour du statut de l'offre: {e}")
            raise e

        return job

    def get_job_posting(self, job_id, user_id=None):
        """
        Récupère une offre d'emploi par son ID

        Args:
            job_id: ID de l'offre d'emploi
            user_id: ID de l'utilisateur (optionnel, pour vérifier les droits)

        Returns:
            Le JobPosting ou None si non trouvé
        """
        # Si un user_id est fourni, vérifier qu'il est le créateur de l'offre
        # Sinon, permettre l'accès à l'offre (cas d'une consultation publique)
        if user_id:
            job = JobPosting.query.filter_by(id=job_id, created_by=user_id).first()
            if not job:
                abort(403, description="Offre d'emploi non trouvée ou accès non autorisé")
        else:
            job = JobPosting.query.get(job_id)
            if not job:
                abort(404, description="Offre d'emploi non trouvée")

        return job

    def get_job_postings(self, organization_id=None, status=None, user_id=None, limit=20, offset=0):
        """
        Récupère une liste d'offres d'emploi avec filtres optionnels

        Args:
            organization_id: Filtre par organisation (optionnel)
            status: Filtre par statut ('draft', 'published', 'closed') (optionnel)
            user_id: Filtre par créateur (optionnel)
            limit: Nombre maximum d'offres à retourner
            offset: Décalage pour la pagination

        Returns:
            Liste de JobPosting et nombre total
        """
        query = JobPosting.query

        # Appliquer les filtres
        if organization_id:
            query = query.filter(JobPosting.organization_id == organization_id)

        if status:
            query = query.filter(JobPosting.status == status)

        if user_id:
            query = query.filter(JobPosting.created_by == user_id)

        # Récupérer le nombre total pour la pagination
        total_count = query.count()

        # Appliquer la pagination et trier par date de mise à jour
        jobs = query.order_by(JobPosting.updated_at.desc()).limit(limit).offset(offset).all()

        return jobs, total_count

    def delete_job_posting(self, job_id, user_id):
        """
        Supprime une offre d'emploi

        Args:
            job_id: ID de l'offre d'emploi
            user_id: ID de l'utilisateur effectuant la suppression

        Returns:
            True si supprimé avec succès

        Raises:
            ValueError: Si l'offre n'existe pas ou ne peut pas être supprimée
        """
        # Vérifier que l'offre existe et appartient à l'utilisateur
        job = JobPosting.query.filter_by(id=job_id, created_by=user_id).first()

        if not job:
            abort(403, description="Offre d'emploi non trouvée ou accès non autorisé")

        # Seules les offres en brouillon peuvent être supprimées
        if job.status != 'draft':
            abort(400, description="Seules les offres en brouillon peuvent être supprimées")

        try:
            db.session.delete(job)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Erreur lors de la suppression de l'offre: {e}")
            raise e

        return True

    def publish_job_posting(self, job_id, user_id):
        """
        Publie une offre d'emploi (change son statut de 'draft' à 'published')

        Args:
            job_id: ID de l'offre d'emploi
            user_id: ID de l'utilisateur effectuant la publication

        Returns:
            Le JobPosting mis à jour
        """
        return self.update_job_status(job_id, 'published', user_id)

    def close_job_posting(self, job_id, user_id):
        """
        Ferme une offre d'emploi (change son statut à 'closed')

        Args:
            job_id: ID de l'offre d'emploi
            user_id: ID de l'utilisateur effectuant la fermeture

        Returns:
            Le JobPosting mis à jour
        """
        return self.update_job_status(job_id, 'closed', user_id)

    def update_job_posting(self, job_id, user_id, data):
        """
        Met à jour une offre d'emploi complète

        Args:
            job_id: ID de l'offre à mettre à jour
            user_id: ID de l'utilisateur qui fait la modification
            data: Dictionnaire avec les nouvelles données

        Returns:
            JobPosting: Offre d'emploi mise à jour

        Raises:
            403: Si l'offre n'existe pas ou accès non autorisé
            400: Si les données sont invalides ou l'offre ne peut pas être modifiée
        """
        from flask import abort  # Import explicite pour éviter les conflits

        # Vérifier que l'offre existe et appartient à l'utilisateur
        job = JobPosting.query.filter_by(id=job_id, created_by=user_id).first()

        if not job:
            abort(403, description="Offre d'emploi non trouvée ou accès non autorisé")

        # Vérifier que l'offre peut être modifiée
        if job.status not in ['draft', 'published']:
            abort(400, description="Cette offre ne peut plus être modifiée")

        # Définir les champs autorisés selon le statut
        if job.status == 'draft':
            allowed_fields = [
                'title', 'description', 'requirements', 'responsibilities',
                'location', 'employment_type', 'remote_policy',
                'salary_range_min', 'salary_range_max', 'salary_currency',
                'closes_at', 'is_featured'
            ]
        else:
            allowed_fields = [
                'description', 'requirements', 'responsibilities',
                'closes_at', 'is_featured'
            ]

        # Validation des champs obligatoires
        if 'title' in data:
            if not data['title'] or not str(data['title']).strip():
                abort(400, description="Le titre est obligatoire")

        if 'description' in data:
            if not data['description'] or not str(data['description']).strip():
                abort(400, description="La description est obligatoire")

        # Validation du salaire
        if 'salary_range_min' in data and 'salary_range_max' in data:
            min_salary = data.get('salary_range_min')
            max_salary = data.get('salary_range_max')

            if min_salary and max_salary:
                try:
                    min_val = int(min_salary)
                    max_val = int(max_salary)
                    if min_val >= max_val:
                        abort(400, description="Le salaire minimum doit être inférieur au salaire maximum")
                except (ValueError, TypeError):
                    abort(400, description="Les valeurs de salaire doivent être des nombres")

        # Validation des types d'emploi
        valid_employment_types = ['full-time', 'part-time', 'contract', 'internship', 'freelance']
        if 'employment_type' in data and data['employment_type']:
            if data['employment_type'] not in valid_employment_types:
                abort(400, description=f"Type d'emploi invalide. Valeurs autorisées: {', '.join(valid_employment_types)}")

        # Validation des politiques de télétravail
        valid_remote_policies = ['remote', 'hybrid', 'on-site']
        if 'remote_policy' in data and data['remote_policy']:
            if data['remote_policy'] not in valid_remote_policies:
                abort(400, description=f"Politique de télétravail invalide. Valeurs autorisées: {', '.join(valid_remote_policies)}")

        # Validation de la devise
        valid_currencies = ['EUR', 'USD', 'XAF', 'GBP', 'CAD']
        if 'salary_currency' in data and data['salary_currency']:
            if data['salary_currency'] not in valid_currencies:
                abort(400, description=f"Devise invalide. Valeurs autorisées: {', '.join(valid_currencies)}")

        # Traitement spécial pour la date de fermeture AVANT la boucle de mise à jour
        if 'closes_at' in data:
            closes_at_value = data['closes_at']

            # Si c'est une chaîne vide ou None, définir à None
            if not closes_at_value or closes_at_value == '':
                data['closes_at'] = None
            else:
                try:
                    if isinstance(closes_at_value, str):
                        # Gérer différents formats de date
                        date_str = closes_at_value.replace('Z', '')
                        if 'T' in date_str:
                            closes_at = datetime.fromisoformat(date_str)
                        else:
                            closes_at = datetime.strptime(date_str, '%Y-%m-%d')
                    else:
                        closes_at = closes_at_value

                    if closes_at <= datetime.utcnow():
                        abort(400, description="La date de fermeture doit être dans le futur")
                    data['closes_at'] = closes_at
                except (ValueError, TypeError):
                    abort(400, description="Format de date invalide pour la date de fermeture")

        # Mettre à jour les champs autorisés
        updated_fields = []
        for field in allowed_fields:
            if field in data:
                old_value = getattr(job, field)
                value = data[field]

                # Traitement spécial pour les champs texte
                if field in ['title', 'description', 'requirements', 'responsibilities', 'location']:
                    if value is not None:
                        value = str(value).strip()
                        if not value:  # Si le champ devient vide après strip
                            value = None

                # Traitement spécial pour les champs numériques
                elif field in ['salary_range_min', 'salary_range_max']:
                    if value == '' or value is None:
                        value = None
                    else:
                        try:
                            value = int(value) if value else None
                            if value is not None and value < 0:
                                abort(400, description=f"Le {field} doit être positif")
                        except (ValueError, TypeError):
                            abort(400, description=f"Valeur invalide pour {field}")

                # Traitement spécial pour les booléens
                elif field == 'is_featured':
                    if isinstance(value, str):
                        value = value.lower() in ['true', '1', 'yes', 'on']
                    else:
                        value = bool(value) if value is not None else False

                # Le champ closes_at a déjà été traité plus haut

                # Ne mettre à jour que si la valeur a changé
                if old_value != value:
                    setattr(job, field, value)
                    updated_fields.append(field)

        # Si aucun champ n'a été modifié, retourner l'offre telle quelle
        if not updated_fields:
            return job

        # Mettre à jour la date de modification
        job.updated_at = datetime.utcnow()

        # Si l'IA est disponible et la description/titre a changé, mettre à jour les mots-clés
        if ('description' in updated_fields or 'title' in updated_fields):
            try:
                if hasattr(self, 'ai_service') and self.ai_service and job.description:
                    # Extraire les nouveaux mots-clés
                    new_keywords = self.ai_service.extract_keywords(job.description)
                    if new_keywords:
                        job.keywords = new_keywords[:10]  # Limiter à 10 mots-clés

                    # Extraire les compétences
                    new_skills = self.ai_service.extract_skills(job.description)
                    if new_skills:
                        job.skills = new_skills

                    # Mettre à jour la configuration d'entretien si le titre a changé
                    if 'title' in updated_fields:
                        job.ai_interview_config = self.ai_service.generate_interview_config(
                            job.title, job.description, job.requirements
                        )
            except Exception as e:
                # Ne pas faire échouer la mise à jour si l'IA ne fonctionne pas
                print(f"Avertissement - Erreur lors de l'extraction des mots-clés: {e}")

        # Sauvegarder les modifications
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Erreur lors de la mise à jour de l'offre: {e}")
            # Utiliser raise au lieu d'abort pour les erreurs de DB
            raise Exception("Erreur interne lors de la mise à jour")

        return job
    
    def get_public_job_postings(self, page=1, per_page=20, filters=None):
        """
        Récupère les offres d'emploi publiques (status = 'published')
        
        Args:
            page: Numéro de la page
            per_page: Nombre d'éléments par page
            filters: Dictionnaire de filtres (location, employment_type, etc.)
            
        Returns:
            Dict avec les offres et métadonnées de pagination
        """
        try:
            # Base query pour les offres publiées
            query = JobPosting.query.filter(
                JobPosting.status == 'published'
            ).options(
                joinedload(JobPosting.organization),
                joinedload(JobPosting.creator)
            )
            
            # Appliquer les filtres si fournis
            if filters:
                if filters.get('location'):
                    query = query.filter(
                        JobPosting.location.ilike(f"%{filters['location']}%")
                    )
                
                if filters.get('employment_type'):
                    query = query.filter(
                        JobPosting.employment_type == filters['employment_type']
                    )
                
                if filters.get('remote_policy'):
                    query = query.filter(
                        JobPosting.remote_policy == filters['remote_policy']
                    )
                
                if filters.get('salary_min'):
                    query = query.filter(
                        JobPosting.salary_range_min >= filters['salary_min']
                    )
                
                if filters.get('salary_max'):
                    query = query.filter(
                        JobPosting.salary_range_max <= filters['salary_max']
                    )
                
                if filters.get('keywords'):
                    # Recherche dans le titre et la description
                    search_term = f"%{filters['keywords']}%"
                    query = query.filter(
                        or_(
                            JobPosting.title.ilike(search_term),
                            JobPosting.description.ilike(search_term)
                        )
                    )
            
            # Ordonner par date de publication décroissante
            query = query.order_by(JobPosting.published_at.desc())
            
            # Paginer les résultats
            paginated = query.paginate(
                page=page, 
                per_page=per_page, 
                error_out=False
            )
            
            return {
                'data': [job.to_dict() for job in paginated.items],
                'pagination': {
                    'total': paginated.total,
                    'limit': per_page,
                    'offset': (page - 1) * per_page,
                    'page': page,
                    'pages': paginated.pages,
                    'has_next': paginated.has_next,
                    'has_prev': paginated.has_prev
                }
            }
        except Exception as e:
            print(f"Erreur lors de la récupération des offres publiques: {str(e)}")
            raise Exception("Erreur lors de la récupération des offres")
    
    def get_job_posting_details(self, job_id):
        """
        Récupère les détails d'une offre d'emploi publique
        
        Args:
            job_id: ID de l'offre d'emploi
            
        Returns:
            JobPosting object ou None si non trouvée/non publique
        """
        try:
            job = JobPosting.query.filter(
                and_(
                    JobPosting.id == job_id,
                    JobPosting.status == 'published'
                )
            ).options(
                joinedload(JobPosting.organization),
                joinedload(JobPosting.creator)
            ).first()
            
            if not job:
                raise Exception("Offre d'emploi non trouvée ou non disponible")
            
            return job
        except Exception as e:
            print(f"Erreur lors de la récupération des détails de l'offre: {str(e)}")
            raise
    
    def create_application(self, job_id, application_data):
        """
        Crée une nouvelle candidature pour une offre d'emploi
        
        Args:
            job_id: ID de l'offre d'emploi
            application_data: Données de la candidature
            
        Returns:
            JobApplication object créée
        """
        try:
            # Vérifier que l'offre existe et est publiée
            job = JobPosting.query.filter(
                and_(
                    JobPosting.id == job_id,
                    JobPosting.status == 'published'
                )
            ).first()
            
            if not job:
                raise Exception('Offre d\'emploi non trouvée ou non disponible')
            
            # Vérifier si le candidat n'a pas déjà postulé
            existing_application = JobApplication.query.filter(
                and_(
                    JobApplication.job_posting_id == job_id,
                    JobApplication.candidate_email == application_data['candidate_email']
                )
            ).first()
            
            if existing_application:
                raise Exception('Vous avez déjà postulé pour cette offre')
            
            # Créer la candidature
            application = JobApplication(
                id=str(uuid.uuid4()),
                job_posting_id=job_id,
                candidate_name=application_data['candidate_name'],
                candidate_email=application_data['candidate_email'],
                candidate_phone=application_data.get('candidate_phone'),
                resume_url=application_data.get('resume_url'),
                cover_letter=application_data.get('cover_letter'),
                status='new',
                source=application_data.get('source', 'website')
            )
            
            db.session.add(application)
            db.session.commit()
            
            # Envoyer l'email de confirmation au candidat
            self._send_application_confirmation(application, job)
            
            # Envoyer une notification au recruteur
            self._send_new_application_notification(application, job)
            
            return application
            
        except Exception as e:
            db.session.rollback()
            print(f"Erreur lors de la création de la candidature: {str(e)}")
            raise
    
    def get_applications_for_job(self, job_id, user_id, limit=20, offset=0):
        """
        Récupère les candidatures pour une offre d'emploi
        (Seulement accessible au créateur de l'offre ou aux membres de l'organisation)
        
        Args:
            job_id: ID de l'offre d'emploi
            user_id: ID de l'utilisateur qui fait la demande
            limit: Nombre d'éléments par page
            offset: Décalage pour la pagination
            
        Returns:
            Tuple (applications, total_count) ou exception si non autorisé
        """
        try:
            # Vérifier que l'utilisateur a accès à cette offre
            job = JobPosting.query.filter(JobPosting.id == job_id).first()
            if not job:
                raise Exception('Offre d\'emploi non trouvée')
            
            # Vérifier les permissions
            user = User.query.get(user_id)
            if not user:
                raise Exception('Utilisateur non trouvé')
            
            # L'utilisateur doit être le créateur de l'offre ou membre de l'organisation
            if (job.created_by != user_id and 
                not any(org.id == job.organization_id for org in user.organizations)):
                raise Exception('Accès non autorisé')
            
            # Compter le total des candidatures
            total_count = JobApplication.query.filter(
                JobApplication.job_posting_id == job_id
            ).count()
            
            # Récupérer les candidatures avec pagination
            applications = JobApplication.query.filter(
                JobApplication.job_posting_id == job_id
            ).order_by(JobApplication.created_at.desc())\
             .limit(limit)\
             .offset(offset)\
             .all()
            
            return applications, total_count
            
        except Exception as e:
            print(f"Erreur lors de la récupération des candidatures: {str(e)}")
            raise
    
    def update_application_status(self, application_id, user_id, new_status, notes=None):
        """
        Met à jour le statut d'une candidature
        
        Args:
            application_id: ID de la candidature
            user_id: ID de l'utilisateur qui fait la demande
            new_status: Nouveau statut
            notes: Notes optionnelles
            
        Returns:
            JobApplication object mise à jour
        """
        try:
            # Récupérer la candidature
            application = JobApplication.query.get(application_id)
            if not application:
                raise Exception('Candidature non trouvée')
            
            # Vérifier les permissions
            job = application.job_posting
            user = User.query.get(user_id)
            
            if (job.created_by != user_id and 
                not any(org.id == job.organization_id for org in user.organizations)):
                raise Exception('Accès non autorisé')
            
            # Valider le statut
            valid_statuses = ['new', 'reviewed', 'interview_scheduled', 'rejected', 'hired']
            if new_status not in valid_statuses:
                raise Exception('Statut invalide')
            
            # Mettre à jour le statut
            old_status = application.status
            application.status = new_status
            application.updated_at = datetime.utcnow()
            
            if notes:
                application.notes = notes
            
            db.session.commit()
            
            # Envoyer une notification au candidat si le statut change
            if old_status != new_status:
                self._send_status_update_notification(application, old_status, new_status)
            
            return application
            
        except Exception as e:
            db.session.rollback()
            print(f"Erreur lors de la mise à jour du statut: {str(e)}")
            raise
    
    def get_application_details(self, application_id, user_id):
        """
        Récupère les détails d'une candidature
        
        Args:
            application_id: ID de la candidature
            user_id: ID de l'utilisateur qui fait la demande
            
        Returns:
            JobApplication object ou exception si non autorisé
        """
        try:
            application = JobApplication.query.get(application_id)
            if not application:
                raise Exception('Candidature non trouvée')
            
            # Vérifier les permissions
            job = application.job_posting
            user = User.query.get(user_id)
            
            if (job.created_by != user_id and 
                not any(org.id == job.organization_id for org in user.organizations)):
                raise Exception('Accès non autorisé')
            
            return application
            
        except Exception as e:
            print(f"Erreur lors de la récupération des détails: {str(e)}")
            raise
    
    def _send_application_confirmation(self, application, job):
        """Envoie un email de confirmation au candidat"""
        try:
            subject = f"Confirmation de candidature - {job.title}"
            
            context = {
                'candidate_name': application.candidate_name,
                'job_title': job.title,
                'organization_name': job.organization.name if job.organization else 'l\'entreprise',
                'application_date': application.created_at.strftime("%d/%m/%Y à %H:%M"),
                'job_location': job.location,
                'employment_type': job.employment_type
            }
            
            self.email_service.send_email(
                application.candidate_email,
                subject,
                'application_confirmation',
                context
            )
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email de confirmation: {str(e)}")
    
    def _send_new_application_notification(self, application, job):
        """Envoie une notification au recruteur pour une nouvelle candidature"""
        try:
            if not job.creator:
                return
            
            subject = f"Nouvelle candidature pour {job.title}"
            
            context = {
                'recruiter_name': f"{job.creator.first_name} {job.creator.last_name}".strip(),
                'candidate_name': application.candidate_name,
                'job_title': job.title,
                'application_date': application.created_at.strftime("%d/%m/%Y à %H:%M"),
                'dashboard_url': f"{current_app.config.get('FRONTEND_URL', '')}/dashboard/applications"
            }
            
            self.email_service.send_email(
                job.creator.email,
                subject,
                'new_application_notification',
                context
            )
        except Exception as e:
            print(f"Erreur lors de l'envoi de la notification: {str(e)}")
    
    def _send_status_update_notification(self, application, old_status, new_status):
        """Envoie une notification au candidat lors d'un changement de statut"""
        try:
            # Définir les messages selon le statut
            status_messages = {
                'reviewed': 'Votre candidature a été examinée',
                'interview_scheduled': 'Un entretien a été planifié',
                'rejected': 'Votre candidature n\'a pas été retenue',
                'hired': 'Félicitations ! Votre candidature a été acceptée'
            }
            
            if new_status not in status_messages:
                return
            
            subject = f"Mise à jour de votre candidature - {application.job_posting.title}"
            
            context = {
                'candidate_name': application.candidate_name,
                'job_title': application.job_posting.title,
                'organization_name': application.job_posting.organization.name if application.job_posting.organization else 'l\'entreprise',
                'status_message': status_messages[new_status],
                'new_status': new_status,
                'notes': application.notes
            }
            
            self.email_service.send_email(
                application.candidate_email,
                subject,
                'application_status_update',
                context
            )
        except Exception as e:
            print(f"Erreur lors de l'envoi de la notification de statut: {str(e)}")      

    def upload_resume(self, file):
        """
        Upload un CV et retourne l'URL
        """
        try:
            # Vérifier la taille du fichier
            MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
            file.seek(0, 2)
            size = file.tell()
            file.seek(0)  # IMPORTANT: Remettre le curseur au début
    
            if size > MAX_FILE_SIZE:
                raise Exception('Le fichier est trop volumineux (maximum 16MB)')
    
            # Vérifier le type de fichier
            allowed_extensions = {'pdf', 'doc', 'docx'}
            if not ('.' in file.filename and 
                    file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
                raise Exception('Type de fichier non autorisé. Seuls les fichiers PDF, DOC et DOCX sont acceptés.')
    
            # Sécuriser et créer un nom de fichier unique
            original_filename = secure_filename(file.filename)
            name, ext = os.path.splitext(original_filename)
            filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"
    
            # Définir le chemin de sauvegarde
            upload_folder = current_app.config.get('UPLOAD_FOLDER', 'app/static/uploads')
            resumes_folder = os.path.join(upload_folder, 'resumes')
            os.makedirs(resumes_folder, exist_ok=True)
    
            file_path = os.path.join(resumes_folder, filename)
    
            # CORRECTION: S'assurer que le curseur est au début avant la sauvegarde
            file.seek(0)
            file.save(file_path)
    
            # Vérifier que le fichier a été sauvegardé et n'est pas vide
            if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
                raise Exception('Échec de la sauvegarde du fichier')
    
            # CORRECTION: Utiliser la bonne route avec le bon nom
            file_url = url_for('job_postings_routes.serve_resume_file', filename=filename, _external=True)
    
            current_app.logger.info(f"CV uploadé avec succès: {filename}")
            print(f"URL générée: {file_url}")  # Pour debug
            print(f"Fichier sauvé à: {file_path}")  # Pour debug
            print(f"Taille du fichier sauvé: {os.path.getsize(file_path)} bytes")  # Pour debug
    
            return file_url
    
        except Exception as e:
            current_app.logger.error(f"Erreur lors de l'upload: {str(e)}")
            raise Exception(f"Erreur lors de l'upload du fichier: {str(e)}")
    
    def get_application_resume(self, current_user_id, application_id, preview=False):
        """
        Récupère le CV d'une candidature de manière sécurisée
        
        Args:
            current_user_id: ID de l'utilisateur courant
            application_id: ID de la candidature
            preview: Mode prévisualisation (True) ou téléchargement (False)
            
        Returns:
            Fichier CV ou erreur JSON
        """
        try:
            # Récupérer la candidature avec l'offre d'emploi
            application = JobApplication.query.options(
                joinedload(JobApplication.job_posting)
            ).filter(JobApplication.id == application_id).first()
            
            if not application:
                return jsonify({'error': 'Candidature non trouvée'}), 404
            
            if not application.resume_url:
                return jsonify({'error': 'Aucun CV disponible pour cette candidature'}), 404
            
            # Vérifier les permissions
            if not self._check_resume_access_permission(current_user_id, application):
                return jsonify({'error': 'Accès non autorisé'}), 403
            
            # Obtenir le chemin du fichier
            file_path = self._get_resume_file_path(application.resume_url)
            print(',,,,,,,,,,,,,,,,,,,,,,,,,'+application.resume_url)
            if not os.path.exists(file_path):
                return jsonify({'error': 'Fichier CV non trouvé'}), 404
            
            # Retourner le fichier
            filename = application.resume_url.split('/')[-1]
            download_name = f"CV_{application.candidate_name}_{filename}"

            # CORRECTION: Déterminer le type MIME
            file_extension = filename.lower().split('.')[-1]
            mimetype = 'application/octet-stream'  # Par défaut

            if file_extension == 'pdf':
                mimetype = 'application/pdf'
            elif file_extension in ['doc', 'docx']:
                mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' if file_extension == 'docx' else 'application/msword'

            response = send_file(
                file_path,
                as_attachment=not preview,
                download_name=download_name,
                mimetype=mimetype  
            )

            if preview:
                response.headers['Content-Disposition'] = f'inline; filename="{download_name}"'

            return response
            
        except Exception as e:
            current_app.logger.error(f"Erreur lors de l'accès au CV {application_id}: {str(e)}")
            raise Exception(f"Erreur lors de l'accès au fichier: {str(e)}")

    def get_application_resume_urls(self, current_user_id, application_id):
        """
        Génère les URLs sécurisées pour accéder au CV d'une candidature
        
        Args:
            current_user_id: ID de l'utilisateur courant
            application_id: ID de la candidature
            
        Returns:
            URLs sécurisées ou erreur JSON
        """
        try:
            # Récupérer la candidature avec l'offre d'emploi
            application = JobApplication.query.options(
                joinedload(JobApplication.job_posting)
            ).filter(JobApplication.id == application_id).first()
            
            if not application:
                return jsonify({'error': 'Candidature non trouvée'}), 404
            
            if not application.resume_url:
                return jsonify({'resume_available': False}), 200
            
            # Vérifier les permissions
            if not self._check_resume_access_permission(current_user_id, application):
                return jsonify({'error': 'Accès non autorisé'}), 403
            
            # Générer les URLs sécurisées
            download_url = url_for(
                'job_postings.download_application_resume', 
                application_id=application_id, 
                _external=True
            )
            
            preview_url = url_for(
                'job_postings.download_application_resume', 
                application_id=application_id, 
                preview='true',
                _external=True
            )
            
            return jsonify({
                'resume_available': True,
                'download_url': download_url,
                'preview_url': preview_url,
                'filename': application.resume_url.split('/')[-1]
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Erreur lors de la génération de l'URL CV {application_id}: {str(e)}")
            raise Exception(f"Erreur lors de la génération de l'URL: {str(e)}")

    def _check_resume_access_permission(self, current_user_id, application):
        """
        Vérifie si l'utilisateur a le droit d'accéder au CV de cette candidature
        
        Args:
            current_user_id: ID de l'utilisateur courant
            application: Objet candidature
            
        Returns:
            bool: True si autorisé, False sinon
        """
        # Récupérer l'utilisateur
        user = User.query.get(current_user_id)
        if not user:
            return False
        
        job = application.job_posting
        
        # Vérifier les permissions (propriétaire de l'offre ou membre de la même organisation)
        has_permission = (
            job.created_by == current_user_id or 
            (user.organization_id and job.organization_id == user.organization_id)
        )
        
        return has_permission

    def _get_resume_file_path(self, resume_url):
        """
        Obtient le chemin physique du fichier CV à partir de son URL
        
        Args:
            resume_url: URL du CV
            
        Returns:
            str: Chemin physique du fichier
        """
        # Extraire le nom du fichier de l'URL
        filename = resume_url.split('/')[-1]
        filename = secure_filename(filename)
        
        # Construire le chemin du fichier
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'app/static/uploads')
        resumes_folder = os.path.join(upload_folder, 'resumes')
        file_path = os.path.join(resumes_folder, filename)
        
        return file_path

    def upload_job_posting_file(self, file):
        """
        Upload un fichier d'offre d'emploi et retourne l'URL

        Args:
            file: Fichier uploadé (PDF, DOC, DOCX, TXT)

        Returns:
            str: URL du fichier uploadé

        Raises:
            Exception: Si l'upload échoue
        """
        try:
            # Vérifier la taille du fichier
            MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
            file.seek(0, 2)
            size = file.tell()
            file.seek(0)  # Remettre le curseur au début

            if size > MAX_FILE_SIZE:
                raise Exception('Le fichier est trop volumineux (maximum 16MB)')

            # Vérifier le type de fichier (plus large que pour les CV)
            allowed_extensions = {'pdf', 'doc', 'docx', 'txt', 'rtf'}
            if not ('.' in file.filename and 
                    file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
                raise Exception('Type de fichier non autorisé. Seuls les fichiers PDF, DOC, DOCX, TXT et RTF sont acceptés.')

            # Sécuriser et créer un nom de fichier unique
            original_filename = secure_filename(file.filename)
            name, ext = os.path.splitext(original_filename)
            filename = f"job_{name}_{uuid.uuid4().hex[:8]}{ext}"

            # Définir le chemin de sauvegarde
            upload_folder = current_app.config.get('UPLOAD_FOLDER', 'app/static/uploads')
            job_files_folder = os.path.join(upload_folder, 'job_postings')
            os.makedirs(job_files_folder, exist_ok=True)

            file_path = os.path.join(job_files_folder, filename)

            # Sauvegarder le fichier
            file.seek(0)
            file.save(file_path)

            # Vérifier que le fichier a été sauvegardé et n'est pas vide
            if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
                raise Exception('Échec de la sauvegarde du fichier')

            # Générer l'URL
            file_url = url_for('job_postings_routes.serve_job_posting_file', filename=filename, _external=True)

            current_app.logger.info(f"Fichier d'offre uploadé avec succès: {filename}")
            print(f"URL générée: {file_url}")
            print(f"Fichier sauvé à: {file_path}")
            print(f"Taille du fichier sauvé: {os.path.getsize(file_path)} bytes")

            return file_url

        except Exception as e:
            current_app.logger.error(f"Erreur lors de l'upload de l'offre: {str(e)}")
            raise Exception(f"Erreur lors de l'upload du fichier: {str(e)}")

    def create_job_posting_from_file(self, organization_id, user_id, title, file_url, additional_data=None):
        """
        Crée une offre d'emploi à partir d'un fichier uploadé

        Args:
            organization_id: ID de l'organisation
            user_id: ID de l'utilisateur qui crée le poste
            title: Titre de l'offre
            file_url: URL du fichier uploadé
            additional_data: Données supplémentaires optionnelles

        Returns:
            JobPosting: L'offre d'emploi créée
        """
        try:
            # Extraire le contenu du fichier pour générer une description automatique
            description = self._extract_content_from_file(file_url)

            # Données de base pour l'offre
            job_data = {
                'title': title,
                'description': description or f"Offre d'emploi: {title}",
                'source': 'uploaded_file',
                'source_url': file_url,
                'status': 'draft'  # Commence toujours en brouillon pour révision
            }

            # Ajouter les données supplémentaires si fournies
            if additional_data:
                job_data.update(additional_data)

            # Créer l'offre d'emploi
            job = JobPosting(
                organization_id=organization_id,
                created_by=user_id,
                title=job_data['title'],
                description=job_data['description'],
                requirements=job_data.get('requirements'),
                responsibilities=job_data.get('responsibilities'),
                location=job_data.get('location'),
                employment_type=job_data.get('employment_type'),
                remote_policy=job_data.get('remote_policy'),
                salary_range_min=job_data.get('salary_range_min'),
                salary_range_max=job_data.get('salary_range_max'),
                salary_currency=job_data.get('salary_currency', 'EUR'),
                status=job_data['status'],
                source=job_data['source'],
                source_url=job_data['source_url']
            )

            # Générer automatiquement des mots-clés et des compétences avec l'IA
            if job.description and hasattr(self, 'ai_service') and self.ai_service:
                try:
                    job.keywords = self.ai_service.extract_keywords(job.description)
                    job.skills = self.ai_service.extract_skills(job.description)

                    # Générer une configuration pour l'entretien IA
                    job.ai_interview_config = self.ai_service.generate_interview_config(
                        job.title, job.description, job.requirements
                    )
                except Exception as e:
                    print(f"Avertissement - Erreur IA lors de la création: {e}")

            db.session.add(job)
            db.session.commit()

            return job

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Erreur lors de la création de l'offre depuis fichier: {str(e)}")
            raise Exception(f"Erreur lors de la création de l'offre: {str(e)}")

    def get_job_posting_file(self, current_user_id, job_id, preview=False):
        """
        Récupère le fichier d'une offre d'emploi de manière sécurisée

        Args:
            current_user_id: ID de l'utilisateur courant
            job_id: ID de l'offre d'emploi
            preview: Mode prévisualisation (True) ou téléchargement (False)

        Returns:
            Fichier ou erreur JSON
        """
        try:
            # Récupérer l'offre d'emploi
            job = JobPosting.query.filter(JobPosting.id == job_id).first()

            if not job:
                return jsonify({'error': 'Offre d\'emploi non trouvée'}), 404

            if not job.source_url or job.source != 'uploaded_file':
                return jsonify({'error': 'Aucun fichier disponible pour cette offre'}), 404

            # Vérifier les permissions
            if not self._check_job_file_access_permission(current_user_id, job):
                return jsonify({'error': 'Accès non autorisé'}), 403

            # Obtenir le chemin du fichier
            file_path = self._get_job_file_path(job.source_url)

            if not os.path.exists(file_path):
                return jsonify({'error': 'Fichier non trouvé'}), 404

            # Retourner le fichier
            filename = job.source_url.split('/')[-1]
            download_name = f"Offre_{job.title}_{filename}"

            # Déterminer le type MIME
            file_extension = filename.lower().split('.')[-1]
            mimetype = 'application/octet-stream'  # Par défaut

            if file_extension == 'pdf':
                mimetype = 'application/pdf'
            elif file_extension in ['doc', 'docx']:
                mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' if file_extension == 'docx' else 'application/msword'
            elif file_extension == 'txt':
                mimetype = 'text/plain'
            elif file_extension == 'rtf':
                mimetype = 'application/rtf'

            response = send_file(
                file_path,
                as_attachment=not preview,
                download_name=download_name,
                mimetype=mimetype
            )

            if preview:
                response.headers['Content-Disposition'] = f'inline; filename="{download_name}"'

            return response

        except Exception as e:
            current_app.logger.error(f"Erreur lors de l'accès au fichier d'offre {job_id}: {str(e)}")
            raise Exception(f"Erreur lors de l'accès au fichier: {str(e)}")

    def _extract_content_from_file(self, file_url):
        """
        Extrait le contenu textuel d'un fichier d'offre uploadé

        Args:
            file_url: URL du fichier

        Returns:
            str: Contenu extrait ou None si échec
        """
        try:
            file_path = self._get_job_file_path(file_url)

            if not os.path.exists(file_path):
                return None

            filename = file_path.split('/')[-1]
            file_extension = filename.lower().split('.')[-1]

            content = ""

            if file_extension == 'txt':
                # Fichier texte simple
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

            elif file_extension == 'pdf':
                # Fichier PDF (nécessite PyPDF2 ou similaire)
                try:
                    import PyPDF2
                    with open(file_path, 'rb') as f:
                        pdf_reader = PyPDF2.PdfReader(f)
                        for page in pdf_reader.pages:
                            content += page.extract_text() + "\n"
                except ImportError:
                    print("PyPDF2 non installé, impossible de lire le PDF")
                    content = f"Fichier PDF uploadé: {filename}"

            elif file_extension in ['doc', 'docx']:
                # Fichier Word (nécessite python-docx)
                try:
                    from docx import Document
                    doc = Document(file_path)
                    for paragraph in doc.paragraphs:
                        content += paragraph.text + "\n"
                except ImportError:
                    print("python-docx non installé, impossible de lire le fichier Word")
                    content = f"Fichier Word uploadé: {filename}"

            else:
                content = f"Fichier uploadé: {filename}"

            # Limiter la taille du contenu
            if len(content) > 5000:
                content = content[:5000] + "...\n[Contenu tronqué]"

            return content.strip()

        except Exception as e:
            print(f"Erreur lors de l'extraction du contenu: {str(e)}")
            return None

    def _check_job_file_access_permission(self, current_user_id, job):
        """
        Vérifie si l'utilisateur a le droit d'accéder au fichier de cette offre

        Args:
            current_user_id: ID de l'utilisateur courant
            job: Objet offre d'emploi

        Returns:
            bool: True si autorisé, False sinon
        """
        # Récupérer l'utilisateur
        user = User.query.get(current_user_id)
        if not user:
            return False

        # Vérifier les permissions (propriétaire de l'offre ou membre de la même organisation)
        has_permission = (
            job.created_by == current_user_id or 
            (user.organization_id and job.organization_id == user.organization_id)
        )

        return has_permission

    def _get_job_file_path(self, file_url):
        """
        Obtient le chemin physique du fichier d'offre à partir de son URL

        Args:
            file_url: URL du fichier

        Returns:
            str: Chemin physique du fichier
        """
        # Extraire le nom du fichier de l'URL
        filename = file_url.split('/')[-1]
        filename = secure_filename(filename)

        # Construire le chemin du fichier
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'app/static/uploads')
        job_files_folder = os.path.join(upload_folder, 'job_postings')
        file_path = os.path.join(job_files_folder, filename)

        return file_path
