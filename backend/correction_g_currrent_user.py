#!/usr/bin/env python
"""
Ce script parcourt tous les fichiers Python dans un répertoire
et recherche les motifs d'accès à g.current_user comme un dictionnaire.
"""
import os
import re
import sys
from colorama import init, Fore, Style

# Initialiser colorama
init()

def search_files(directory):
    """Recherche les motifs dans tous les fichiers Python du répertoire"""
    patterns = [
        r"g\.current_user\['[^']*'\]",  # g.current_user['xyz']
        r'g\.current_user\["[^"]*"\]',  # g.current_user["xyz"]
        r"g\.current_user\.get\('[^']*'",  # g.current_user.get('xyz'
        r'g\.current_user\.get\("[^"]*"',  # g.current_user.get("xyz"
    ]
    
    # Compiler les regex pour de meilleures performances
    compiled_patterns = [re.compile(pattern) for pattern in patterns]
    
    issues_found = 0
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    try:
                        lines = f.readlines()
                    except UnicodeDecodeError:
                        print(f"Erreur de décodage pour {file_path}, ignorer.")
                        continue
                
                for line_num, line in enumerate(lines, 1):
                    for pattern in compiled_patterns:
                        matches = pattern.findall(line)
                        if matches:
                            issues_found += 1
                            print(f"{Fore.YELLOW}{file_path}:{line_num}{Style.RESET_ALL}")
                            print(f"  {Fore.RED}{line.strip()}{Style.RESET_ALL}")
                            print(f"  {Fore.GREEN}→ Remplacez g.current_user['xyz'] par g.current_user.xyz{Style.RESET_ALL}")
                            print()
    
    return issues_found

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <directory>")
        sys.exit(1)
    
    directory = sys.argv[1]
    if not os.path.isdir(directory):
        print(f"Le répertoire {directory} n'existe pas.")
        sys.exit(1)
    
    print(f"Recherche des accès à g.current_user comme dictionnaire dans {directory}...")
    issues = search_files(directory)
    
    if issues > 0:
        print(f"✅ {issues} problèmes potentiels trouvés. Corrigez-les en utilisant la notation d'attribut (g.current_user.xyz).")
    else:
        print("✅ Aucun problème potentiel trouvé.")