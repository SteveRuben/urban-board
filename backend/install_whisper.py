# install_whisper.py
import subprocess
import sys
import os

def install_correct_whisper():
    """Script pour désinstaller le mauvais package whisper et installer openai-whisper"""
    print("Vérification et correction des packages whisper...")
    
    # Désinstaller tous les packages liés à whisper
    packages_to_remove = ['whisper', 'openai-whisper', 'whisper-openai']
    for package in packages_to_remove:
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'uninstall', '-y', package], 
                          check=False, capture_output=True)
            print(f"Désinstallation de {package} terminée.")
        except Exception as e:
            print(f"Erreur lors de la désinstallation de {package}: {str(e)}")
    
    # Installer les dépendances requises pour whisper
    dependencies = [
        'numpy',
        'torch',
        'tqdm',
        'more-itertools',
        'transformers>=4.19.0',
        'ffmpeg-python==0.2.0'
    ]
    
    for dep in dependencies:
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', dep], 
                          check=True, capture_output=True)
            print(f"Installation de {dep} terminée.")
        except Exception as e:
            print(f"Erreur lors de l'installation de {dep}: {str(e)}")
    
    # Installer openai-whisper
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'openai-whisper'], 
                      check=True, capture_output=True)
        print("Installation de openai-whisper terminée.")
    except Exception as e:
        print(f"Erreur lors de l'installation de openai-whisper: {str(e)}")
    
    # Vérifier l'installation
    try:
        subprocess.run([sys.executable, '-c', 'import openai.whisper as whisper; print("Whisper importé avec succès!")'], 
                      check=True, capture_output=True)
        print("Vérification réussie. Whisper est correctement installé.")
    except Exception as e:
        print(f"Erreur lors de la vérification de l'installation de whisper: {str(e)}")
        print("L'installation a échoué. Continuez avec la version alternative sans whisper local.")

if __name__ == "__main__":
    install_correct_whisper()