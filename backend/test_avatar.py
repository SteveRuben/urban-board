# test_avatar_service.py

from app.services.avatar_service import AvatarService
from datetime import datetime, timedelta

def test_avatar_scheduling():
    # Votre SocketIO mock
    socketio_mock = MockSocketIO()
    
    service = AvatarService(socketio_mock)
    service.start()
    
    # Test de programmation
    result = service.schedule_avatar_launch(
        "test_interview_123",
        datetime.utcnow() + timedelta(minutes=5),
        {
            "candidate_name": "Test User",
            "position": "Developer",
            "meet_link": "https://meet.google.com/abc-defg-hij"
        }
    )
    
    assert result['success'] == True
    service.stop()