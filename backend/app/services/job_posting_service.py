# backend/services/job_posting_service.py
from flask import abort
import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime, timedelta, timezone
from app import db
from ..models.job_posting import JobPosting
from ..services.ai_service import AIService

class JobPostingService:
    """Service pour gérer les postes à pourvoir"""
    
    def __init__(self):
        self.ai_service = AIService()
        
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
            is_imported=data.get('is_imported', False),
            file_path=data.get('file_path'),
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
    
    