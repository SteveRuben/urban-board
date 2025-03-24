Cette architecture hybride vous permet de bénéficier des avantages de Flask pour le traitement IA côté backend et de Next.js pour l'interface utilisateur interactive côté frontend.
Pour démarrer le développement, vous devriez :

Créer les dossiers et fichiers selon la structure définie
Installer les dépendances avec pip install -r requirements.txt pour le backend et npm install pour le frontend
Copier les fichiers .env.example en .env et configurer vos clés API
Lancer le backend avec python wsgi.py et le frontend avec npm run dev


# Backend (Python)
pip install PyPDF2 python-dotenv anthropic openai whisper

# Frontend (JavaScript)
npm install react-pdf papaparse


CLAUDE_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key

# État complet du projet RecruteIA - Documentation technique

## 1. Architecture globale

### Infrastructure technique
- **Backend**: Flask (Python 3.12)
- **Frontend**: Next.js (React)
- **Base de données**: SQLAlchemy avec modèles relationnels
- **Communication temps réel**: Flask-SocketIO avec eventlet
- **Cache et session**: Redis
- **IA**: Intégration d'APIs (Claude/GPT-4o) et traitement local (Whisper)

### Structure des dossiers
```
backend/
├── app/
│   ├── __init__.py              # Initialisation de l'application
│   ├── models/                  # Modèles de données
│   ├── middleware/              # Middleware d'authentification et rate limiting
│   ├── routes/                  # Endpoints API
│   ├── services/                # Services métier
│   ├── socket_handlers.py       # Gestionnaires WebSocket
│   └── utils/                   # Utilitaires
├── migrations/                  # Migrations de base de données
├── wsgi.py                      # Point d'entrée de l'application
└── requirements.txt             # Dépendances

frontend/
├── components/
│   ├── layout/                  # Composants de mise en page
│   ├── interview/               # Composants d'interface d'entretien
│   ├── notifications/           # Composants de notification
│   └── ui/                      # Composants d'interface utilisateur
├── contexts/                    # Contextes React (auth, websocket)
├── pages/                       # Pages Next.js
├── services/                    # Services API et WebSocket
└── hooks/                       # Hooks personnalisés
```

## 2. Systèmes implémentés en détail

### Système d'authentification
- **JWT** (JSON Web Token) pour l'authentification sans état
- **Middleware d'authentification** avec vérification de token
- **Contexte d'authentification React** pour le frontend
- **Redis** pour la liste noire de tokens et le rafraîchissement
- **Rôles utilisateurs** (admin, recruteur, standard)

### Système de notifications en temps réel
- **WebSockets** via Flask-SocketIO et socket.io-client
- **Salles utilisateur** pour notifications ciblées
- **WebSocketService** pour l'envoi de notifications
- **Notifications persistantes** stockées en base de données
- **Composants UI** (dropdown, toasts) pour l'affichage frontend

### Moteur d'entretien basé sur l'IA
- **Génération de questions** basée sur CV et description de poste
- **Analyse biométrique** des expressions faciales
- **Transcription audio** des réponses (Whisper)
- **Questions adaptatives** selon la clarté/temps de réponse
- **Évaluation IA** des réponses avec feedback

### Interface d'entretien interactive
- **Streaming vidéo** du candidat
- **Composants d'enregistrement audio** avec visualisation
- **Graphiques temps réel** pour l'analyse biométrique 
- **Interface adaptative** pour les questions de suivi
- **Tableau de bord d'analyse** pendant l'entretien

## 3. Modèles de données

### Utilisateurs et authentification
```python
# User
id = db.Column(db.String(36), primary_key=True)
email = db.Column(db.String(100), unique=True, nullable=False)
password = db.Column(db.String(100), nullable=False)
first_name = db.Column(db.String(50))
last_name = db.Column(db.String(50))
role = db.Column(db.String(20), default='user')  # 'admin', 'user', 'recruiter'
is_active = db.Column(db.Boolean, default=True)
created_at = db.Column(db.DateTime, default=datetime.utcnow)
last_login = db.Column(db.DateTime, nullable=True)
```

### Entretiens et questions
```python
# Interview
id = db.Column(db.Integer, primary_key=True)
title = db.Column(db.String(255), nullable=False)
job_title = db.Column(db.String(255), nullable=False)
job_description = db.Column(db.Text, nullable=True)
experience_level = db.Column(db.String(50), nullable=True)
interview_mode = db.Column(db.String(20), default='autonomous')
status = db.Column(db.String(20), default='draft')
created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

# Question
id = db.Column(db.Integer, primary_key=True)
interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False)
original_text = db.Column(db.Text, nullable=False)
displayed_text = db.Column(db.Text, nullable=True)
difficulty = db.Column(db.String(20), nullable=True)
category = db.Column(db.String(50), nullable=True)
reasoning = db.Column(db.Text, nullable=True)
position = db.Column(db.Integer, nullable=False)
was_modified = db.Column(db.Boolean, default=False)
```

