# quick_check.py
# Vérification rapide que tout est en place

import os
import sys

def main():
    print("🔍 Vérification rapide setup avatar")
    print("=" * 40)
    
    errors = []
    
    # 1. Vérifier que le fichier avatar_service.py existe
    if os.path.exists("/backend/app/services/avatar_service.py"):
        print("✅ Fichier avatar_service.py existe")
    else:
        print("❌ Fichier avatar_service.py manquant")
        errors.append("Créer app/services/avatar_service.py")
    
    # 2. Vérifier que le fichier app.py existe  
    if os.path.exists("/backend/app/__init__.py"):
        print("✅ Fichier app.py existe")
        
        # Vérifier le contenu
        with open("backend/app.py", "r") as f:
            content = f.read()
            
        if "from services.avatar_service import init_avatar_service" in content:
            print("✅ Import avatar_service trouvé dans app.py")
        else:
            print("❌ Import avatar_service manquant dans app.py")
            errors.append("Ajouter: from services.avatar_service import init_avatar_service")
            
        if "init_avatar_service(socketio)" in content:
            print("✅ Initialisation avatar_service trouvée dans app.py")
        else:
            print("❌ Initialisation avatar_service manquante dans app.py")
            errors.append("Ajouter: init_avatar_service(socketio)")
            
    else:
        print("❌ Fichier app.py non trouvé")
        errors.append("Vérifier le chemin vers app.py")
    
    # 3. Test d'import
    try:
        sys.path.append('backend')
        from app.services.avatar_service import AvatarService, init_avatar_service, get_avatar_service
        print("✅ Import du service avatar réussi")
    except Exception as e:
        print(f"❌ Erreur import avatar_service: {e}")
        errors.append("Corriger les erreurs dans avatar_service.py")
    
    # Résumé
    print("\n" + "=" * 40)
    if errors:
        print("❌ Problèmes détectés :")
        for i, error in enumerate(errors, 1):
            print(f"  {i}. {error}")
    else:
        print("✅ Setup avatar OK - relancez votre serveur")
    
    return len(errors) == 0

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🚀 Vous pouvez maintenant tester avec : python test_avatar.py")
    else:
        print("\n🔧 Corrigez les problèmes puis relancez cette vérification")