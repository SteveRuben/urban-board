# backend/app/services/websocket_service.py
from flask import current_app
from flask_socketio import join_room, leave_room, emit
from ..middleware.auth_middleware import verify_token

class WebSocketService:
    """
    Service pour gérer les communications WebSocket, notamment pour les notifications en temps réel.
    
    Ce service doit être initialisé avec l'application Flask et utilisé pour
    émettre des événements vers les clients connectés.
    """
    
    def __init__(self, app=None):
        """
        Initialise le service WebSocket.
        
        Args:
            app (Flask, optional): Instance de l'application Flask
        """
        self.app = app
        self.socketio = None
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """
        Initialise le service avec une application Flask.
        
        Args:
            app (Flask): Instance de l'application Flask
        """
        self.app = app
        
        # Obtenir l'instance SocketIO depuis le module principal
        # Important: nous réutilisons la même instance que celle créée dans app/__init__.py
        from app import socketio
        self.socketio = socketio
        
        # Stocker le service dans l'application pour un accès facile
        app.websocket_service = self
        
        # Enregistrer les gestionnaires d'événements WebSocket
        with app.app_context():
            self._register_handlers()
    
    def _register_handlers(self):
        """
        Enregistre les gestionnaires d'événements WebSocket.
        Ces gestionnaires complètent ceux définis dans socket_handlers.py
        """
        @self.socketio.on('join_user_channel')
        def handle_join_channel(data):
            """
            Gère l'abonnement d'un utilisateur à son canal de notifications.
            
            Args:
                data (dict): Données avec user_id et token
            """
            user_id = data.get('user_id')
            token = data.get('token')
            
            # Vérifier le token pour s'assurer qu'il est valide
            if token:
                payload = verify_token(token)
                if not payload or payload.get('user_id') != user_id:
                    current_app.logger.warning(f"Tentative d'abonnement avec un token invalide: {user_id}")
                    emit('channel_join_error', {
                        'status': 'error',
                        'message': 'Token invalide'
                    })
                    return
            else:
                current_app.logger.warning("Tentative de rejoindre un canal sans token")
                emit('channel_join_error', {
                    'status': 'error',
                    'message': 'Token manquant'
                })
                return
            
            if user_id:
                user_room = f'user_{user_id}'
                join_room(user_room)
                current_app.logger.info(f"Utilisateur {user_id} a rejoint son canal de notifications")
                
                # Confirmer l'abonnement
                emit('channel_joined', {
                    'user_id': user_id,
                    'status': 'success'
                }, room=user_room)
            else:
                current_app.logger.warning("Tentative de rejoindre un canal sans user_id")
                emit('channel_join_error', {
                    'status': 'error',
                    'message': 'ID utilisateur manquant'
                })
    
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
    
    def emit_global_notification(self, notification, role=None):
        """
        Émet une notification globale à tous les utilisateurs ou à un groupe spécifique.
        
        Args:
            notification (dict): Données de la notification
            role (str, optional): Si spécifié, la notification sera envoyée uniquement aux utilisateurs de ce rôle
            
        Returns:
            bool: True si l'émission a réussi, False sinon
        """
        if not self.socketio:
            current_app.logger.warning("WebSocketService non initialisé")
            return False
        
        try:
            room = f'role_{role}' if role else None
            self.socketio.emit('notification', notification, room=room)
            
            target = f"utilisateurs du rôle {role}" if role else "tous les utilisateurs"
            current_app.logger.info(f"Notification globale émise à {target}")
            return True
        except Exception as e:
            current_app.logger.error(f"Erreur lors de l'émission d'une notification globale: {str(e)}")
            return False
    
    def join_role_room(self, user_id, role):
        """
        Ajoute un utilisateur à une salle basée sur son rôle pour les notifications spécifiques.
        
        Args:
            user_id (str): Identifiant de l'utilisateur
            role (str): Rôle de l'utilisateur
            
        Returns:
            bool: True si l'opération a réussi, False sinon
        """
        if not self.socketio:
            current_app.logger.warning("WebSocketService non initialisé")
            return False
        
        try:
            room_name = f'role_{role}'
            self.socketio.server.enter_room(user_id, room_name)
            current_app.logger.info(f"Utilisateur {user_id} ajouté à la salle {room_name}")
            return True
        except Exception as e:
            current_app.logger.error(f"Erreur lors de l'ajout à une salle: {str(e)}")
            return False