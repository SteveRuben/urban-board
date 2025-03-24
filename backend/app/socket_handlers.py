# backend/app/socket_handlers.py

from flask import request, g, current_app
from flask_socketio import emit, join_room, leave_room, disconnect
from .middleware.auth_middleware import verify_token, get_current_user

def register_handlers(socketio):
    """
    Enregistre tous les gestionnaires d'événements Socket.IO
    """
    
    @socketio.on('connect')
    def handle_connect():
        """Gérer les connexions Socket.IO avec authentification"""
        try:
            # Vérifier le token d'authentification
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                current_app.logger.warning("Socket.IO connexion rejetée: token manquant")
                # En mode développement, on peut autoriser les connexions sans token
                # Mais en production, il faudrait déconnecter
                # disconnect()
                return
            
            token = auth_header.split(' ')[1]
            payload = verify_token(token)
            
            if not payload:
                current_app.logger.warning("Socket.IO connexion rejetée: token invalide")
                # disconnect()
                return
            
            # Obtenir l'utilisateur
            user = get_current_user()
            if not user:
                current_app.logger.warning("Socket.IO connexion rejetée: utilisateur non trouvé")
                # disconnect()
                return
            
            # Stocker l'ID utilisateur dans la session Socket.IO
            g.socket_user_id = user.id
            
            # Rejoindre une salle spécifique à l'utilisateur
            join_room(f"user_{user.id}")
            current_app.logger.info(f"Socket.IO: utilisateur {user.id} connecté")
            
            # Envoyer un événement de bienvenue
            emit('connect_response', {'status': 'success', 'message': 'Connecté au serveur'})
            
        except Exception as e:
            current_app.logger.error(f"Erreur lors de la connexion Socket.IO: {str(e)}")
            # Ne pas déconnecter en développement pour faciliter le débogage
            # disconnect()
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Gérer les déconnexions Socket.IO"""
        current_app.logger.info("Client déconnecté de Socket.IO")
    
    @socketio.on_error()
    def handle_error(e):
        """Gérer les erreurs Socket.IO"""
        current_app.logger.error(f"Erreur Socket.IO: {str(e)}")
    
    # Événements personnalisés pour l'application
    
    @socketio.on('join')
    def handle_join(data):
        """Rejoindre une salle spécifique"""
        room = data.get('room')
        if room:
            join_room(room)
            emit('room_response', {'status': 'joined', 'room': room}, room=room)
    
    @socketio.on('leave')
    def handle_leave(data):
        """Quitter une salle"""
        room = data.get('room')
        if room:
            leave_room(room)
    
    @socketio.on('notification')
    def handle_notification(data):
        """Diffuser une notification à une salle ou un utilisateur spécifique"""
        target = data.get('target')
        notification = data.get('notification')
        
        if target and notification:
            emit('notification', notification, room=target)
            
    # Ajouter vos propres gestionnaires d'événements ici