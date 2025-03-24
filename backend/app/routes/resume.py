# backend/app/routes/resume.py
from flask import request, jsonify
from . import resume_bp
from ..services.resume_analyzer import analyze_resume

@resume_bp.route('/analyze', methods=['POST'])
def analyze():
    """Analyse un CV téléchargé"""
    # Vérifier si un fichier a été téléchargé
    if 'resume' not in request.files:
        return jsonify({"error": "Aucun fichier téléchargé"}), 400
    
    file = request.files['resume']
    
    if file.filename == '':
        return jsonify({"error": "Aucun fichier sélectionné"}), 400
    
    # Logique pour analyser le CV
    analysis_results = analyze_resume(file)
    
    return jsonify(analysis_results)