### Réponses et évaluations
```python
# Response
id = db.Column(db.Integer, primary_key=True)
question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False)
text = db.Column(db.Text, nullable=False)
audio_url = db.Column(db.String(255), nullable=True)
transcription_method = db.Column(db.String(50), nullable=True)
response_time = db.Column(db.Integer, nullable=True)

# Evaluation
id = db.Column(db.Integer, primary_key=True)
response_id = db.Column(db.Integer, db.ForeignKey('responses.id'), nullable=False, unique=True)
exactitude = db.Column(db.Float, nullable=True)
clarte = db.Column(db.Float, nullable=True)
profondeur = db.Column(db.Float, nullable=True)
score_global = db.Column(db.Float, nullable=True)
feedback = db.Column(db.Text, nullable=True)
points_forts = db.Column(db.JSON, nullable=True)
axes_amelioration = db.Column(db.JSON, nullable=True)
```

### Données biométriques
```python
# BiometricData
id = db.Column(db.Integer, primary_key=True)
interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False)
question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
response_id = db.Column(db.Integer, db.ForeignKey('responses.id'), nullable=True)
timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
eye_contact = db.Column(db.String(20), nullable=True)
posture = db.Column(db.String(20), nullable=True)
gestures = db.Column(db.String(20), nullable=True)
attention = db.Column(db.String(20), nullable=True)
emotions = db.Column(db.JSON, nullable=True)
dominant_emotion = db.Column(db.String(20), nullable=True)
```

### Notifications
```python
# Notification
id = db.Column(db.Integer, primary_key=True)
user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
type = db.Column(db.String(50), nullable=False)  # 'info', 'alert', 'success', 'error'
title = db.Column(db.String(100), nullable=False)
message = db.Column(db.Text, nullable=False)
link = db.Column(db.String(200), nullable=True)
is_read = db.Column(db.Boolean, default=False)
created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

## 4. Composants clés avec extraits de code

### Auth Middleware mis à jour
```python
def get_current_user():
    """
    Récupère l'utilisateur courant depuis le contexte g de Flask
    Si l'utilisateur n'est pas dans g mais que le token est valide,
    récupère l'utilisateur depuis la DB et le stocke dans g.
    
    Returns:
        User: L'objet utilisateur ou None si non authentifié
    """
    # Si l'utilisateur est déjà chargé dans g, le retourner
    if hasattr(g, 'current_user') and g.current_user is not None:
        # Si c'est un dictionnaire (comportement précédent), convertir en objet User
        if isinstance(g.current_user, dict):
            user_id = g.current_user.get('user_id')
            if user_id:
                try:
                    user = User.query.get(user_id)
                    if user:
                        g.current_user = user
                        return user
                except Exception as e:
                    current_app.logger.error(f"Erreur lors de la récupération de l'utilisateur: {str(e)}")
                    return None
            return None
        return g.current_user
    
    # Sinon, essayer de récupérer l'utilisateur à partir du token
    token = get_token_from_request()
    if not token:
        return None
    
    payload = verify_token(token)
    if not payload:
        return None
    
    user_id = payload.get('user_id')
    if not user_id:
        return None
    
    try:
        # Récupérer l'utilisateur depuis la base de données
        user = User.query.get(user_id)
        
        # Vérifier si l'utilisateur existe et est actif
        if not user or not user.is_active:
            return None
        
        # Stocker l'utilisateur dans le contexte de requête
        g.current_user = user
        return user
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération de l'utilisateur: {str(e)}")
        return None
```

### WebSocketService
```python
class WebSocketService:
    def emit_notification(self, user_id, notification):
        """
        Émet une notification à un utilisateur spécifique.
        
        Args:
            user_id (str): Identifiant de l'utilisateur destinataire
            notification (dict): Données de la notification
            
        Returns:
            bool: True si l'émission a réussi, False sinon
        """
        if not self.socketio:
            current_app.logger.warning("WebSocketService non initialisé")
            return False
        
        try:
            user_room = f'user_{user_id}'
            self.socketio.emit('notification', notification, room=user_room)
            current_app.logger.info(f"Notification émise à l'utilisateur {user_id}")
            return True
        except Exception as e:
            current_app.logger.error(f"Erreur lors de l'émission d'une notification: {str(e)}")
            return False
