# backend/app/services/llm_service.py
import os
from flask import current_app
import requests
import json

def get_llm_response(prompt, model=None, temperature=0.7, max_tokens=1000):
    """
    Obtient une réponse d'un modèle de langage (GPT-4o ou Claude).
    
    Args:
        prompt (str): Le prompt à envoyer au modèle
        model (str, optional): Le modèle spécifique à utiliser. Par défaut, utilise le meilleur modèle disponible.
        temperature (float, optional): La température pour la génération. Défaut à 0.7.
        max_tokens (int, optional): Le nombre maximum de tokens à générer. Défaut à 1000.
        
    Returns:
        str: La réponse du modèle
    """
    provider = current_app.config.get('LLM_PROVIDER', 'openai')
    
    if provider == 'openai':
        return _get_openai_response(prompt, model, temperature, max_tokens)
    elif provider == 'anthropic':
        return _get_anthropic_response(prompt, model, temperature, max_tokens)
    else:
        raise ValueError(f"Fournisseur LLM non pris en charge: {provider}")

def _get_openai_response(prompt, model=None, temperature=0.7, max_tokens=1000):
    """
    Obtient une réponse de l'API OpenAI.
    """
    api_key = current_app.config.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("Clé API OpenAI non configurée")
    
    # Utiliser GPT-4o par défaut ou le modèle spécifié
    model = model or "gpt-4o"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        # En cas d'erreur, journaliser et renvoyer une erreur
        print(f"Erreur lors de l'appel à l'API OpenAI: {str(e)}")
        # En production, utilisez un logger approprié
        return f"Erreur de l'API: {str(e)}"

def _get_anthropic_response(prompt, model=None, temperature=0.7, max_tokens=1000):
    """
    Obtient une réponse de l'API Anthropic.
    """
    api_key = current_app.config.get('ANTHROPIC_API_KEY')
    if not api_key:
        raise ValueError("Clé API Anthropic non configurée")
    
    # Utiliser Claude Haiku par défaut ou le modèle spécifié
    model = model or "claude-3-haiku-20240307"
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01"
    }
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    
    try:
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()["content"][0]["text"]
    except Exception as e:
        # En cas d'erreur, journaliser et renvoyer une erreur
        print(f"Erreur lors de l'appel à l'API Anthropic: {str(e)}")
        # En production, utilisez un logger approprié
        return f"Erreur de l'API: {str(e)}"