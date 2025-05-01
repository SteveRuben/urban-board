# backend/services/biometric_service.py
from flask import current_app
import numpy as np
from ..models.biometric import FacialAnalysis, BiometricSummary
from ..models.interview import Interview
from ..models.interview_question import InterviewQuestion
from app import db
from datetime import datetime

class BiometricService:
    def __init__(self):
        # Import ici pour éviter les imports circulaires
        pass
    
    def save_facial_analysis(self, interview_id, timestamp, emotions):
        """Enregistre une analyse faciale"""
        # Trouver l'émotion dominante
        dominant_emotion = max(emotions.items(), key=lambda x: x[1])
        
        analysis = FacialAnalysis(
            interview_id=interview_id,
            timestamp=timestamp,
            emotions=emotions,
            dominant_emotion=dominant_emotion[0],
            confidence=dominant_emotion[1]
        )
        
        db.session.add(analysis)
        db.session.commit()
        
        return analysis
    
    def batch_save_facial_analyses(self, interview_id, analyses):
        """Enregistre un lot d'analyses faciales"""
        # analyses est une liste de dictionnaires: [{"timestamp": 10, "emotions": {"happy": 0.8, ...}}, ...]
        db_analyses = []
        
        for analysis in analyses:
            emotions = analysis['emotions']
            timestamp = analysis['timestamp']
            
            # Trouver l'émotion dominante
            dominant_emotion = max(emotions.items(), key=lambda x: x[1])
            
            db_analysis = FacialAnalysis(
                interview_id=interview_id,
                timestamp=timestamp,
                emotions=emotions,
                dominant_emotion=dominant_emotion[0],
                confidence=dominant_emotion[1]
            )
            
            db_analyses.append(db_analysis)
        
        db.session.bulk_save_objects(db_analyses)
        db.session.commit()
        
        return len(db_analyses)
    
    def generate_summary(self, interview_id):
        """Génère un résumé biométrique pour un entretien"""
        # Récupérer toutes les analyses faciales pour cet entretien
        analyses = FacialAnalysis.query.filter_by(interview_id=interview_id).all()
        
        if not analyses:
            raise ValueError("Aucune analyse faciale trouvée pour cet entretien")
        
        # Créer un dictionnaire pour stocker les distributions d'émotions
        emotion_counts = {}
        
        # Calculer les distributions d'émotions
        for analysis in analyses:
            for emotion, value in analysis.emotions.items():
                if emotion not in emotion_counts:
                    emotion_counts[emotion] = []
                emotion_counts[emotion].append(value)
        
        # Calculer la moyenne pour chaque émotion
        emotion_distribution = {}
        for emotion, values in emotion_counts.items():
            emotion_distribution[emotion] = sum(values) / len(values)
        
        # Normaliser pour obtenir des pourcentages
        total = sum(emotion_distribution.values())
        for emotion in emotion_distribution:
            emotion_distribution[emotion] = round((emotion_distribution[emotion] / total) * 100, 2)
        
        # Calculer le score d'engagement (basé sur les émotions positives et l'attention)
        positive_emotions = ['happy', 'surprised']
        negative_emotions = ['angry', 'sad', 'disgusted', 'fearful']
        neutral_emotions = ['neutral']
        
        engagement_score = 0
        for emotion in positive_emotions:
            if emotion in emotion_distribution:
                engagement_score += emotion_distribution[emotion]
        
        # Calculer les indicateurs de stress (basés sur les émotions négatives)
        stress_indicators = 0
        for emotion in negative_emotions:
            if emotion in emotion_distribution:
                stress_indicators += emotion_distribution[emotion]
        
        # Calculer les indicateurs de confiance (basés sur la neutralité et la joie)
        confidence_indicators = 0
        if 'happy' in emotion_distribution:
            confidence_indicators += emotion_distribution['happy'] * 1.5
        if 'neutral' in emotion_distribution:
            confidence_indicators += emotion_distribution['neutral'] * 0.5
        
        # Normaliser les scores
        engagement_score = min(100, engagement_score * 1.5)
        stress_indicators = min(100, stress_indicators * 1.5)
        confidence_indicators = min(100, confidence_indicators)
        
        # Trouver les moments clés (changements significatifs d'émotions)
        key_moments = self._find_key_moments(analyses, interview_id)
        
        # Vérifier si un résumé existe déjà
        existing_summary = BiometricSummary.query.filter_by(interview_id=interview_id).first()
        
        if existing_summary:
            # Mettre à jour le résumé existant
            existing_summary.emotion_distribution = emotion_distribution
            existing_summary.engagement_score = engagement_score
            existing_summary.stress_indicators = stress_indicators
            existing_summary.confidence_indicators = confidence_indicators
            existing_summary.key_moments = key_moments
            db.session.commit()
            
            return existing_summary
        else:
            # Créer un nouveau résumé
            summary = BiometricSummary(
                interview_id=interview_id,
                emotion_distribution=emotion_distribution,
                engagement_score=engagement_score,
                stress_indicators=stress_indicators,
                confidence_indicators=confidence_indicators,
                key_moments=key_moments
            )
            
            db.session.add(summary)
            db.session.commit()
            
            return summary
    
    def _find_key_moments(self, analyses, interview_id):
        """Trouve les moments clés dans un entretien basés sur les changements d'émotions"""
        if len(analyses) < 3:
            return []
        
        # Obtenir les questions de l'entretien
        questions = InterviewQuestion.query.filter_by(interview_id=interview_id).all()
        question_times = {q.start_time: q.id for q in questions}
        
        key_moments = []
        last_dominant = analyses[0].dominant_emotion
        
        # Fenêtre glissante pour détecter les changements
        window_size = min(5, len(analyses) // 10) if len(analyses) > 10 else 2
        
        for i in range(window_size, len(analyses) - window_size):
            # Comparer l'émotion actuelle avec la fenêtre précédente
            previous_window = analyses[i-window_size:i]
            current = analyses[i]
            
            # Calculer l'émotion dominante dans la fenêtre précédente
            prev_emotions = {}
            for a in previous_window:
                emotion = a.dominant_emotion
                prev_emotions[emotion] = prev_emotions.get(emotion, 0) + 1
            
            prev_dominant = max(prev_emotions.items(), key=lambda x: x[1])[0]
            
            # Si l'émotion dominante a changé
            if current.dominant_emotion != prev_dominant and current.confidence > 0.6:
                # Trouver la question la plus proche (si applicable)
                timestamp = current.timestamp
                closest_question = None
                min_diff = float('inf')
                
                for q_time, q_id in question_times.items():
                    if q_time <= timestamp:
                        diff = timestamp - q_time
                        if diff < min_diff:
                            min_diff = diff
                            closest_question = q_id
                
                if min_diff <= 15:  # Si la réaction est dans les 15 secondes après la question
                    key_moments.append({
                        "timestamp": timestamp,
                        "from_emotion": prev_dominant,
                        "to_emotion": current.dominant_emotion,
                        "question_id": closest_question,
                        "confidence": current.confidence
                    })
                elif len(key_moments) < 5 or current.confidence > 0.8:
                    # Limiter le nombre de moments clés sans question associée
                    key_moments.append({
                        "timestamp": timestamp,
                        "from_emotion": prev_dominant,
                        "to_emotion": current.dominant_emotion,
                        "confidence": current.confidence
                    })
        
        # Trier par confiance et limiter à 10 moments
        key_moments.sort(key=lambda x: x["confidence"], reverse=True)
        return key_moments[:10]
    
    def get_summary(self, interview_id):
        """Récupère le résumé biométrique pour un entretien"""
        summary = BiometricSummary.query.filter_by(interview_id=interview_id).first()
        
        if not summary:
            # Essayer de générer un résumé s'il y a des analyses
            analyses = FacialAnalysis.query.filter_by(interview_id=interview_id).all()
            if analyses:
                summary = self.generate_summary(interview_id)
            else:
                raise ValueError("Aucune analyse biométrique disponible pour cet entretien")
        
        return summary