```

### Interview Room Frontend React
```jsx
// frontend/components/interview/InterviewRoom.jsx (extrait)
const InterviewRoom = ({ interviewId, jobRole, experienceLevel, questions: initialQuestions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [followUpQuestion, setFollowUpQuestion] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Fonction adaptée pour générer une question de suivi si nécessaire
  const generateFollowUpQuestion = async (responseText, reason) => {
    try {
      setIsLoadingFollowUp(true);
      
      const followUp = await aiInterviewService.generateFollowUpQuestion({
        originalQuestion: originalQuestion,
        candidateResponse: responseText,
        reason: reason
      });
      
      setFollowUpQuestion(followUp);
      setIsLoadingFollowUp(false);
    } catch (err) {
      console.error('Erreur lors de la génération de la question de suivi:', err);
      setIsLoadingFollowUp(false);
    }
  };
}
```

### Services d'IA pour entretien
```python
class AIInterviewService:
    def generate_questions_from_cv_and_job(self, job_description, cv_text, number=5, experience_level=None):
        """
        Génère des questions d'entretien personnalisées en analysant le CV du candidat 
        et la description du poste.
        """
        if self.claude_client:
            return self._generate_questions_from_cv_claude(job_description, cv_text, number, experience_level)
        elif self.openai_api_key:
            return self._generate_questions_from_cv_openai(job_description, cv_text, number, experience_level)
        else:
            # Utiliser des questions génériques si aucun service d'IA n'est disponible
            return self._default_questions_from_job(job_description)
            
    def generate_follow_up_question(self, original_question, candidate_response, reason="unclear", timeout_duration=None):
        """
        Génère une question de suivi basée sur la réponse du candidat
        """
        # Implementation similaire avec prompt adapté pour les questions de suivi
```

## 5. Problèmes résolus

### Problèmes d'authentification
- ✅ Changement de g.current_user de type dictionnaire à objet User
- ✅ Mise à jour de toutes les routes utilisant g.current_user['user_id']
- ✅ Implémentation d'un mécanisme de récupération et stockage d'utilisateur robuste

### Problèmes de WebSockets
- ✅ Erreur "write() before start_response" corrigée
- ✅ Configuration optimale d'asyncio_mode avec eventlet
- ✅ Gestion correcte de l'initialisation de Socket.IO

### Problèmes d'IA et d'entretien
- ✅ Gestion conditionnelle de l'importation whisper
- ✅ Alternatives de fallback pour la transcription
- ✅ Logique adaptative pour les questions de suivi

### Corrections du rate limiting
- ✅ Adaptation aux objets User plutôt qu'aux dictionnaires
- ✅ Gestion d'erreurs améliorée pour éviter les blocages

## 6. État actuel du développement

### Fonctionnalités complètes et opérationnelles
- ✅ Système d'authentification complet (backend et frontend)
- ✅ Notifications en temps réel via WebSockets
- ✅ Génération de questions d'entretien basées sur CV/description de poste
- ✅ Analyse biométrique des expressions faciales
- ✅ Questions adaptatives en fonction des réponses et du temps

### Fonctionnalités partiellement implémentées
- ⚠️ Transcription audio (implémentée mais avec limitations)
- ⚠️ Dashboard analytique (structure de données prête, interface à améliorer)
- ⚠️ Système de rapports d'entretien (modèle prêt, fonctionnalité partielle)

### Environnements
- ✅ Développement: Fonctionnel (Flask development server + eventlet)
- ⚠️ Production: Configuration partielle (manque Docker, etc.)

## 7. Prochaines étapes recommandées

1. **Phase 1: Finalisation de l'interface**
   - Terminer le tableau de bord analytique avec visualisations
   - Créer les écrans de rapport d'entretien détaillés
   - Optimiser l'UX pour les recruteurs et candidats

2. **Phase 2: Optimisations techniques**
   - Implémenter le caching des résultats d'analyse
   - Mettre en place la compression des données biométriques
   - Optimiser les requêtes SQL et les connexions WebSocket

3. **Phase 3: Infrastructure de production**
   - Dockeriser l'application (backend et frontend)
   - Configurer CI/CD avec tests automatisés
   - Mettre en place le monitoring et les alertes

4. **Phase 4: Fonctionnalités avancées**
   - Mode collaboratif multi-recruteurs
   - API publique pour intégrations tierces
   - Fonctionnalités analytiques comparatives entre candidats

## 8. Dépendances principales

### Backend
```
Flask==2.0.1
Flask-SQLAlchemy==2.5.1
Flask-Migrate==3.1.0
Flask-CORS==3.0.10
Flask-SocketIO==5.3.6
python-socketio==5.10.0
python-engineio==4.8.0
eventlet==0.35.0
PyJWT==2.3.0
redis==4.1.4
anthropic==0.20.0
bcrypt==3.2.0
python-dotenv==0.19.2
whisper==1.0.0 (optionnel)
```

### Frontend
```
next==14.0.0
react==18.2.0
socket.io-client==4.7.2
axios==1.6.2
tailwindcss==3.3.3
recharts==2.9.0
react-pdf==7.5.1
```

Vous pouvez reprendre le développement à partir de ce point, en vous concentrant sur l'une des prochaines étapes tout en ayant une vision claire de l'architecture existante et des fonctionnalités déjà implémentées.