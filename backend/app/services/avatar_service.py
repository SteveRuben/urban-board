import asyncio
import os
import platform
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, Optional
from flask import abort
from ..services.meet_chat_manager import MeetChatManager

try:
    from playwright.async_api import async_playwright
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
    print("✅ Playwright disponible")
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    print("❌ Playwright non disponible - Installez avec: pip install playwright")

class AvatarService:
    """Service Avatar avec Playwright + Chrome - Compatible Linux & Windows"""
    
    def __init__(self, socketio):
        self.socketio = socketio
        self.active_avatars = {} 
        self.scheduled_launches = {} 
        self.monitor_thread = None
        self.running = False
        self.avatar_browsers = {}  # Stocke les browsers Playwright
        self.avatar_pages = {}     # Stocke les pages Meet
        self.avatar_timers = {}
        self.launch_logs = {}
        self.meet_chat_manager = MeetChatManager(self)
        self.meet_chat_manager.start()
        self.sessions = {}
        # Détection de l'environnement
        self.system = platform.system().lower()  # 'linux', 'windows', 'darwin'
        self.is_server = self._detect_server_environment()
        
        print(f"🖥️  Système détecté: {self.system.title()}")
        print(f"🌐 Environnement: {'Serveur' if self.is_server else 'Local'}")
        print(f"🎭 Navigateur: Chrome via Playwright")
        
        # Vérifier Playwright
        if not PLAYWRIGHT_AVAILABLE:
            print("❌ Playwright requis pour ce service")
            print("💡 Installation: pip install playwright && playwright install chrome")
            return
        
        # Configuration IA vs Simulation
        self.ai_api_key = self._get_ai_api_key()
        self.simulation_mode = not bool(self.ai_api_key)
        
        # Questions de simulation
        self.simulation_questions = self._load_simulation_questions()
        
        # Démarrer le scheduler
        self.scheduler_thread = threading.Thread(target=self.start_scheduler_loop, daemon=True)
        self.scheduler_thread.start()
        
        print(f"✅ Avatar Service initialisé - Chrome + Playwright")
        print(f"🤖 Mode: {'Simulation' if self.simulation_mode else 'IA'}")
    
    def _detect_server_environment(self):
        """Détecte si on est sur un serveur (Linux sans GUI)"""
        if self.system == 'linux':
            # Vérifier si on a un display
            return not bool(os.environ.get('DISPLAY'))
        return False
    
    def _get_ai_api_key(self):
        """Récupère la clé API IA depuis la configuration"""
        
        api_keys = [
            os.getenv('OPENAI_API_KEY'),
            os.getenv('ANTHROPIC_API_KEY'),
            os.getenv('AZURE_OPENAI_KEY'),
            os.getenv('AI_API_KEY')
        ]
        
        for key in api_keys:
            if key and key.strip():
                return key.strip()
        
        return None
    
    def _load_simulation_questions(self):
        """Charge les questions de simulation par type de poste"""
        
        return {
            'développeur': {
                'introduction': "Bonjour ! Je suis votre assistant IA pour cet entretien technique. Nous allons explorer votre expérience en développement.",
                'questions': [
                    {
                        'timing': 60,
                        'question': "Pouvez-vous nous présenter votre parcours en développement et les technologies que vous maîtrisez le mieux ?"
                    },
                    {
                        'timing': 300,
                        'question': "Décrivez-nous un projet technique récent dont vous êtes particulièrement fier. Quels défis avez-vous rencontrés ?"
                    },
                    {
                        'timing': 600,
                        'question': "Comment organisez-vous votre code pour qu'il soit maintenable ? Utilisez-vous des design patterns spécifiques ?"
                    },
                    {
                        'timing': 900,
                        'question': "Comment abordez-vous le debugging d'un problème complexe en production ?"
                    },
                    {
                        'timing': 1200,
                        'question': "Quelle est votre approche pour rester à jour avec les nouvelles technologies et bonnes pratiques ?"
                    }
                ]
            },
            'commercial': {
                'introduction': "Bonjour ! Je suis votre assistant IA pour cet entretien commercial. Explorons ensemble vos compétences en vente.",
                'questions': [
                    {
                        'timing': 60,
                        'question': "Présentez-nous votre expérience commerciale et vos secteurs d'expertise."
                    },
                    {
                        'timing': 300,
                        'question': "Décrivez votre processus de vente, de la prospection à la signature du contrat."
                    },
                    {
                        'timing': 600,
                        'question': "Comment gérez-vous un client difficile ou une objection forte ?"
                    },
                    {
                        'timing': 900,
                        'question': "Racontez-nous votre plus belle réussite commerciale. Qu'est-ce qui a fait la différence ?"
                    },
                    {
                        'timing': 1200,
                        'question': "Comment organisez-vous votre prospection et le suivi de vos leads ?"
                    }
                ]
            },
            'default': {
                'introduction': "Bonjour ! Je suis votre assistant IA pour cet entretien. Explorons ensemble votre parcours professionnel.",
                'questions': [
                    {
                        'timing': 60,
                        'question': "Pouvez-vous nous présenter votre parcours professionnel et vos principales compétences ?"
                    },
                    {
                        'timing': 300,
                        'question': "Décrivez-nous une réalisation professionnelle dont vous êtes particulièrement fier."
                    },
                    {
                        'timing': 600,
                        'question': "Comment gérez-vous les défis et les situations difficiles au travail ?"
                    },
                    {
                        'timing': 900,
                        'question': "Quelles sont vos motivations pour rejoindre notre entreprise ?"
                    },
                    {
                        'timing': 1200,
                        'question': "Comment voyez-vous l'évolution de votre carrière dans les prochaines années ?"
                    }
                ]
            }
        }
    
    def _get_chrome_config(self):
        """Configuration Chrome optimisée selon le système"""
        
        config = {
            'headless': True,  # Toujours en mode headless pour serveur
            'args': [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--window-size=1920,1080',
                '--start-maximized',
                
                # 🎯 OPTIMISATIONS MEET
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                '--allow-running-insecure-content',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                
                # 🚀 PERFORMANCE SERVEUR
                '--memory-pressure-off',
                '--max_old_space_size=4096',
                '--disable-background-networking',
                '--disable-background-sync',
                '--disable-client-side-phishing-detection',
                '--disable-default-apps',
                '--disable-extensions',
                '--disable-hang-monitor',
                '--disable-prompt-on-repost',
                '--disable-sync',
                '--metrics-recording-only',
                '--no-first-run',
                '--safebrowsing-disable-auto-update',
                '--password-store=basic',
                
                # 🎯 MEDIA PERMISSIONS POUR MEET
                '--autoplay-policy=no-user-gesture-required',
                '--disable-features=MediaRouter',
            ]
        }
        
        # Optimisations spécifiques selon le système
        if self.system == 'linux':
            config['args'].extend([
                '--disable-dev-shm-usage',
                '--disable-gpu-sandbox',
                '--single-process'  # Pour serveurs très limités
            ])
        elif self.system == 'windows':
            config['args'].extend([
                '--disable-gpu-vsync',
                '--disable-gpu-compositing'
            ])
        
        return config
    
    def start_scheduler_loop(self):
        """Boucle infinie qui vérifie les lancements à faire"""
        while True:
            now = datetime.utcnow()
            
            for interview_id, data in list(self.scheduled_launches.items()):
                launch_time = data['launch_time']
                
                if now >= launch_time and data['status'] == 'scheduled':
                    self._launch_avatar(interview_id)
                    
            time.sleep(30)
    
    def start(self):
        """Démarre le service de monitoring"""
        if self.running:
            return
        if hasattr(self, 'meet_chat_manager'):
            self.meet_chat_manager.start()
    
        self.running = True
        self.monitor_thread = threading.Thread(target=self._monitor_scheduled_launches)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
        print("✅ Avatar Service démarré (Playwright)")
    
    def stop(self):
        """Arrête le service et ferme tous les avatars"""
        self.running = False
        
        if hasattr(self, 'meet_chat_manager'):
                    self.meet_chat_manager.stop()   
        # Fermer tous les browsers actifs
        for interview_id, browser in self.avatar_browsers.items():
            try:
                asyncio.run(browser.close())
                    
            except:
                pass
        
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2)
        print("✅ Avatar Service arrêté")
    
    def schedule_avatar_launch(self, interview_id: str, scheduled_at: datetime, interview_data: Dict):
        """Programme le lancement d'un avatar"""
        
        if not interview_data.get('meet_link'):
            return {
                'success': False,
                'error': 'Lien Google Meet manquant'
            }
        
        launch_time = scheduled_at - timedelta(minutes=2)
        
        self.scheduled_launches[interview_id] = {
            'launch_time': launch_time,
            'interview_data': interview_data,
            'status': 'scheduled'
        }
        
        print(f"🤖 Avatar Playwright programmé pour {interview_id} à {launch_time}")
        
        return {
            'success': True,
            'launch_time': launch_time.isoformat(),
            'interview_id': interview_id,
            'browser': 'chrome_playwright'
        }
    
    def _monitor_scheduled_launches(self):
        """Surveille et lance les avatars programmés"""
        
        while self.running:
            try:
                current_time = datetime.utcnow()
                to_launch = []
                
                for interview_id, data in list(self.scheduled_launches.items()):
                    if current_time >= data['launch_time'] and data['status'] == 'scheduled':
                        to_launch.append(interview_id)
                
                for interview_id in to_launch:
                    self._launch_avatar(interview_id)
                
                self._check_active_avatars()
                time.sleep(30)
                
            except Exception as e:
                print(f"❌ Erreur monitor: {e}")
                time.sleep(60)
    
    def _launch_avatar(self, interview_id: str):
        """Lance effectivement un avatar avec Playwright"""
        
        try:
            if interview_id not in self.scheduled_launches:
                return
            
            data = self.scheduled_launches[interview_id]
            interview_data = data['interview_data']
            
            print(f"🚀 Lancement avatar Playwright pour entretien {interview_id}")
            
            data['status'] = 'launching'
            
            # Créer la session avatar avec Playwright
            avatar_data = self._create_playwright_session(interview_id, interview_data)
            
            if avatar_data['success']:
                data['status'] = 'active'
                self.active_avatars[interview_id] = avatar_data
                
                self._update_interview_ai_status(interview_id, True)
                
                self.socketio.emit('avatar_launched', {
                    'interview_id': interview_id,
                    'status': 'success',
                    'timestamp': datetime.utcnow().isoformat(),
                    'meet_joined': True,
                    'browser': 'chrome_playwright',
                    'system': self.system
                })
                
                print(f"✅ Avatar Playwright lancé avec succès pour {interview_id}")
                
            else:
                print(f"❌ Échec lancement avatar Playwright pour {interview_id}: {avatar_data.get('error')}")
                data['status'] = 'failed'
                
                self.socketio.emit('avatar_launch_failed', {
                    'interview_id': interview_id,
                    'error': avatar_data.get('error'),
                    'timestamp': datetime.utcnow().isoformat()
                })
                
        except Exception as e:
            print(f"❌ Erreur lancement avatar {interview_id}: {e}")
    
    def _create_playwright_session(self, interview_id: str, interview_data: Dict):
        """Crée une session avatar avec système de timers JavaScript autonomes"""

        try:
            meet_link = interview_data.get('meet_link')
            if not meet_link:
                return {'success': False, 'error': 'Lien Meet manquant'}

            # Logs de debug
            self.launch_logs[interview_id] = {
                'start_time': datetime.utcnow().isoformat(),
                'system': self.system,
                'browser': 'chrome_playwright',
                'steps': [],
                'errors': []
            }

            def log_step(step, success=True, details=""):
                self.launch_logs[interview_id]['steps'].append({
                    'step': step,
                    'success': success,
                    'details': details,
                    'timestamp': datetime.utcnow().isoformat()
                })
                print(f"{'✅' if success else '❌'} {step}: {details}")

            log_step("Initialisation", True, f"Début session Playwright sur {self.system}")

            # Initialiser les conteneurs s'ils n'existent pas
            if not hasattr(self, 'avatar_contexts'):
                self.avatar_contexts = {}
            if not hasattr(self, 'avatar_playwrights'):
                self.avatar_playwrights = {}

            try:
                from playwright.sync_api import sync_playwright

                # ÉTAPE 1 : Créer instance Playwright
                log_step("Playwright start", True, "Création instance Playwright...")
                p = sync_playwright().start()
                log_step("Playwright OK", True, "Instance Playwright créée")

                # ÉTAPE 2 : Configuration Chrome
                chrome_args = [
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--use-fake-ui-for-media-stream',
                    '--allow-running-insecure-content',
                    '--autoplay-policy=no-user-gesture-required'
                ]

                log_step("Configuration Chrome", True, "Arguments Chrome préparés")

                # ÉTAPE 3 : Lancer browser
                try:
                    browser = p.chromium.launch(
                        headless=True,
                        args=chrome_args
                    )
                    log_step("Browser lancé", True, "Chrome démarré")
                except Exception as e:
                    log_step("Browser lancé", False, f"Erreur launch: {str(e)}")
                    p.stop()
                    return {'success': False, 'error': f'Impossible de lancer Chrome: {str(e)}'}

                # ÉTAPE 4 : Vérifier browser
                try:
                    browser_version = browser.version
                    log_step("Browser test", True, f"Version: {browser_version}")
                except Exception as e:
                    log_step("Browser test", False, f"Browser mort: {str(e)}")
                    try:
                        browser.close()
                    except:
                        pass
                    p.stop()
                    return {'success': False, 'error': 'Browser fermé immédiatement'}

                # ÉTAPE 5 : Créer contexte
                try:
                    context = browser.new_context(
                        viewport={'width': 1920, 'height': 1080},
                        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    )
                    log_step("Contexte créé", True, "Contexte browser créé")
                except Exception as e:
                    log_step("Contexte créé", False, f"Erreur contexte: {str(e)}")
                    browser.close()
                    p.stop()
                    return {'success': False, 'error': f'Erreur contexte: {str(e)}'}

                # ÉTAPE 6 : Créer page et tester
                try:
                    page = context.new_page()
                    log_step("Page créée", True, "Page browser créée")

                    # Test avec page simple
                    page.goto("data:text/html,<html><body><h1>Test</h1></body></html>", timeout=10000)
                    test_title = page.title()
                    log_step("Page test", True, f"Test OK: {test_title}")

                except Exception as e:
                    log_step("Page test", False, f"Page fermée: {str(e)}")
                    try:
                        context.close()
                        browser.close()
                    except:
                        pass
                    p.stop()
                    return {'success': False, 'error': f'Page se ferme: {str(e)}'}

                # STOCKER LES RÉFÉRENCES
                self.avatar_browsers[interview_id] = browser
                self.avatar_pages[interview_id] = page  
                self.avatar_contexts[interview_id] = context
                self.avatar_playwrights[interview_id] = p

                log_step("Références stockées", True, "Browser, page, contexte sauvegardés")

                # ÉTAPE 7 : Navigation Meet et injection système chat
                try:
                    log_step("Navigation Meet", True, f"Accès: {meet_link}")

                    # Navigation vers Meet
                    enhanced_meet_link = f"{meet_link}?authuser=0&hl=en"
                    log_step("Meet Enhanced", True, f"Lien modifié: {enhanced_meet_link}")
                    page.goto(enhanced_meet_link, wait_until='domcontentloaded', timeout=30000)
                    page.wait_for_timeout(5000)  # Attendre plus longtemps

                    current_url = page.url
                    log_step("Meet chargé", True, f"URL: {current_url[:50]}...")

                    # 🎯 NOUVEAU : AUTO-JOIN OBLIGATOIRE
                    try:
                        log_step("Auto-join Meet", True, "Tentative de rejoindre automatiquement...")
                        
                        # Prendre capture avant join pour debug
                        page.screenshot(path=f'/tmp/meet_before_join_{interview_id}.png')
                        log_step("Screenshot avant", True, f"Capture: /tmp/meet_before_join_{interview_id}.png")
                        
                        # Forcer le join avec toutes les stratégies
                        join_success = self._smart_meet_strategy(page, log_step)
                        
                        if join_success:
                            log_step("Join réussi", True, "✅ Réunion rejointe avec succès")
                            
                            # Attendre stabilisation après join
                            page.wait_for_timeout(8000)
                            
                            # Screenshot après join pour vérification
                            page.screenshot(path=f'/tmp/meet_after_join_{interview_id}.png')
                            log_step("Screenshot après", True, f"Capture: /tmp/meet_after_join_{interview_id}.png")
                            
                            # Tester l'ouverture du chat et envoi d'un message test
                            chat_success = self._force_open_chat_and_test(page, log_step)
                            if chat_success:
                                log_step("Chat accessible", True, "✅ Chat ouvert et testé")
                            else:
                                log_step("Chat inaccessible", False, "⚠️ Chat non accessible")
                                
                        else:
                            log_step("Join échoué", False, "❌ Impossible de rejoindre - continuons quand même")
                            # Ne pas faire return pour permettre au script JS de continuer
                            
                    except Exception as e:
                        log_step("Erreur auto-join", False, f"Erreur join: {str(e)}")
                except Exception as e:
                    log_step("Navigation Meet", False, f"Meet inaccessible: {str(e)[:100]}")

                
                
                
                # ÉTAPE 8 : Configuration finale
                avatar_config = {
                    'interview_id': interview_id,
                    'candidate_name': interview_data.get('candidate_name'),
                    'position': interview_data.get('position'),
                    'mode': interview_data.get('mode', 'autonomous'),
                    'meet_link': meet_link,
                    'browser': 'chrome_playwright',
                    'system': self.system,
                    'status': 'javascript_timers_active'
                }

                # AJOUTER À ACTIVE_AVATARS pour le monitoring
                self.active_avatars[interview_id] = {
                    'config': avatar_config,
                    'started_at': datetime.utcnow().isoformat(),
                    'browser': 'chrome_playwright',
                    'system': self.system,
                    'status': 'running_with_js_timers'
                }

                # ÉTAPE 9 : Démarrer surveillance simple (pas d'envoi de messages)
                self._start_simple_monitoring(interview_id, page, avatar_config)

                log_step("Session complète", True, "Avatar avec timers JavaScript prêt")

                return {
                    'success': True,
                    'avatar_id': f"avatar_pw_{interview_id}",
                    'config': avatar_config,
                    'started_at': datetime.utcnow().isoformat(),
                    'meet_joined': True,
                    'browser': 'chrome_playwright',
                    'system': self.system,
                    'mode': 'javascript_timers_autonomous'
                }

            except Exception as e:
                log_step("Erreur générale", False, f"Exception: {str(e)}")
                return {'success': False, 'error': f'Erreur Playwright: {str(e)}'}

        except Exception as e:
            print(f"❌ Erreur création session Playwright: {e}")
            return {'success': False, 'error': str(e)}

    def _diagnose_meet_page(self, page, log_step):
        """Analyse intelligente et complète de la page Meet"""
        
        try:
            log_step("Diagnostic Meet", True, "Analyse complète de l'état de la page...")
            
            # 📄 INFORMATIONS GÉNÉRALES
            current_url = page.url
            page_title = page.title()
            
            diagnosis = {
                'url': current_url,
                'title': page_title,
                'state': 'unknown',
                'requires_join': False,
                'requires_auth': False,
                'is_accessible': False,
                'buttons_found': [],
                'form_elements': [],
                'error_messages': [],
                'visible_content': '',
                'meet_status': 'unknown'
            }
            
            log_step("Page info", True, f"URL: {current_url}, Title: {page_title}")
            
            # 📝 RÉCUPÉRER LE CONTENU VISIBLE
            try:
                visible_text = page.evaluate('() => document.body.innerText || document.body.textContent || ""')
                diagnosis['visible_content'] = visible_text[:1000]  # Premiers 1000 caractères
                log_step("Contenu visible", True, f"Récupéré {len(visible_text)} caractères")
                
                # Analyser le contenu pour comprendre l'état
                content_lower = visible_text.lower()
                
                # 🚨 DÉTECTION D'ERREURS SPÉCIFIQUES
                error_patterns = [
                    ('meeting_not_found', ['meeting not found', 'réunion introuvable', 'meeting does not exist']),
                    ('meeting_ended', ['meeting has ended', 'réunion est terminée', 'this meeting is over']),
                    ('access_denied', ['you can\'t join', 'vous ne pouvez pas', 'access denied', 'accès refusé']),
                    ('auth_required', ['sign in', 'se connecter', 'connexion requise', 'authentication']),
                    ('waiting_room', ['waiting for', 'en attente', 'waiting room', 'salle d\'attente']),
                    ('meeting_full', ['meeting is full', 'réunion est pleine', 'maximum participants'])
                ]
                
                for error_type, keywords in error_patterns:
                    if any(keyword in content_lower for keyword in keywords):
                        diagnosis['meet_status'] = error_type
                        diagnosis['state'] = 'error'
                        log_step("Status détecté", True, f"Meet status: {error_type}")
                        break
                
            except Exception as e:
                log_step("Contenu visible", False, f"Erreur: {e}")
            
            # 🔐 VÉRIFIER AUTHENTIFICATION GOOGLE
            auth_indicators = [
                'text="Sign in"',
                'text="Se connecter"', 
                'text="Connexion"',
                '[aria-label*="sign in" i]',
                '.gb_D',  # Bouton Google Account
                'input[type="email"]',
                'input[type="password"]',
                '[data-identifier="sign-in"]'
            ]
            
            for indicator in auth_indicators:
                try:
                    if page.query_selector(indicator):
                        diagnosis['requires_auth'] = True
                        diagnosis['state'] = 'needs_auth'
                        diagnosis['meet_status'] = 'auth_required'
                        log_step("Auth requise", True, f"Trouvé: {indicator}")
                        break
                except:
                    continue
            
            # 🚪 VÉRIFIER BOUTONS JOIN/PARTICIPATION
            join_indicators = [
                ('button:has-text("Ask to join")', 'ask_to_join'),
                ('button:has-text("Demander à participer")', 'ask_to_join'),
                ('button:has-text("Join now")', 'join_now'),
                ('button:has-text("Rejoindre maintenant")', 'join_now'),
                ('button:has-text("Join")', 'join'),
                ('button:has-text("Participer")', 'join'),
                ('[data-promo-anchor-id*="join"]', 'join_button'),
                ('[aria-label*="join" i]', 'join_aria'),
                ('[aria-label*="participer" i]', 'join_aria')
            ]
            
            join_buttons = []
            for selector, button_type in join_indicators:
                try:
                    elements = page.query_selector_all(selector)
                    for element in elements:
                        if element.is_visible():
                            text = element.inner_text()
                            join_buttons.append({
                                'selector': selector,
                                'text': text,
                                'type': button_type,
                                'visible': True
                            })
                except:
                    continue
            
            if join_buttons:
                diagnosis['requires_join'] = True
                diagnosis['state'] = 'needs_join'
                diagnosis['meet_status'] = 'waiting_for_join'
                diagnosis['buttons_found'].extend(join_buttons)
                log_step("Join requis", True, f"Trouvé {len(join_buttons)} boutons join")
            
            # 🎯 VÉRIFIER SI DÉJÀ DANS LA RÉUNION
            meeting_indicators = [
                ('[data-tooltip*="camera" i]', 'camera_controls'),
                ('[data-tooltip*="microphone" i]', 'mic_controls'),
                ('[aria-label*="camera" i]', 'camera_aria'),
                ('[aria-label*="microphone" i]', 'mic_aria'),
                ('[aria-label*="chat" i]', 'chat_button'),
                ('button[data-panel-id="chat"]', 'chat_panel'),
                ('[jsname*="mic" i]', 'mic_jsname'),
                ('[jsname*="cam" i]', 'camera_jsname'),
                ('.google-material-icons', 'material_icons')
            ]
            
            meeting_elements = []
            for selector, element_type in meeting_indicators:
                try:
                    elements = page.query_selector_all(selector)
                    if elements:
                        meeting_elements.extend([element_type] * len(elements))
                except:
                    continue
            
            if len(meeting_elements) >= 3:
                diagnosis['is_accessible'] = True
                diagnosis['state'] = 'already_in_meeting'
                diagnosis['meet_status'] = 'in_meeting'
                log_step("Déjà dans réunion", True, f"Contrôles trouvés: {meeting_elements}")
            
            # 📋 INVENTAIRE COMPLET DES BOUTONS
            try:
                all_buttons = page.query_selector_all('button')
                button_details = []
                for i, button in enumerate(all_buttons):
                    if i >= 15:  # Limiter à 15 boutons
                        break
                    try:
                        text = button.inner_text().strip()
                        aria_label = button.get_attribute('aria-label') or ''
                        is_visible = button.is_visible()
                        
                        if text or aria_label:
                            button_details.append({
                                'text': text[:50],  # Limiter la longueur
                                'aria_label': aria_label[:50],
                                'visible': is_visible,
                                'index': i
                            })
                    except:
                        continue
                
                diagnosis['buttons_found'].extend(button_details)
                visible_buttons = [b for b in button_details if b['visible']]
                log_step("Boutons détaillés", True, f"Total: {len(all_buttons)}, Visibles: {len(visible_buttons)}")
                
            except Exception as e:
                log_step("Inventaire boutons", False, f"Erreur: {e}")
            
            # 🔗 ANALYSE DE L'URL
            if 'meet.google.com' in current_url:
                if '/lookup/' in current_url:
                    diagnosis['meet_status'] = 'meeting_lookup'
                    diagnosis['state'] = 'error'
                    log_step("URL Analysis", True, "Page de lookup - réunion probablement introuvable")
                elif current_url.count('/') <= 4:  # URL basique meet.google.com/xyz-abc-def
                    diagnosis['meet_status'] = 'direct_meeting_url'
                    log_step("URL Analysis", True, "URL directe de réunion")
                else:
                    log_step("URL Analysis", True, "URL Meet complexe")
            
            # 📊 DÉTERMINATION FINALE DE L'ÉTAT
            if diagnosis['state'] == 'unknown':
                if diagnosis['meet_status'] in ['meeting_not_found', 'meeting_ended', 'access_denied']:
                    diagnosis['state'] = 'error'
                elif 'Return to home screen' in str(diagnosis['buttons_found']):
                    diagnosis['state'] = 'error'
                    diagnosis['meet_status'] = 'meeting_unavailable'
                    log_step("État final", True, "Réunion non disponible (bouton retour accueil détecté)")
            
            # 📊 RAPPORT FINAL
            log_step("Meet Status", True, f"Status: {diagnosis['meet_status']}")
            log_step("État final", True, f"State: {diagnosis['state']}")
            log_step("Résumé", True, f"Auth: {diagnosis['requires_auth']}, Join: {diagnosis['requires_join']}, Accessible: {diagnosis['is_accessible']}")
            
            # Log du contenu visible si c'est une erreur
            if diagnosis['state'] == 'error' and diagnosis['visible_content']:
                log_step("Contenu d'erreur", True, f"Message: {diagnosis['visible_content'][:200]}...")
            
            return diagnosis
            
        except Exception as e:
            log_step("Erreur diagnostic", False, str(e))
            return {'state': 'error', 'error': str(e), 'meet_status': 'diagnostic_error'}

    def _smart_meet_strategy(self, page, log_step):
        """Stratégie intelligente basée sur le diagnostic amélioré"""
        
        try:
            # D'abord diagnostiquer
            diagnosis = self._diagnose_meet_page(page, log_step)
            
            state = diagnosis.get('state', 'unknown')
            meet_status = diagnosis.get('meet_status', 'unknown')
            
            log_step("Stratégie choisie", True, f"État: {state}, Status: {meet_status}")
            
            # 🔐 CAS : AUTHENTIFICATION REQUISE
            if state == 'needs_auth':
                log_step("Action Auth", False, "⚠️ Authentification Google requise")
                log_step("Solution Auth", True, "💡 Vous devez d'abord vous connecter à Google Meet manuellement")
                return False
            
            # ❌ CAS : ERREURS MEET
            elif state == 'error':
                if meet_status == 'meeting_not_found':
                    log_step("Action Erreur", False, "❌ Réunion introuvable - le lien Meet est invalide")
                elif meet_status == 'meeting_ended':
                    log_step("Action Erreur", False, "❌ Réunion terminée - elle n'est plus active")
                elif meet_status == 'access_denied':
                    log_step("Action Erreur", False, "❌ Accès refusé - vous n'êtes pas autorisé à rejoindre")
                elif meet_status == 'meeting_unavailable':
                    log_step("Action Erreur", False, "❌ Réunion non disponible - vérifiez le lien ou l'heure")
                else:
                    errors = diagnosis.get('error_messages', [])
                    content = diagnosis.get('visible_content', '')[:200]
                    log_step("Action Erreur", False, f"❌ Erreur Meet: {content}")
                
                # Essayer une stratégie de contournement
                return self._try_fallback_strategy(page, diagnosis, log_step)
            
            # ✅ CAS : DÉJÀ DANS LA RÉUNION
            elif state == 'already_in_meeting':
                log_step("Action Succès", True, "✅ Déjà dans la réunion - aucun join nécessaire")
                return True
            
            # 🚪 CAS : BESOIN DE REJOINDRE
            elif state == 'needs_join':
                log_step("Action Join", True, "🚪 Tentative de join avec boutons détectés")
                
                # Utiliser les boutons trouvés dans le diagnostic
                join_buttons = [b for b in diagnosis.get('buttons_found', []) if isinstance(b, dict) and b.get('type')]
                
                for button_info in join_buttons:
                    try:
                        selector = button_info['selector']
                        button_type = button_info.get('type', 'unknown')
                        
                        log_step("Tentative join", True, f"Type: {button_type}, Texte: {button_info.get('text', '')}")
                        
                        element = page.query_selector(selector)
                        if element and element.is_visible():
                            element.click()
                            page.wait_for_timeout(5000)
                            
                            # Re-diagnostiquer après le clic
                            new_diagnosis = self._diagnose_meet_page(page, log_step)
                            if new_diagnosis.get('is_accessible') or new_diagnosis.get('state') == 'already_in_meeting':
                                log_step("Join réussi", True, "✅ Maintenant dans la réunion")
                                return True
                            else:
                                log_step("Join partiel", False, f"Clic effectué mais état: {new_diagnosis.get('state')}")
                                
                    except Exception as e:
                        log_step("Erreur clic join", False, f"Button {button_info.get('text', '')}: {str(e)}")
                        continue
                
                log_step("Join échoué", False, "❌ Aucun bouton join fonctionnel")
                return False
            
            # 🤷 CAS : ÉTAT INCONNU
            else:
                log_step("Action Inconnue", False, f"🤷 État inconnu: {state}")
                
                # Essayer les stratégies génériques
                return self._try_generic_strategies(page, diagnosis, log_step)
        
        except Exception as e:
            log_step("Erreur stratégie", False, str(e))
            return False

    def _try_fallback_strategy(self, page, diagnosis, log_step):
        """Stratégie de contournement pour les erreurs Meet"""
        
        try:
            log_step("Stratégie contournement", True, "Tentative de récupération...")
            
            # 🔄 STRATÉGIE 1 : Actualiser la page
            log_step("Actualisation", True, "Rechargement de la page...")
            page.reload(wait_until='domcontentloaded')
            page.wait_for_timeout(5000)
            
            # Re-diagnostiquer après actualisation
            new_diagnosis = self._diagnose_meet_page(page, log_step)
            if new_diagnosis.get('state') in ['needs_join', 'already_in_meeting']:
                log_step("Actualisation réussie", True, "✅ Page récupérée après actualisation")
                return self._smart_meet_strategy(page, log_step)
            
            # 🔄 STRATÉGIE 2 : Essayer de naviguer vers la page d'accueil Meet
            log_step("Navigation accueil", True, "Tentative via page d'accueil Meet...")
            page.goto('https://meet.google.com/', wait_until='domcontentloaded')
            page.wait_for_timeout(3000)
            
            # Retourner à l'URL originale
            original_url = diagnosis.get('url', '')
            if original_url:
                page.goto(original_url, wait_until='domcontentloaded')
                page.wait_for_timeout(5000)
                
                final_diagnosis = self._diagnose_meet_page(page, log_step)
                if final_diagnosis.get('state') in ['needs_join', 'already_in_meeting']:
                    log_step("Navigation réussie", True, "✅ Récupération via navigation")
                    return self._smart_meet_strategy(page, log_step)
            
            log_step("Contournement échoué", False, "❌ Impossible de récupérer la réunion")
            return False
            
        except Exception as e:
            log_step("Erreur contournement", False, str(e))
            return False

    def _try_generic_strategies(self, page, diagnosis, log_step):
        """Stratégies génériques quand l'état est inconnu"""
        
        try:
            log_step("Stratégies génériques", True, "Tentatives génériques...")
            
            # 🔍 STRATÉGIE 1 : Chercher tout élément cliquable avec "join" dans le texte
            log_step("Recherche join générique", True, "Scan de tous les éléments...")
            
            try:
                # Chercher tous les éléments avec "join", "participer", etc. dans le texte
                join_keywords = ['join', 'participer', 'rejoindre', 'demander', 'enter', 'access']
                
                for keyword in join_keywords:
                    elements = page.query_selector_all(f'*:has-text("{keyword}")')
                    
                    for element in elements[:3]:  # Limiter à 3 tentatives par mot-clé
                        try:
                            if element.is_visible():
                                text = element.inner_text()[:50]
                                log_step("Élément join trouvé", True, f"Clic sur: {text}")
                                element.click()
                                page.wait_for_timeout(3000)
                                
                                # Vérifier si ça a marché
                                check_diagnosis = self._diagnose_meet_page(page, log_step)
                                if check_diagnosis.get('is_accessible'):
                                    log_step("Join générique réussi", True, f"✅ Via: {text}")
                                    return True
                                    
                        except Exception:
                            continue
            except Exception:
                pass
            
            # 🔍 STRATÉGIE 2 : Forcer les contrôles media (parfois ça active la réunion)
            log_step("Activation contrôles", True, "Tentative activation des contrôles media...")
            
            try:
                # Simuler raccourcis clavier Meet
                shortcuts = ['Control+d', 'Control+e', 'Control+m']  # Camera, Mic toggle
                for shortcut in shortcuts:
                    page.keyboard.press(shortcut)
                    page.wait_for_timeout(1000)
                    
                    # Vérifier si ça active quelque chose
                    post_shortcut = self._diagnose_meet_page(page, log_step)
                    if post_shortcut.get('is_accessible'):
                        log_step("Raccourci réussi", True, f"✅ Via raccourci: {shortcut}")
                        return True
                        
            except Exception:
                pass
            
            log_step("Stratégies génériques échouées", False, "❌ Aucune stratégie générique ne fonctionne")
            return False
            
        except Exception as e:
            log_step("Erreur stratégies génériques", False, str(e))
            return False
    
    def _force_join_meet_multiple_strategies(self, page, log_step):
        """Force le join avec toutes les stratégies possibles"""
        
        try:
            # 🎯 STRATÉGIE 1 : Boutons de participation classiques
            join_selectors = [
                # Textes français
                'button:has-text("Demander à participer")',
                'button:has-text("Participer maintenant")',
                'button:has-text("Rejoindre maintenant")',
                'button:has-text("Rejoindre")',
                
                # Textes anglais
                'button:has-text("Ask to join")',
                'button:has-text("Join now")',
                'button:has-text("Join")',
                
                # Sélecteurs CSS spécifiques Meet
                '[data-promo-anchor-id="join-meeting"]',
                '[aria-label*="join" i]',
                '[aria-label*="participer" i]',
                '.uArJ5e',  # Classe Google Meet
                'button[jsname*="join" i]'
            ]
            
            for selector in join_selectors:
                try:
                    log_step("Test sélecteur", True, f"Essai: {selector}")
                    element = page.wait_for_selector(selector, timeout=3000)
                    if element and element.is_visible():
                        log_step("Bouton trouvé", True, f"Clic sur: {selector}")
                        element.click()
                        page.wait_for_timeout(5000)  # Attendre le join
                        
                        # Vérifier si on est dans la réunion
                        if self._is_in_meeting(page):
                            log_step("Join confirmé", True, "Dans la réunion")
                            return True
                        else:
                            log_step("Join partiel", False, f"Clic fait mais pas encore dans réunion")
                            
                except Exception as e:
                    log_step("Sélecteur échoué", False, f"{selector}: {str(e)}")
                    continue
            
            # 🎯 STRATÉGIE 2 : Recherche générale de boutons
            log_step("Stratégie générale", True, "Recherche tous boutons...")
            
            try:
                buttons = page.query_selector_all('button')
                for i, button in enumerate(buttons):
                    if i > 20:  # Limiter pour éviter boucle infinie
                        break
                    try:
                        text = button.inner_text().lower()
                        if any(word in text for word in ['join', 'participer', 'rejoindre', 'demander']):
                            log_step("Bouton générique", True, f"Clic sur: {text[:30]}...")
                            button.click()
                            page.wait_for_timeout(5000)
                            
                            if self._is_in_meeting(page):
                                log_step("Join générique réussi", True, f"Via bouton: {text}")
                                return True
                                
                    except Exception:
                        continue
                        
            except Exception as e:
                log_step("Stratégie générale échouée", False, str(e))
            
            # 🎯 STRATÉGIE 3 : Raccourcis clavier
            log_step("Raccourcis clavier", True, "Essai raccourcis...")
            try:
                # Essayer Enter (souvent bouton par défaut)
                page.keyboard.press('Enter')
                page.wait_for_timeout(3000)
                
                if self._is_in_meeting(page):
                    log_step("Join par Enter", True, "Réussi avec Enter")
                    return True
                    
            except Exception as e:
                log_step("Raccourcis échoués", False, str(e))
            
            log_step("Toutes stratégies échouées", False, "Impossible de rejoindre")
            return False
            
        except Exception as e:
            log_step("Erreur join global", False, str(e))
            return False

    def _is_in_meeting(self, page):
        """Vérifie si on est effectivement dans la réunion Meet"""
        
        try:
            # Indicateurs qu'on est dans une réunion active
            meeting_indicators = [
                '[data-tooltip*="camera" i]',          # Boutons caméra
                '[data-tooltip*="microphone" i]',      # Boutons micro
                '[aria-label*="camera" i]',
                '[aria-label*="microphone" i]',
                '[aria-label*="chat" i]',              # Bouton chat
                '[data-panel-id="chat"]',
                '.google-material-icons',              # Icônes Material dans Meet
                '[jsname*="mic" i]',                   # Contrôles micro
                '[jsname*="cam" i]'                    # Contrôles caméra
            ]
            
            indicators_found = 0
            for selector in meeting_indicators:
                try:
                    elements = page.query_selector_all(selector)
                    if len(elements) > 0:
                        indicators_found += 1
                except:
                    continue
            
            # Si on trouve au moins 2 indicateurs, on est probablement dans la réunion
            is_in = indicators_found >= 2
            
            # Vérification supplémentaire : pas de bouton "join" visible
            join_still_visible = False
            try:
                join_buttons = page.query_selector_all('button:has-text("Join"), button:has-text("Participer"), button:has-text("Demander")')
                join_still_visible = len(join_buttons) > 0
            except:
                pass
            
            return is_in and not join_still_visible
            
        except Exception:
            return False

    def _force_open_chat_and_test(self, page, log_step):
        """Force l'ouverture du chat et teste l'envoi"""
        
        try:
            log_step("Ouverture chat forcée", True, "Recherche contrôles chat...")
            
            # Sélecteurs pour ouvrir le chat
            chat_selectors = [
                '[aria-label*="chat" i]',
                '[data-tooltip*="chat" i]',
                'button[data-panel-id="chat"]',
                '[aria-label*="Afficher le chat" i]',
                '[aria-label*="Show chat" i]',
                'button:has-text("Chat")',
                'button:has-text("Discuter")',
                '[jsname*="chat" i]'
            ]
            
            chat_opened = False
            for selector in chat_selectors:
                try:
                    element = page.wait_for_selector(selector, timeout=3000)
                    if element and element.is_visible():
                        log_step("Chat bouton trouvé", True, f"Via: {selector}")
                        element.click()
                        page.wait_for_timeout(3000)
                        chat_opened = True
                        break
                except:
                    continue
            
            if not chat_opened:
                # Essayer raccourci clavier pour chat
                log_step("Raccourci chat", True, "Ctrl+Alt+C...")
                page.keyboard.press('Control+Alt+c')
                page.wait_for_timeout(2000)
                chat_opened = True  # Espérer que ça marche
            
            # Tester envoi message
            if chat_opened:
                test_message = f"🤖 Bot de test connecté - {datetime.utcnow().strftime('%H:%M:%S')}"
                success = self._test_send_message(page, test_message, log_step)
                return success
            
            return False
            
        except Exception as e:
            log_step("Erreur chat", False, str(e))
            return False

    def _test_send_message(self, page, message, log_step):
        """Teste l'envoi d'un message réel"""
        
        try:
            # Chercher zones de texte avec plus de variantes
            text_selectors = [
                'textarea[placeholder*="message" i]',
                'textarea[aria-label*="message" i]',
                'textarea[placeholder*="Envoyer" i]',
                'textarea[placeholder*="Send" i]',
                'textarea[placeholder*="Saisissez" i]',
                'div[role="textbox"]',
                '[contenteditable="true"]',
                'input[placeholder*="message" i]',
                '.DPvwYc textarea',
                '[jsname*="message" i] textarea',
                '[aria-label*="Saisissez" i]',
                '[aria-label*="Type" i]'
            ]
            
            for selector in text_selectors:
                try:
                    text_area = page.wait_for_selector(selector, timeout=3000)
                    if text_area and text_area.is_visible():
                        log_step("Zone texte trouvée", True, f"Selector: {selector}")
                        
                        # Stratégie d'envoi robuste
                        text_area.click()
                        page.wait_for_timeout(500)
                        
                        # Effacer contenu existant
                        text_area.press('Control+a')
                        text_area.press('Delete')
                        
                        # Taper le message
                        text_area.type(message)
                        page.wait_for_timeout(1000)
                        
                        # Envoyer avec Enter
                        text_area.press('Enter')
                        
                        log_step("Message envoyé", True, f"Message: {message[:30]}...")
                        return True
                        
                except Exception as e:
                    log_step("Sélecteur texte échoué", False, f"{selector}: {str(e)}")
                    continue
            
            log_step("Aucune zone texte", False, "Impossible de trouver input")
            return False
            
        except Exception as e:
            log_step("Erreur envoi", False, str(e))
            return False

    def _start_simple_monitoring(self, interview_id: str, page, config: Dict):
        """Surveillance simple sans envoi de messages (tout géré par JavaScript)"""
        
        def monitor_thread():
            try:
                print(f"👁️ Démarrage surveillance pour {interview_id}")
                
                start_time = time.time()
                max_duration = 1800  # 30 minutes max
                
                # Messages programmés pour information
                scheduled_messages = [
                    {'timing': 10, 'message': 'Introduction'},
                    {'timing': 75, 'message': 'Question 1: Parcours'},
                    {'timing': 315, 'message': 'Question 2: Réalisation'},
                    {'timing': 615, 'message': 'Question 3: Défis'},
                    {'timing': 915, 'message': 'Question 4: Motivations'}
                ]
                
                notified_messages = []
                
                while (time.time() - start_time < max_duration and 
                    interview_id in self.avatar_browsers and
                    self._is_browser_alive(interview_id)):
                    
                    elapsed = int(time.time() - start_time)
                    
                    # Notifier les messages envoyés (estimation basée sur le timing)
                    for msg in scheduled_messages:
                        if (elapsed >= msg['timing'] + 5 and  # +5s de marge
                            msg not in notified_messages):
                            
                            print(f"📝 Message JS programmé envoyé: {msg['message']}")
                            
                            # Notifier via WebSocket
                            self.socketio.emit('avatar_message', {
                                'interview_id': interview_id,
                                'message': msg['message'],
                                'type': 'question',
                                'timestamp': datetime.utcnow().isoformat(),
                                'source': 'javascript_timer',
                                'timing': msg['timing']
                            })
                            
                            notified_messages.append(msg)
                    
                    # Log périodique
                    if elapsed % 120 == 0 and elapsed > 0:
                        messages_sent = len(notified_messages)
                        print(f"🕐 Surveillance active {interview_id} - {elapsed}s écoulées - {messages_sent} messages envoyés")
                    
                    time.sleep(15)  # Check plus fréquent pour les notifications
                
                print(f"🔚 Fin surveillance {interview_id} - {len(notified_messages)} messages totaux")
                
            except Exception as e:
                print(f"❌ Erreur surveillance {interview_id}: {e}")
            finally:
                self._cleanup_playwright_avatar(interview_id)
        
        # Démarrer le thread de surveillance
        thread = threading.Thread(target=monitor_thread)
        thread.daemon = True
        thread.start()
    
    def _is_browser_alive(self, interview_id: str) -> bool:
        """Vérifie si le browser est encore vivant"""
        try:
            if interview_id not in self.avatar_browsers:
                return False
            
            browser = self.avatar_browsers[interview_id]
            # Test simple pour voir si le browser répond
            contexts = browser.contexts
            return len(contexts) > 0
            
        except Exception as e:
            print(f"⚠️ Browser {interview_id} semble mort: {e}")
            return False
        
    def _send_message_via_javascript(self, interview_id: str, message: str) -> bool:
        """Envoie un message via le système JavaScript (thread-safe)"""
        
        try:
            if interview_id not in self.avatar_pages:
                return False
            
            page = self.avatar_pages[interview_id]
            
            # Échapper le message pour JavaScript
            escaped_message = message.replace('"', '\\"').replace('\n', '\\n')
            
            # Appeler la fonction JavaScript injectée
            script = f'window.avatarSendMessage("{escaped_message}")'
            
            # ⚠️ ATTENTION : Exécuter depuis le même thread que la page
            result = page.evaluate(script)
            
            return bool(result)
            
        except Exception as e:
            print(f"❌ Erreur envoi JavaScript: {e}")
            return False
    
    def _handle_playwright_meet_join(self, page, interview_id: str, log_step):
        """Gère le processus de rejoindre Google Meet avec Playwright"""
        
        try:
            log_step("Recherche bouton Meet", True, "Analyse de l'interface Meet...")
            
            # Attendre que la page se charge
            page.wait_for_timeout(3000)
            
            # 🎯 STRATÉGIES PLAYWRIGHT POUR REJOINDRE MEET
            join_selectors = [
                # Boutons textuels
                'text="Rejoindre maintenant"',
                'text="Join now"',
                'text="Rejoindre"',
                'text="Join"',
                'text="Ask to join"',
                
                # Sélecteurs CSS
                '[data-promo-anchor-id="join-meeting"]',
                '[jsname*="join"]',
                '.uArJ5e',
                'button[aria-label*="join"]',
                'button[aria-label*="Join"]'
            ]
            
            joined = False
            for selector in join_selectors:
                try:
                    # Attendre l'élément avec timeout court
                    element = page.wait_for_selector(selector, timeout=5000)
                    if element and element.is_visible():
                        log_step("Bouton trouvé", True, f"Clic sur: {selector}")
                        element.click()
                        page.wait_for_timeout(3000)
                        joined = True
                        break
                except:
                    continue
            
            if not joined:
                log_step("Join alternatif", True, "Essai méthodes alternatives...")
                
                # Essayer de cliquer sur n'importe quel bouton contenant "join"
                try:
                    buttons = page.query_selector_all('button')
                    for button in buttons:
                        text = button.inner_text().lower()
                        if any(word in text for word in ['join', 'rejoindre', 'participer']):
                            log_step("Bouton alternatif", True, f"Clic alternatif: {text}")
                            button.click()
                            joined = True
                            break
                except:
                    pass
            
            # 🎤 CONFIGURATION MÉDIA
            if joined:
                try:
                    self._configure_playwright_media(page, log_step)
                except:
                    pass
            
            return joined
            
        except Exception as e:
            log_step("Erreur join Meet", False, f"Erreur: {str(e)}")
            return False
    
    def _configure_playwright_media(self, page, log_step):
        """Configure les paramètres média avec Playwright"""
        
        try:
            # Attendre un peu pour que l'interface se charge
            page.wait_for_timeout(2000)
            
            # Essayer de désactiver micro/caméra
            media_selectors = [
                '[data-tooltip*="microphone"]',
                '[data-tooltip*="camera"]',
                '[aria-label*="microphone"]',
                '[aria-label*="camera"]',
                'button[data-promo-anchor-id*="mic"]',
                'button[data-promo-anchor-id*="cam"]'
            ]
            
            for selector in media_selectors:
                try:
                    elements = page.query_selector_all(selector)
                    for element in elements:
                        if element.is_visible():
                            # Vérifier si activé et désactiver
                            aria_pressed = element.get_attribute('aria-pressed')
                            if aria_pressed == 'true':
                                element.click()
                                log_step("Média configuré", True, f"Désactivé: {selector}")
                                page.wait_for_timeout(500)
                except:
                    continue
                    
        except Exception as e:
            log_step("Configuration média", False, f"Erreur: {str(e)}")
    
    def _start_playwright_avatar_logic(self, interview_id: str, page, config: Dict):
        """Démarre la logique avatar avec Playwright dans un thread séparé"""
        
        def avatar_thread():
            try:
                print(f"🤖 Démarrage logique Playwright pour {interview_id}")
                
                time.sleep(10)  # Attendre que Meet se stabilise
                
                # Obtenir les questions selon le type de poste
                questions_data = self._get_questions_for_position(config.get('position', ''))
                
                # Message d'accueil
                intro_message = questions_data['introduction']
                self._send_playwright_chat_message(page, intro_message)
                
                # Initialiser le timer
                interview_start_time = datetime.utcnow()
                self.avatar_timers[interview_id] = {
                    'start_time': interview_start_time,
                    'questions': questions_data['questions'].copy(),
                    'asked_questions': []
                }
                
                # Logique principale
                while interview_id in self.active_avatars:
                    
                    # Vérifier si la réunion est active
                    if not self._is_playwright_meeting_active(page):
                        print(f"📞 Réunion terminée pour {interview_id}")
                        break
                    
                    # Gestion des questions
                    if self.simulation_mode:
                        self._handle_playwright_simulation_questions(interview_id, page, config)
                    else:
                        self._handle_playwright_ai_interaction(interview_id, page, config)
                    
                    time.sleep(30)
                
                # Nettoyer à la fin
                self._cleanup_playwright_avatar(interview_id)
                
            except Exception as e:
                print(f"❌ Erreur logique Playwright avatar {interview_id}: {e}")
                self._cleanup_playwright_avatar(interview_id)
        
        # Démarrer le thread
        avatar_thread_obj = threading.Thread(target=avatar_thread)
        avatar_thread_obj.daemon = True
        avatar_thread_obj.start()
    
    def _send_playwright_chat_message(self, page, message: str):
        """Envoie un message dans le chat Meet avec Playwright"""
        
        try:
            # Ouvrir le chat si nécessaire
            chat_selectors = [
                '[data-tooltip*="chat"]',
                '[aria-label*="chat"]',
                'button[data-panel-id="chat"]',
                'text="Chat"'
            ]
            
            chat_opened = False
            for selector in chat_selectors:
                try:
                    element = page.wait_for_selector(selector, timeout=3000)
                    if element and element.is_visible():
                        element.click()
                        page.wait_for_timeout(1000)
                        chat_opened = True
                        break
                except:
                    continue
            
            if not chat_opened:
                print("⚠️ Impossible d'ouvrir le chat")
                return
            
            # Trouver et remplir la zone de texte
            text_selectors = [
                'textarea[placeholder*="message"]',
                'textarea[aria-label*="message"]',
                '[role="textbox"]',
                '.DPvwYc textarea'
            ]
            
            for selector in text_selectors:
                try:
                    text_input = page.wait_for_selector(selector, timeout=3000)
                    if text_input and text_input.is_visible():
                        text_input.fill(message)
                        page.wait_for_timeout(500)
                        
                        # Envoyer avec Enter
                        text_input.press('Enter')
                        
                        print(f"💬 Message Playwright envoyé: {message[:50]}...")
                        return
                except:
                    continue
            
            print("⚠️ Zone de texte chat non trouvée")
            
        except Exception as e:
            print(f"❌ Erreur envoi message Playwright: {e}")
    
    def _get_questions_for_position(self, position: str):
        """Récupère les questions selon le type de poste"""
        
        if not position:
            return self.simulation_questions['default']
        
        position_lower = position.lower()
        
        position_mapping = {
            'développeur': ['développeur', 'dev', 'programmeur', 'ingénieur logiciel', 'frontend', 'backend', 'fullstack'],
            'commercial': ['commercial', 'vente', 'business', 'account manager', 'sales'],
            'default': []
        }
        
        for question_type, keywords in position_mapping.items():
            if any(keyword in position_lower for keyword in keywords):
                return self.simulation_questions.get(question_type, self.simulation_questions['default'])
        
        return self.simulation_questions['default']
    
    def _handle_playwright_simulation_questions(self, interview_id: str, page, config: Dict):
        """Gère les questions de simulation avec Playwright"""
        
        try:
            if interview_id not in self.avatar_timers:
                return
            
            timer_data = self.avatar_timers[interview_id]
            start_time = timer_data['start_time']
            current_time = datetime.utcnow()
            elapsed_seconds = (current_time - start_time).total_seconds()
            
            questions_to_ask = []
            for question in timer_data['questions']:
                if (elapsed_seconds >= question['timing'] and 
                    question not in timer_data['asked_questions']):
                    questions_to_ask.append(question)
            
            for question in questions_to_ask:
                self._send_playwright_chat_message(page, question['question'])
                timer_data['asked_questions'].append(question)
                
                print(f"💬 Question posée ({interview_id}): {question['question'][:50]}...")
                
                self.socketio.emit('avatar_question_asked', {
                    'interview_id': interview_id,
                    'question': question['question'],
                    'timing': question['timing'],
                    'timestamp': current_time.isoformat(),
                    'browser': 'chrome_playwright'
                })
                
                time.sleep(2)
            
            # Message de conclusion
            if 1500 <= elapsed_seconds < 1530 and not any('conclusion' in q.get('type', '') for q in timer_data['asked_questions']):
                conclusion_message = "Merci pour vos réponses. Avez-vous des questions sur le poste ou l'entreprise ?"
                self._send_playwright_chat_message(page, conclusion_message)
                timer_data['asked_questions'].append({'type': 'conclusion', 'question': conclusion_message})
            
        except Exception as e:
            print(f"❌ Erreur gestion questions Playwright: {e}")
    
    def _handle_playwright_ai_interaction(self, interview_id: str, page, config: Dict):
        """Gère les interactions IA avec Playwright"""
        
        try:
            # Logique IA avancée à implémenter
            current_time = datetime.utcnow()
            if interview_id in self.active_avatars:
                avatar_data = self.active_avatars[interview_id]
                start_time = datetime.fromisoformat(avatar_data['started_at'].replace('Z', '+00:00'))
                minutes_elapsed = (current_time - start_time).total_seconds() / 60
                
                if 9 < minutes_elapsed < 11:
                    follow_up = "Pouvez-vous nous donner un exemple concret de votre expérience ?"
                    self._send_playwright_chat_message(page, follow_up)
            
        except Exception as e:
            print(f"❌ Erreur interaction IA Playwright: {e}")
    
    def _is_playwright_meeting_active(self, page) -> bool:
        """Vérifie si la réunion Meet est active avec Playwright"""
        
        try:
            current_url = page.url
            return 'meet.google.com' in current_url and '/lookup/' not in current_url
        except:
            return False
    
    def _cleanup_playwright_avatar(self, interview_id: str):
        """Nettoie les ressources Playwright d'un avatar"""
        
        try:
            # Fermer le browser
            if interview_id in self.avatar_browsers:
                browser = self.avatar_browsers[interview_id]
                try:
                    # Fermer de manière synchrone
                    browser.close()
                except:
                    pass
                del self.avatar_browsers[interview_id]
            
            # Nettoyer les pages
            if interview_id in self.avatar_pages:
                del self.avatar_pages[interview_id]
            
            # Nettoyer les timers
            if interview_id in self.avatar_timers:
                del self.avatar_timers[interview_id]
            
            # Supprimer des avatars actifs
            if interview_id in self.active_avatars:
                del self.active_avatars[interview_id]
            
            # Mettre à jour la BDD
            self._update_interview_ai_status(interview_id, False)
            
            # Notifier la fin
            self.socketio.emit('avatar_ended', {
                'interview_id': interview_id,
                'timestamp': datetime.utcnow().isoformat(),
                'browser': 'chrome_playwright'
            })
            
            print(f"🧹 Avatar Playwright nettoyé pour {interview_id}")
            
        except Exception as e:
            print(f"❌ Erreur nettoyage avatar Playwright: {e}")
    
    def _update_interview_ai_status(self, interview_id: str, active: bool):
        """Met à jour le statut IA dans la base de données"""
        
        try:
            from ..models.interview_scheduling import InterviewSchedule
            from app import db

            interview = InterviewSchedule.query.filter_by(id = interview_id).first()
            print(interview,'ppp')
            if not interview:
                abort(403, description="Offre d'emploi non trouvée ou accès non autorisé")

            if interview:
                interview.ai_session_active = active
                db.session.commit()
                print(f"✅ Statut IA mis à jour pour {interview_id}: {active}")
            
        except Exception as e:
            print(f"❌ Erreur mise à jour BDD: {e}")
    
    def _check_active_avatars(self):
        """Vérifie le statut des avatars actifs"""
        
        inactive_avatars = []
        
        for interview_id, avatar_data in self.active_avatars.items():
            if interview_id in self.avatar_pages:
                page = self.avatar_pages[interview_id]
                if not self._is_playwright_meeting_active(page):
                    inactive_avatars.append(interview_id)
        
        for interview_id in inactive_avatars:
            self._cleanup_playwright_avatar(interview_id)
    
    def get_avatar_status(self, interview_id: str) -> Dict:
        """Récupère le statut détaillé d'un avatar"""
        
        if interview_id in self.active_avatars:
            avatar_data = self.active_avatars[interview_id]
            is_meeting_active = False
            
            if interview_id in self.avatar_pages:
                is_meeting_active = self._is_playwright_meeting_active(self.avatar_pages[interview_id])
            
            questions_info = {}
            if interview_id in self.avatar_timers:
                timer_data = self.avatar_timers[interview_id]
                questions_info = {
                    'total_questions': len(timer_data['questions']),
                    'asked_questions': len(timer_data['asked_questions']),
                    'next_question_in': self._get_next_question_timing(interview_id)
                }
            
            return {
                'status': 'active',
                'mode': 'simulation' if self.simulation_mode else 'ai',
                'browser': 'chrome_playwright',
                'system': self.system,
                'data': avatar_data,
                'meeting_active': is_meeting_active,
                'browser_running': interview_id in self.avatar_browsers,
                'questions_info': questions_info
            }
        elif interview_id in self.scheduled_launches:
            return {
                'status': self.scheduled_launches[interview_id]['status'],
                'mode': 'simulation' if self.simulation_mode else 'ai',
                'browser': 'chrome_playwright',
                'system': self.system,
                'launch_time': self.scheduled_launches[interview_id]['launch_time'].isoformat()
            }
        else:
            return {'status': 'not_found'}
    
    def _get_next_question_timing(self, interview_id: str) -> Optional[int]:
        """Calcule le temps avant la prochaine question"""
        
        if interview_id not in self.avatar_timers:
            return None
        
        timer_data = self.avatar_timers[interview_id]
        start_time = timer_data['start_time']
        current_time = datetime.utcnow()
        elapsed_seconds = (current_time - start_time).total_seconds()
        
        for question in timer_data['questions']:
            if question not in timer_data['asked_questions']:
                remaining_time = question['timing'] - elapsed_seconds
                if remaining_time > 0:
                    return int(remaining_time)
        
        return None
    
    def get_service_info(self) -> Dict:
        """Récupère les informations détaillées du service"""
        
        return {
            'service_running': self.running,
            'mode': 'simulation' if self.simulation_mode else 'ai',
            'browser': 'chrome_playwright',
            'system': self.system,
            'ai_api_available': bool(self.ai_api_key),
            'active_count': len(self.active_avatars),
            'scheduled_count': len(self.scheduled_launches),
            'browser_sessions': len(self.avatar_browsers),
            'advantages': [
                'Chrome plus stable que Firefox',
                'Playwright plus moderne que Selenium',
                'Compatible Linux & Windows',
                'Gestion native des timeouts',
                'Performance optimisée'
            ]
        }
    
    def _authenticate_bot_with_google(self, page, log_step):
        """🔑 VERSION ROBUSTE de l'authentification Google"""
        
        BOT_EMAIL = "tia42164@gmail.com"
        BOT_PASSWORD = "Azerty@1245Uy"
        
        try:
            log_step("Auth Bot Google", True, f"Connexion robuste avec {BOT_EMAIL}...")
            
            # ✅ CORRECTION: Timeout plus long pour éviter l'erreur
            page.goto('https://accounts.google.com/signin', 
                     wait_until='domcontentloaded', 
                     timeout=60000)  # 60 secondes au lieu de 30
            page.wait_for_timeout(2000)
            
            # Email avec plusieurs tentatives
            email_selectors = [
                'input[type="email"]',
                '#identifierId',
                'input[name="identifier"]'
            ]
            
            email_filled = False
            for selector in email_selectors:
                try:
                    if page.is_visible(selector, timeout=3000):
                        page.click(selector)
                        page.keyboard.press('Control+a')  # Sélectionner tout
                        page.keyboard.type(BOT_EMAIL, delay=50)
                        email_filled = True
                        break
                except:
                    continue
                
            if not email_filled:
                raise Exception("Impossible de remplir l'email")
            
            # Cliquer suivant avec vérification
            next_clicked = False
            next_selectors = ['#identifierNext', 'button:has-text("Next")', 'button:has-text("Suivant")']
            for selector in next_selectors:
                try:
                    if page.is_visible(selector, timeout=3000):
                        page.click(selector)
                        next_clicked = True
                        log_step("Email Next", True, f"Cliqué sur suivant avec {selector}")
                        break
                except:
                    continue
                
            if not next_clicked:
                # Essayer avec Enter
                try:
                    page.keyboard.press('Enter')
                    next_clicked = True
                    log_step("Email Next", True, "Utilisé Enter pour continuer")
                except:
                    raise Exception("Impossible de cliquer sur suivant après email")
            
            # Attendre plus longtemps la page de mot de passe
            page.wait_for_timeout(5000)
            
            # Vérifier que la page de mot de passe est chargée
            try:
                page.wait_for_selector('input[type="password"]', timeout=15000)
                log_step("Password Page", True, "Page mot de passe détectée")
            except:
                log_step("Password Page", False, "Page mot de passe non trouvée")
                # Debug: capturer l'état actuel
                current_url = page.url
                log_step("Debug URL", True, f"URL actuelle: {current_url}")
                
                # Essayer d'attendre un peu plus
                page.wait_for_timeout(5000)
            
            # Mot de passe avec sélecteurs étendus
            password_selectors = [
                'input[type="password"]',
                '#password input[type="password"]',
                'input[name="password"]',
                'input[autocomplete="current-password"]',
                '[data-initial-value] input[type="password"]'
            ]
            
            password_filled = False
            for i, selector in enumerate(password_selectors):
                try:
                    log_step(f"Password Try {i+1}", True, f"Tentative avec: {selector}")
                    if page.is_visible(selector, timeout=8000):
                        page.click(selector)
                        page.wait_for_timeout(500)
                        page.keyboard.press('Control+a')
                        page.keyboard.type(BOT_PASSWORD, delay=100)
                        password_filled = True
                        log_step("Password Fill", True, f"✅ Mot de passe saisi avec {selector}")
                        break
                    else:
                        log_step(f"Password Try {i+1}", False, f"Sélecteur invisible: {selector}")
                except Exception as e:
                    log_step(f"Password Try {i+1}", False, f"Erreur avec {selector}: {e}")
                    continue
                
            if not password_filled:
                # Debug final avant d'échouer
                try:
                    all_inputs = page.query_selector_all('input')
                    log_step("Debug Inputs", True, f"Nombre total d'inputs: {len(all_inputs)}")
                    for i, inp in enumerate(all_inputs):
                        try:
                            inp_type = inp.get_attribute('type')
                            inp_name = inp.get_attribute('name')
                            inp_id = inp.get_attribute('id')
                            log_step(f"Input {i}", True, f"Type: {inp_type}, Name: {inp_name}, ID: {inp_id}")
                        except:
                            pass
                except:
                    pass
                
                raise Exception("Impossible de remplir le mot de passe - Aucun sélecteur trouvé")
            
            # Cliquer suivant
            password_next_selectors = ['#passwordNext', 'button:has-text("Next")', 'button:has-text("Suivant")']
            for selector in password_next_selectors:
                try:
                    if page.is_visible(selector, timeout=3000):
                        page.click(selector)
                        break
                except:
                    continue
                
            # Attendre et vérifier
            page.wait_for_timeout(5000)
            
            # ✅ CORRECTION: Timeout plus long pour networkidle
            try:
                page.wait_for_load_state('networkidle', timeout=30000)  # 30 secondes au lieu de 15
            except:
                # Si networkidle timeout, continuer quand même
                log_step("Network Idle", False, "Timeout networkidle, mais on continue...")
                page.wait_for_timeout(3000)
            
            current_url = page.url
            
            if 'myaccount.google.com' in current_url or ('google.com' in current_url and 'signin' not in current_url):
                log_step("Auth Bot", True, f"✅ Authentification réussie")
                cookies = page.context.cookies()
                self._save_bot_cookies(cookies)
                return True
            else:
                log_step("Auth Bot", False, f"❌ Échec - URL: {current_url}")
                return False
        
        except Exception as e:
            log_step("Erreur Auth Bot", False, f"Erreur: {str(e)}")
            return False
    
    def _save_bot_cookies(self, cookies):
        """💾 SAUVEGARDE LES COOKIES DU BOT POUR RÉUTILISATION"""
        
        try:
            import json
            cookie_file = '/tmp/bot_google_cookies.json'
            
            # Convertir les cookies en format sérialisable
            cookie_data = []
            for cookie in cookies:
                cookie_data.append({
                    'name': cookie['name'],
                    'value': cookie['value'], 
                    'domain': cookie['domain'],
                    'path': cookie['path'],
                    'secure': cookie.get('secure', False),
                    'httpOnly': cookie.get('httpOnly', False),
                    'expires': cookie.get('expires', -1)
                })
            
            with open(cookie_file, 'w') as f:
                json.dump(cookie_data, f)
            
            print(f"✅ Cookies sauvegardés: {len(cookie_data)} cookies")
            
        except Exception as e:
            print(f"⚠️ Erreur sauvegarde cookies: {e}")

    def _load_bot_cookies(self, context):
        """📖 CHARGE LES COOKIES SAUVEGARDÉS DU BOT"""
        
        try:
            import json
            cookie_file = '/tmp/bot_google_cookies.json'
            
            if not os.path.exists(cookie_file):
                return False
            
            with open(cookie_file, 'r') as f:
                cookie_data = json.load(f)
            
            # Ajouter les cookies au contexte
            context.add_cookies(cookie_data)
            
            print(f"✅ Cookies chargés: {len(cookie_data)} cookies")
            return True
            
        except Exception as e:
            print(f"⚠️ Erreur chargement cookies: {e}")
            return False

    # 3. LANCEMENT AVATAR AVEC IDENTITÉ BOT
    def _launch_avatar_with_bot_identity(self, interview_id, interview_data):
        """🤖 LANCE L'AVATAR AVEC L'IDENTITÉ GOOGLE DU BOT"""
        
        def log_step(step, success, message):
            status = "✅" if success else "❌"
            print(f"{status} {step}: {message}")
        
        try:
            from playwright.sync_api import sync_playwright
            
            log_step("Initialisation Bot", True, "Démarrage avec identité Google...")
            
            # Configuration Chrome avec persistance
            p = sync_playwright().start()
            print('........................kkdkd.')
            
            
            user_data_dir = f'/home/{os.getenv("USER", "user")}/chrome_bot_persistent'
            os.makedirs(user_data_dir, exist_ok=True)
        
            # ⚠️ CORRECTION: launch_persistent_context retourne directement un BrowserContext
            context = p.chromium.launch_persistent_context(
                user_data_dir=user_data_dir,  # Data persistence directory
                headless=False,  # Visible for debug
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled', 
                    '--exclude-switches=enable-automation',
                    '--disable-web-security',
                    '--window-size=1920,1080',
                    '--start-maximized'
                ]
            )
            print('........................kkdkd.')
            
            
                # Créer une page directement depuis le context persistant
            page = context.new_page()
            page.add_init_script("""
                // Supprimer toutes traces d'automation
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                
                // Simuler extensions navigateur
                Object.defineProperty(navigator, 'mimeTypes', { get: () => [1, 2, 3, 4] });
                
                // Masquer Playwright
                delete window.__playwright;
                delete window.__pw_manual;
                delete window.__PW_inspect;
                
                // Simuler interaction souris
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => {
                        document.dispatchEvent(new MouseEvent('mousemove', {
                            clientX: Math.random() * window.innerWidth,
                            clientY: Math.random() * window.innerHeight
                        }));
                    }, 1000);
                });
            """)
            
            
            
            # Charger les cookies existants
            cookies_loaded = self._load_bot_cookies(context)
            
            if not cookies_loaded:
                log_step("Première Auth", True, "Première authentification du bot...")
                auth_success = self._authenticate_bot_with_google(page, log_step)
                
                if not auth_success:    
                    raise Exception("Échec authentification Google du bot")
            else:
                log_step("Cookies Bot", True, "Cookies existants chargés")
            
            # Stocker les références
            self.sessions[interview_id] = {
                'playwright': p,
                'browser': None,  # ⚠️ Pas de browser avec persistent context
                'context': context, 
                'page': page,
                'status': 'authenticated',
                'bot_identity': True
            }
            
            # Maintenant aller sur Meet avec l'identité du bot
            return self._join_meet_as_authenticated_bot(interview_id, interview_data, page, log_step)
        except Exception as e:
            log_step("Erreur Bot Identity", False, str(e))
            # ⚠️ Cleanup en cas d'erreur
            if 'context' in locals():
                try:
                    context.close()
                except:
                    pass
            if 'p' in locals():
                try:
                    p.stop()
                except:
                    pass
            raise
    
    def _cleanup_session(self, interview_id):
        """Nettoie proprement une session"""
        if interview_id in self.sessions:
            session = self.sessions[interview_id]
            
            try:
                # Fermer la page
                if 'page' in session and session['page']:
                    session['page'].close()
                    
                # Fermer le context (qui ferme aussi le browser en mode persistent)
                if 'context' in session and session['context']:
                    session['context'].close()
                    
                # Arrêter playwright
                if 'playwright' in session and session['playwright']:
                    session['playwright'].stop()
                    
            except Exception as e:
                print(f"❌ Erreur cleanup: {e}")
            
            # Supprimer de la liste des sessions
            del self.sessions[interview_id]
            
    def _join_meet_as_authenticated_bot(self, interview_id, interview_data, page, log_step):
        """🎯 REJOINT MEET EN TANT QUE BOT AUTHENTIFIÉ"""
        
        meet_link = interview_data.get('meet_link', '')
        
        try:
            log_step("Navigation Meet Bot", True, f"Accès Meet en tant que bot...")
            
            # Aller sur Meet avec l'identité
            page.goto(meet_link, wait_until='domcontentloaded')
            page.wait_for_timeout(5000)
            print(f"🔗 URL actuelle après navigation: {page.url}")
            
            
            # Le bot devrait maintenant être reconnu comme un utilisateur Google
            current_url = page.url
            page_content = page.content()
            
            log_step("Meet Chargé Bot", True, f"URL: {current_url}")
            
            # Vérifier qu'on n'a plus l'erreur "can't join"
            if "can't join this video call" in page_content.lower():
                log_step("Erreur Persistante", False, "Le bot n'est toujours pas reconnu")
                return {'success': False, 'error': 'Bot pas reconnu par Meet'}
            
            # Chercher les boutons de participation
            join_selectors = [
                'button:has-text("Join now")',
                'button:has-text("Participer")', 
                'button:has-text("Rejoindre")',
                '[aria-label*="join" i]',
                '[data-tooltip*="join" i]'
            ]
            
            for selector in join_selectors:
                try:
                    join_btn = page.query_selector(selector)
                    if join_btn and join_btn.is_visible():
                        log_step("Join Button", True, f"Bouton trouvé: {selector}")
                        join_btn.click()
                        page.wait_for_timeout(3000)
                        break
                except:
                    continue
            
            # Désactiver micro/caméra pour éviter les popups de permission
            try:
                mic_btn = page.query_selector('[aria-label*="microphone" i], [data-tooltip*="mic" i]')
                if mic_btn:
                    mic_btn.click()
                    log_step("Micro Off", True, "Micro désactivé")
                    
                cam_btn = page.query_selector('[aria-label*="camera" i], [data-tooltip*="cam" i]')  
                if cam_btn:
                    cam_btn.click()
                    log_step("Camera Off", True, "Caméra désactivée")
                    
            except:
                pass
            
            # Démarrer la surveillance
            log_step("Attente stabilisation", True, "Meet se stabilise...")
            page.wait_for_timeout(8000)  # Plus long délai

            # Vérifier que les contrôles Meet sont présents
            try:
                page.wait_for_selector('[data-tooltip*="microphone" i], [aria-label*="microphone" i]', timeout=10000)
                log_step("Meet Ready", True, "✅ Contrôles Meet détectés")
            except:
                log_step("Meet Ready", False, "⚠️ Contrôles Meet non détectés, on continue...")

            # 🔧 CORRECTION 2: Ajouter aux avatars actifs AVANT monitoring
            self.active_avatars[interview_id] = {
                'config': {
                    'interview_id': interview_id,
                    'meet_link': meet_link,
                    'status': 'authenticated_active',
                    'position': interview_data.get('position', ''),
                    'candidate_name': interview_data.get('candidate_name', '')
                },
                'started_at': datetime.utcnow().isoformat(),
                'browser': 'chrome_persistent',
                'system': self.system,
                'status': 'running_with_questions'
            }

            # 🔧 CORRECTION 3: Maintenant injecter le système (Meet est stable)
            log_step("Injection système", True, "Démarrage système questions...")
            self._start_javascript_monitoring(interview_id, page, log_step)

            log_step("Bot Ready", True, "🤖 Bot authentifié prêt dans Meet!")

            return {
                'success': True,
                'bot_authenticated': True,
                'meet_status': 'joined_as_user',
                'interview_id': interview_id,
                'questions_system': 'active'
            }

        except Exception as e:
            log_step("Erreur Join Bot", False, str(e))
            return {'success': False, 'error': str(e)}


    # # 4. MÉTHODE PRINCIPALE MISE À JOUR
    # def force_avatar_launch(self, interview_id, interview_data):
    #     """🚀 LANCE L'AVATAR AVEC IDENTITÉ BOT"""
        
    #     try:
    #         return self._launch_avatar_with_bot_identity(interview_id, interview_data)
    #     except Exception as e:
    #         print(f"❌ Erreur lancement bot: {e}")
    #         return {'success': False, 'error': str(e)}
    
    def get_avatar_launch_logs(self, interview_id: str) -> Dict:
        """Récupère les logs détaillés de lancement"""
        
        if interview_id in self.launch_logs:
            return {
                'success': True,
                'logs': self.launch_logs[interview_id]
            }
        else:
            return {
                'success': False,
                'error': 'Aucun log de lancement trouvé'
            }

    def _start_playwright_avatar_logic_safe(self, interview_id: str, page, config: Dict):
        """Version avec envoi Meet réel"""
        
        def safe_avatar_thread():
            try:
                print(f"🤖 Démarrage logique MEET CHAT pour {interview_id}")
                
                # Questions avec timing
                questions = [
                    {'timing': 10, 'message': "Bonjour ! Je suis votre assistant IA pour cet entretien."},
                    {'timing': 70, 'message': "Pouvez-vous nous présenter votre parcours professionnel ?"},
                    {'timing': 310, 'message': "Décrivez-nous une réalisation dont vous êtes particulièrement fier."},
                    {'timing': 610, 'message': "Comment gérez-vous les défis au travail ?"},
                    {'timing': 910, 'message': "Quelles sont vos motivations pour rejoindre notre entreprise ?"}
                ]
                
                # Programmer les messages via le gestionnaire
                for question in questions:
                    self.meet_chat_manager.send_message(
                        interview_id, 
                        question['message'], 
                        delay=question['timing']
                    )
                    print(f"📝 Message programmé pour T+{question['timing']}s: {question['message'][:50]}...")
                
                # Maintenir la session
                start_time = time.time()
                while interview_id in self.active_avatars:
                    elapsed = int(time.time() - start_time)
                    
                    # Log périodique
                    if elapsed % 120 == 0:  # Toutes les 2 minutes
                        print(f"🕐 Session active {interview_id} - {elapsed}s écoulées")
                    
                    time.sleep(30)
                
                print(f"🔚 Fin session {interview_id}")
                
            except Exception as e:
                print(f"❌ Erreur logique Meet chat {interview_id}: {e}")
            finally:
                self._cleanup_playwright_avatar(interview_id)
    
        # Démarrer le thread
        thread = threading.Thread(target=safe_avatar_thread)
        thread.daemon = True
        thread.start()
    
    def _send_message_to_meet_chat(self, page, message: str):
        """Envoie un message dans le chat Google Meet"""

        try:
            print(f"💬 Tentative envoi dans chat Meet: {message[:50]}...")

            # 🔍 ÉTAPE 1 : Ouvrir le chat Meet
            chat_selectors = [
                '[aria-label*="chat" i]',
                '[data-tooltip*="chat" i]', 
                'button[data-panel-id="chat"]',
                '[jsname*="chat" i]',
                'text="Chat"',
                'text="Discuter"'
            ]

            chat_opened = False
            for selector in chat_selectors:
                try:
                    chat_button = page.wait_for_selector(selector, timeout=3000)
                    if chat_button and chat_button.is_visible():
                        chat_button.click()
                        page.wait_for_timeout(1000)
                        print(f"✅ Chat ouvert avec: {selector}")
                        chat_opened = True
                        break
                except:
                    continue
                
            if not chat_opened:
                print("⚠️ Impossible d'ouvrir le chat - essai direct")
                # Essayer d'appuyer sur 'Ctrl+Alt+C' (raccourci chat Meet)
                page.keyboard.press('Control+Alt+c')
                page.wait_for_timeout(1000)

            # 🔍 ÉTAPE 2 : Trouver la zone de saisie
            text_selectors = [
                'textarea[placeholder*="message" i]',
                'textarea[aria-label*="message" i]',
                'textarea[placeholder*="Envoyer" i]',
                '[role="textbox"]',
                'input[placeholder*="message" i]',
                '.DPvwYc textarea',
                '[jsname*="message" i] textarea'
            ]

            message_sent = False
            for selector in text_selectors:
                try:
                    text_input = page.wait_for_selector(selector, timeout=3000)
                    if text_input and text_input.is_visible():
                        # Cliquer pour focus
                        text_input.click()
                        page.wait_for_timeout(500)

                        # Effacer et taper le message
                        text_input.fill('')
                        text_input.type(message)
                        page.wait_for_timeout(500)

                        # Envoyer avec Enter
                        text_input.press('Enter')

                        print(f"✅ Message envoyé dans Meet: {message[:30]}...")
                        message_sent = True
                        break
                except:
                    continue
                
            if not message_sent:
                print("⚠️ Zone de texte non trouvée - essai clavier direct")
                # Dernier recours : taper directement 
                page.keyboard.type(message)
                page.keyboard.press('Enter')

            return True

        except Exception as e:
            print(f"❌ Erreur envoi chat Meet: {e}")
            return False

    def debug_avatar_javascript(self, interview_id: str) -> Dict:
        """Debug en temps réel du système JavaScript dans Meet"""
        
        try:
            if interview_id not in self.avatar_pages:
                return {'success': False, 'error': 'Page non trouvée'}
            
            page = self.avatar_pages[interview_id]
            
            # Script de debug complet
            debug_script = """
            () => {
                const debug = {
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    avatarSystem: !!window.avatarChatSystem,
                    chatElements: [],
                    textElements: [],
                    errors: [],
                    attempts: []
                };
                
                try {
                    // Vérifier le système avatar
                    if (window.avatarChatSystem) {
                        debug.avatarSystemData = {
                            isReady: window.avatarChatSystem.isReady,
                            messages: window.avatarChatSystem.messages,
                            timersCount: window.avatarChatSystem.timers.length
                        };
                    }
                    
                    // Chercher les éléments de chat
                    const chatSelectors = [
                        '[aria-label*="chat" i]',
                        '[data-tooltip*="chat" i]',
                        'button[data-panel-id="chat"]',
                        '[aria-label*="Afficher le chat" i]',
                        '[aria-label*="Show chat" i]',
                        '[jsname*="chat" i]'
                    ];
                    
                    chatSelectors.forEach(selector => {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(el => {
                            debug.chatElements.push({
                                selector: selector,
                                visible: el.offsetParent !== null,
                                text: el.textContent?.slice(0, 50),
                                ariaLabel: el.getAttribute('aria-label'),
                                dataTooltip: el.getAttribute('data-tooltip')
                            });
                        });
                    });
                    
                    // Chercher les zones de texte
                    const textSelectors = [
                        'textarea[placeholder*="message" i]',
                        'textarea[aria-label*="message" i]',
                        'textarea[placeholder*="Saisissez" i]',
                        'textarea[placeholder*="Send" i]',
                        '[contenteditable="true"]',
                        'div[role="textbox"]',
                        '.DPvwYc textarea',
                        'textarea'
                    ];
                    
                    textSelectors.forEach(selector => {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(el => {
                            debug.textElements.push({
                                selector: selector,
                                visible: el.offsetParent !== null,
                                placeholder: el.placeholder,
                                ariaLabel: el.getAttribute('aria-label'),
                                tagName: el.tagName
                            });
                        });
                    });
                    
                    // Test d'envoi de message en direct
                    debug.attempts.push("Tentative envoi message test...");
                    
                    const testMessage = "🤖 Test debug " + Date.now();
                    
                    // Essayer d'ouvrir le chat
                    const chatButton = document.querySelector('[aria-label*="chat" i], [data-tooltip*="chat" i]');
                    if (chatButton && chatButton.offsetParent !== null) {
                        debug.attempts.push("Clic bouton chat trouvé");
                        chatButton.click();
                        
                        // Attendre et chercher zone texte
                        setTimeout(() => {
                            const textArea = document.querySelector('textarea[placeholder*="message" i], textarea[aria-label*="message" i]');
                            if (textArea && textArea.offsetParent !== null) {
                                debug.attempts.push("Zone texte trouvée après ouverture chat");
                                textArea.focus();
                                textArea.value = testMessage;
                                
                                // Déclencher événements
                                textArea.dispatchEvent(new Event('input', { bubbles: true }));
                                textArea.dispatchEvent(new KeyboardEvent('keydown', {
                                    key: 'Enter', keyCode: 13, bubbles: true
                                }));
                                
                                debug.attempts.push("Message test envoyé: " + testMessage);
                            } else {
                                debug.attempts.push("Zone texte non trouvée après ouverture chat");
                            }
                        }, 1000);
                    } else {
                        debug.attempts.push("Bouton chat non trouvé");
                    }
                    
                    // Récupérer les logs de la console
                    debug.consoleVisible = !!window.console;
                    
                } catch (error) {
                    debug.errors.push(error.toString());
                }
                
                return debug;
            }
            """
            
            # Exécuter le debug (pas de cross-thread car depuis le thread principal)
            result = page.evaluate(debug_script)
            
            return {
                'success': True,
                'debug_data': result
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def test_manual_message_send(self, interview_id: str, test_message: str = "🤖 Test manuel") -> Dict:
        """Test manuel d'envoi de message"""
        
        try:
            if interview_id not in self.avatar_pages:
                return {'success': False, 'error': 'Page non trouvée'}
            
            page = self.avatar_pages[interview_id]
            
            # Script de test manuel simplifié
            test_script = f"""
            async () => {{
                const log = [];
                const testMessage = "{test_message} " + Date.now();
                
                try {{
                    log.push("Début test manuel");
                    
                    // Étape 1: Ouvrir chat
                    const chatSelectors = [
                        '[aria-label*="chat" i]',
                        '[data-tooltip*="chat" i]', 
                        'button[data-panel-id="chat"]'
                    ];
                    
                    let chatOpened = false;
                    for (const selector of chatSelectors) {{
                        const btn = document.querySelector(selector);
                        if (btn && btn.offsetParent !== null) {{
                            log.push(`Chat bouton trouvé: ${{selector}}`);
                            btn.click();
                            await new Promise(r => setTimeout(r, 2000));
                            chatOpened = true;
                            break;
                        }}
                    }}
                    
                    if (!chatOpened) {{
                        log.push("ÉCHEC: Aucun bouton chat trouvé");
                        return {{ success: false, log }};
                    }}
                    
                    // Étape 2: Trouver zone texte
                    const textSelectors = [
                        'textarea[placeholder*="message" i]',
                        'textarea[aria-label*="message" i]',
                        '[contenteditable="true"]',
                        'div[role="textbox"]'
                    ];
                    
                    let messageArea = null;
                    for (const selector of textSelectors) {{
                        const area = document.querySelector(selector);
                        if (area && area.offsetParent !== null) {{
                            log.push(`Zone texte trouvée: ${{selector}}`);
                            messageArea = area;
                            break;
                        }}
                    }}
                    
                    if (!messageArea) {{
                        log.push("ÉCHEC: Aucune zone texte trouvée");
                        log.push("Éléments disponibles:");
                        document.querySelectorAll('textarea, [contenteditable], [role=textbox]').forEach((el, i) => {{
                            log.push(`  ${{i}}: ${{el.tagName}} - visible: ${{el.offsetParent !== null}} - placeholder: "${{el.placeholder || 'N/A'}}"`);
                        }});
                        return {{ success: false, log }};
                    }}
                    
                    // Étape 3: Saisir message
                    log.push("Saisie du message...");
                    messageArea.focus();
                    await new Promise(r => setTimeout(r, 500));
                    
                    // Vider et remplir
                    messageArea.value = '';
                    messageArea.textContent = '';
                    messageArea.value = testMessage;
                    messageArea.textContent = testMessage;
                    
                    // Événements
                    messageArea.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    messageArea.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    
                    await new Promise(r => setTimeout(r, 500));
                    
                    // Étape 4: Envoyer
                    log.push("Envoi du message...");
                    messageArea.dispatchEvent(new KeyboardEvent('keydown', {{
                        key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
                    }}));
                    
                    // Chercher aussi bouton send
                    const sendButton = document.querySelector('[aria-label*="Send" i], [aria-label*="Envoyer" i]');
                    if (sendButton) {{
                        log.push("Clic bouton Send aussi");
                        sendButton.click();
                    }}
                    
                    log.push(`Message envoyé: ${{testMessage}}`);
                    return {{ success: true, log, message: testMessage }};
                    
                }} catch (error) {{
                    log.push(`ERREUR: ${{error.toString()}}`);
                    return {{ success: false, log, error: error.toString() }};
                }}
            }}
            """
            
            # Exécuter le test
            result = page.evaluate(test_script)
            
            return {
                'success': True,
                'test_result': result
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _start_javascript_monitoring(self, interview_id, page, log_step):

        """🚀 Monitoring JavaScript COMPLET avec envoi automatique des questions"""
        try:
            log_step("JS Monitor", True, "Activation système questions automatiques...")

            # 🎯 SCRIPT COMPLET AVEC QUESTIONS AUTOMATIQUES
            javascript_system = f"""
            // ==========================================
            // 🤖 SYSTÈME AVATAR AVEC QUESTIONS AUTO
            // ==========================================

            console.log('🤖 Démarrage système Avatar IA...');

            window.avatarChatSystem = {{
                isReady: false,
                messages: [],
                timers: [],
                startTime: Date.now(),
                interview_id: '{interview_id}',

                // 📝 QUESTIONS PROGRAMMÉES
                questions: [
                    {{
                        timing: 10000,  // 10 secondes
                        message: "Bonjour ! Je suis votre assistant IA pour cet entretien. Nous allons explorer votre parcours professionnel.",
                        sent: false
                    }},
                    {{
                        timing: 70000,  // 1 min 10s
                        message: "Pouvez-vous nous présenter votre parcours professionnel et vos principales compétences ?",
                        sent: false
                    }},
                    {{
                        timing: 310000, // 5 min 10s
                        message: "Décrivez-nous une réalisation professionnelle dont vous êtes particulièrement fier.",
                        sent: false
                    }},
                    {{
                        timing: 610000, // 10 min 10s
                        message: "Comment gérez-vous les défis et les situations difficiles au travail ?",
                        sent: false
                    }},
                    {{
                        timing: 910000, // 15 min 10s
                        message: "Quelles sont vos motivations pour rejoindre notre entreprise et ce poste ?",
                        sent: false
                    }},
                    {{
                        timing: 1210000, // 20 min 10s
                        message: "Merci pour vos réponses ! Avez-vous des questions sur le poste ou notre entreprise ?",
                        sent: false
                    }}
                ],

                // 🔍 FONCTION DE RECHERCHE D'ÉLÉMENTS CHAT
                findChatElements: function() {{
                    console.log('🔍 Recherche éléments chat...');

                    // Boutons pour ouvrir le chat
                    const chatButtons = [
                        document.querySelector('[aria-label*="chat" i]'),
                        document.querySelector('[data-tooltip*="chat" i]'),
                        document.querySelector('button[data-panel-id="chat"]'),
                        document.querySelector('[aria-label*="Show chat" i]'),
                        document.querySelector('[aria-label*="Afficher le chat" i]'),
                        document.querySelector('[jsname*="chat" i]')
                    ].filter(el => el && el.offsetParent !== null);

                    // Zones de texte pour écrire
                    const textAreas = [
                        document.querySelector('textarea[placeholder*="message" i]'),
                        document.querySelector('textarea[aria-label*="message" i]'),
                        document.querySelector('textarea[placeholder*="Saisissez" i]'),
                        document.querySelector('[contenteditable="true"]'),
                        document.querySelector('div[role="textbox"]'),
                        document.querySelector('.DPvwYc textarea')
                    ].filter(el => el && el.offsetParent !== null);

                    return {{
                        chatButtons: chatButtons,
                        textAreas: textAreas,
                        chatButton: chatButtons[0] || null,
                        textArea: textAreas[0] || null
                    }};
                }},

                // 💬 FONCTION D'ENVOI DE MESSAGE
                sendMessage: function(message) {{
                    console.log('💬 Tentative envoi:', message.substring(0, 50) + '...');

                    try {{
                        const elements = this.findChatElements();

                        // Étape 1: Ouvrir le chat si nécessaire
                        if (elements.chatButton && !elements.textArea) {{
                            console.log('📂 Ouverture du chat...');
                            elements.chatButton.click();

                            // Attendre que le chat s'ouvre
                            setTimeout(() => {{
                                this.sendMessageDirectly(message);
                            }}, 2000);
                            return;
                        }}

                        // Étape 2: Envoyer directement si chat ouvert
                        this.sendMessageDirectly(message);

                    }} catch (error) {{
                        console.error('❌ Erreur envoi message:', error);
                    }}
                }},

                // 📤 ENVOI DIRECT DU MESSAGE
                sendMessageDirectly: function(message) {{
                    const elements = this.findChatElements();

                    if (elements.textArea) {{
                        console.log('✅ Zone texte trouvée, envoi...');

                        // Focus et vider
                        elements.textArea.focus();
                        elements.textArea.value = '';
                        elements.textArea.textContent = '';

                        // Attendre un peu
                        setTimeout(() => {{
                            // Saisir le message
                            elements.textArea.value = message;
                            elements.textArea.textContent = message;

                            // Déclencher les événements
                            elements.textArea.dispatchEvent(new Event('input', {{ bubbles: true }}));
                            elements.textArea.dispatchEvent(new Event('change', {{ bubbles: true }}));

                            // Attendre et envoyer
                            setTimeout(() => {{
                                // Enter pour envoyer
                                elements.textArea.dispatchEvent(new KeyboardEvent('keydown', {{
                                    key: 'Enter',
                                    code: 'Enter', 
                                    keyCode: 13,
                                    bubbles: true
                                }}));

                                // Aussi chercher bouton Send
                                const sendBtn = document.querySelector('[aria-label*="Send" i], [aria-label*="Envoyer" i]');
                                if (sendBtn) {{
                                    sendBtn.click();
                                }}

                                console.log('✅ Message envoyé:', message.substring(0, 30) + '...');

                            }}, 500);
                        }}, 300);

                    }} else {{
                        console.warn('⚠️ Aucune zone texte trouvée');

                        // Debug: lister tous les éléments disponibles
                        const allTextAreas = document.querySelectorAll('textarea, [contenteditable], [role=textbox]');
                        console.log('📋 Éléments texte disponibles:', allTextAreas.length);
                        allTextAreas.forEach((el, i) => {{
                            console.log(`  ${{i}}: ${{el.tagName}} - visible: ${{el.offsetParent !== null}} - placeholder: "${{el.placeholder || 'N/A'}}"`);
                        }});
                    }}
                }},

                // ⏰ GESTION DES TIMERS
                startTimers: function() {{
                    console.log('⏰ Démarrage timers questions...');

                    this.questions.forEach((question, index) => {{
                        const timer = setTimeout(() => {{
                            if (!question.sent) {{
                                console.log(`📝 Question ${{index + 1}} programmée:`, question.message.substring(0, 50) + '...');
                                this.sendMessage(question.message);
                                question.sent = true;
                                this.messages.push({{
                                    message: question.message,
                                    timestamp: Date.now(),
                                    timing: question.timing
                                }});
                            }}
                        }}, question.timing);

                        this.timers.push(timer);
                        console.log(`⏲️ Timer ${{index + 1}} programmé pour +${{question.timing / 1000}}s`);
                    }});

                    console.log(`✅ ${{this.questions.length}} questions programmées`);
                }},

                // 🚀 INITIALISATION
                init: function() {{
                    console.log('🚀 Initialisation système Avatar...');

                    // Attendre que Meet soit bien chargé
                    setTimeout(() => {{
                        this.isReady = true;
                        this.startTimers();
                        console.log('✅ Système Avatar prêt !');
                    }}, 3000);
                }}
            }};

            // 🎬 DÉMARRAGE AUTOMATIQUE
            if (document.readyState === 'complete') {{
                window.avatarChatSystem.init();
            }} else {{
                window.addEventListener('load', () => {{
                    window.avatarChatSystem.init();
                }});
            }}

            // Fonction utilitaire pour envoi externe
            window.avatarSendMessage = function(message) {{
                if (window.avatarChatSystem && window.avatarChatSystem.isReady) {{
                    window.avatarChatSystem.sendMessage(message);
                    return true;
                }} else {{
                    console.warn('⚠️ Système Avatar pas encore prêt');
                    return false;
                }}
            }};

            console.log('🎯 Système Avatar injecté avec succès');
            """

            # 💉 INJECTION DU SCRIPT
            page.evaluate(javascript_system)

            log_step("Système injecté", True, "Questions automatiques activées")

            # 🎯 DÉMARRER LE MONITORING PYTHON
            self._start_python_monitoring_thread(interview_id, page)

            return True

        except Exception as e:
            log_step("JS Monitor Error", False, str(e))
            return False

    def _start_python_monitoring_thread(self, interview_id, page):
        """🐍 Thread de monitoring Python pour surveiller le système JS - VERSION CORRIGÉE"""

        def monitoring_thread():
            try:
                print(f"🐍 Démarrage monitoring Python pour {interview_id}")

                start_time = time.time()
                last_check = 0

                # 🔧 CORRECTION: Utiliser active_avatars au lieu de sessions
                while interview_id in self.active_avatars:
                    elapsed = int(time.time() - start_time)

                    # Vérifier l'état du système JS toutes les 45s (moins fréquent)
                    if elapsed - last_check >= 45:
                        try:
                            # Récupérer l'état du système avec timeout
                            status = page.evaluate("""
                                () => {
                                    if (window.avatarChatSystem) {
                                        return {
                                            isReady: window.avatarChatSystem.isReady,
                                            questionsTotal: window.avatarChatSystem.questions.length,
                                            questionsSent: window.avatarChatSystem.questions.filter(q => q.sent).length,
                                            messagesCount: window.avatarChatSystem.messages.length,
                                            timersActive: window.avatarChatSystem.timers.length,
                                            elapsedTime: Date.now() - window.avatarChatSystem.startTime
                                        };
                                    }
                                    return { error: 'Système non trouvé' };
                                }
                            """)

                            if 'error' not in status:
                                sent = status['questionsSent']
                                total = status['questionsTotal']
                                print(f"📊 Status {interview_id}: {sent}/{total} questions envoyées - {elapsed}s écoulées")

                                # Notifier via WebSocket
                                self.socketio.emit('avatar_status', {
                                    'interview_id': interview_id,
                                    'questions_sent': sent,
                                    'questions_total': total,
                                    'elapsed_time': elapsed,
                                    'timestamp': datetime.utcnow().isoformat()
                                })
                            else:
                                print(f"⚠️ Système JS non actif pour {interview_id}")

                        except Exception as e:
                            print(f"⚠️ Erreur vérification JS {interview_id}: {e}")

                        last_check = elapsed

                    time.sleep(15)  # Check moins fréquent pour éviter surcharge

            except Exception as e:
                print(f"❌ Erreur monitoring Python {interview_id}: {e}")
            finally:
                print(f"🔚 Fin monitoring Python {interview_id}")
    
        # Démarrer le thread de monitoring
        thread = threading.Thread(target=monitoring_thread)
        thread.daemon = True
        thread.start()
    
    def human_auth_then_bot_takeover(self, interview_id, interview_data):
        """👨‍💻 AUTHENTIFICATION HUMAINE + TRANSFERT AU BOT"""

        def log_step(step, success, message):
            status = "✅" if success else "❌"
            print(f"{status} {step}: {message}")

        try:
            from playwright.sync_api import sync_playwright

            log_step("Auth Humaine", True, "Démarrage avec interaction humaine...")

            # ÉTAPE 1: Chrome normal pour authentification humaine
            p = sync_playwright().start()

            # Profil utilisateur NORMAL (pas persistent pour éviter détection)
            browser = p.chromium.launch(
                headless=False,  # Visible pour l'humain
                args=[
                    '--no-first-run',
                    '--no-default-browser-check',
                    '--disable-blink-features=AutomationControlled',
                    '--exclude-switches=enable-automation',
                    '--disable-web-security',
                    '--window-size=1920,1080'
                ]
            )

            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            )

            page = context.new_page()

            # Anti-détection minimal (pas trop suspect)
            page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                delete window.__playwright;
            """)

            meet_link = interview_data.get('meet_link', '')

            log_step("Ouverture Meet", True, "Navigation vers Meet...")

            # ÉTAPE 2: Aller directement sur Meet (humain gère l'auth)
            page.goto(meet_link, wait_until='domcontentloaded', timeout=60000)
            page.wait_for_timeout(3000)

            current_url = page.url
            page_content = page.content()

            log_step("Meet chargé", True, f"URL: {current_url}")

            # Vérifier si on a encore l'erreur de bot
            if "can't create a meeting" in page_content.lower() or "contact your system administrator" in page_content.lower():
                log_step("Bot détecté", False, "Meet détecte encore un bot")

                # INTERVENTION HUMAINE REQUISE
                print("\n" + "="*60)
                print("🚨 INTERVENTION HUMAINE REQUISE")
                print("="*60)
                print("📋 ÉTAPES À SUIVRE :")
                print("   1. Une fenêtre Chrome s'est ouverte")
                print("   2. Connectez-vous manuellement à Google si demandé")
                print("   3. Naviguez normalement vers le lien Meet")
                print("   4. Rejoignez le meeting comme un humain normal")
                print("   5. Une fois dans le meeting, appuyez sur ENTRÉE ici")
                print("\n💡 Conseil: Bougez la souris, scrollez, agissez naturellement")
                print("="*60)

                # Attendre la confirmation humaine
                input("⏳ Appuyez sur ENTRÉE quand vous êtes dans le meeting... ")

                log_step("Intervention humaine", True, "Humain dans le meeting confirmé")

            # ÉTAPE 3: Vérifier qu'on est bien dans le meeting
            page.wait_for_timeout(2000)
            final_url = page.url
            final_content = page.content()

            if "meet.google.com" in final_url and "can't" not in final_content.lower():
                log_step("Meeting rejoint", True, "✅ Accès Meet réussi!")
            else:
                log_step("Meeting rejoint", False, "Vérifiez que vous êtes bien dans le meeting")

            # ÉTAPE 4: MAINTENANT transfert au bot pour automatisation
            log_step("Transfert bot", True, "Transfert contrôle au système automatique...")

            # Stocker la session authentifiée
            self.sessions[interview_id] = {
                'playwright': p,
                'browser': None,
                'context': context,
                'page': page,
                'status': 'human_authenticated',
                'handoff_complete': True
            }

            # Ajouter aux avatars actifs
            self.active_avatars[interview_id] = {
                'config': {
                    'interview_id': interview_id,
                    'meet_link': meet_link,
                    'status': 'human_to_bot_handoff',
                    'position': interview_data.get('position', ''),
                    'candidate_name': interview_data.get('candidate_name', '')
                },
                'started_at': datetime.utcnow().isoformat(),
                'browser': 'chrome_human_auth',
                'system': self.system,
                'status': 'running_post_human'
            }

            # ÉTAPE 5: Injecter le système de questions (maintenant que l'humain est connecté)
            log_step("Système questions", True, "Activation automatisation...")

            # Attendre stabilisation
            page.wait_for_timeout(5000)

            # Injecter le système intelligent
            success = self._inject_post_human_system(page, interview_data, log_step)

            if success:
                log_step("Bot actif", True, "🤖 Système automatique opérationnel!")
                self._start_post_human_monitoring(interview_id, page)

            return {
                'success': True,
                'method': 'human_auth_handoff',
                'authentication': 'human_then_bot',
                'meet_status': 'joined_as_human',
                'bot_status': 'taking_over',
                'interview_id': interview_id
            }

        except Exception as e:
            log_step("Erreur handoff", False, str(e))
            return {'success': False, 'error': str(e)}

    def _inject_post_human_system(self, page, interview_data, log_step):
        """💉 Système intelligent après authentification humaine"""

        try:
            position = interview_data.get('position', 'Développeur')

            # Questions adaptées selon le poste
            questions_data = self._get_smart_questions(position)

            import json
            questions_json = json.dumps(questions_data)

            js_script = f"""
            console.log('🤖 SYSTÈME POST-HUMAIN ACTIVÉ');

            window.postHumanBot = {{
                questions: {questions_json},
                timers: [],
                sent: 0,
                active: true,
                startTime: Date.now(),

                sendMessage: function(text) {{
                    console.log('📤 Envoi automatique:', text.substring(0, 40) + '...');

                    // Méthode robuste de recherche du chat
                    const findChatInput = () => {{
                        const selectors = [
                            'textarea[placeholder*="message" i]',
                            'textarea[aria-label*="message" i]',
                            '[contenteditable="true"]',
                            'div[role="textbox"]'
                        ];

                        for (const sel of selectors) {{
                            const el = document.querySelector(sel);
                            if (el && el.offsetParent !== null) return el;
                        }}
                        return null;
                    }};

                    const chatInput = findChatInput();

                    if (!chatInput) {{
                        // Essayer d'ouvrir le chat
                        const chatBtn = document.querySelector('[aria-label*="chat" i], [data-tooltip*="chat" i]');
                        if (chatBtn) {{
                            chatBtn.click();
                            setTimeout(() => this.sendMessage(text), 2000);
                            return;
                        }}
                        console.warn('❌ Chat non trouvé');
                        return;
                    }}

                    // Envoi naturel avec délais humains
                    chatInput.focus();
                    chatInput.value = '';

                    setTimeout(() => {{
                        chatInput.value = text;
                        chatInput.dispatchEvent(new Event('input', {{ bubbles: true }}));

                        setTimeout(() => {{
                            // Enter pour envoyer
                            chatInput.dispatchEvent(new KeyboardEvent('keydown', {{
                                key: 'Enter',
                                keyCode: 13,
                                bubbles: true
                            }}));

                            console.log('✅ Message envoyé:', text.substring(0, 30) + '...');
                            this.sent++;

                        }}, 300 + Math.random() * 200);  // Délai humain variable
                    }}, 100 + Math.random() * 100);
                }},

                scheduleQuestions: function() {{
                    console.log('📅 Programmation', this.questions.length, 'questions...');

                    this.questions.forEach((q, i) => {{
                        const timer = setTimeout(() => {{
                            if (this.active) {{
                                console.log(`📝 Question ${{i+1}}/${{this.questions.length}}`);
                                this.sendMessage(q.text);
                            }}
                        }}, q.delay);

                        this.timers.push(timer);
                        console.log(`⏰ Q${{i+1}} programmée pour +${{Math.round(q.delay/1000)}}s`);
                    }});
                }},

                getStatus: function() {{
                    return {{
                        sent: this.sent,
                        total: this.questions.length,
                        active: this.active,
                        elapsed: Math.round((Date.now() - this.startTime) / 1000)
                    }};
                }}
            }};

            // Démarrage automatique avec délai de stabilisation
            setTimeout(() => {{
                console.log('🚀 Activation système post-humain...');
                window.postHumanBot.scheduleQuestions();
                console.log('✅ Système automatique ACTIF !');
            }}, 8000);  // 8 secondes pour stabilisation

            // Fonction de test
            window.testBot = () => window.postHumanBot.sendMessage('🤖 Test connexion - ' + new Date().toLocaleTimeString());

            console.log('💉 Système post-humain injecté');
            """

            page.evaluate(js_script)
            log_step("JS post-humain", True, "Système automatique injecté")

            return True

        except Exception as e:
            log_step("Erreur injection", False, str(e))
            return False

    def _get_smart_questions(self, position):
        """🧠 Questions intelligentes selon le poste"""

        base_questions = [
            {
                'delay': 12000,  # 12 secondes
                'text': f"Bonjour ! Je suis votre assistant IA pour cet entretien {position}. Ravi de vous rencontrer !",
                'type': 'intro'
            },
            {
                'delay': 60000,  # 1 minute
                'text': "Pouvez-vous vous présenter et nous parler de votre parcours professionnel ?",
                'type': 'experience'
            },
            {
                'delay': 240000,  # 4 minutes
                'text': "Quelle est votre plus belle réalisation professionnelle et pourquoi ?",
                'type': 'achievement'
            },
            {
                'delay': 480000,  # 8 minutes
                'text': "Comment gérez-vous les défis techniques et le travail en équipe ?",
                'type': 'teamwork'
            },
            {
                'delay': 720000,  # 12 minutes
                'text': "Pourquoi ce poste vous intéresse-t-il et que pourriez-vous apporter à notre équipe ?",
                'type': 'motivation'
            },
            {
                'delay': 960000,  # 16 minutes
                'text': "Avez-vous des questions sur le poste, l'équipe ou notre entreprise ?",
                'type': 'questions'
            }
        ]

        # Questions spécifiques selon le poste
        if 'développeur' in position.lower() or 'dev' in position.lower():
            base_questions.insert(3, {
                'delay': 360000,  # 6 minutes
                'text': "Parlez-moi de votre stack technique préférée et d'un projet récent.",
                'type': 'technical'
            })

        return base_questions

    def _start_post_human_monitoring(self, interview_id, page):
        """📊 Monitoring pour système post-humain"""

        def monitoring():
            try:
                print(f"📊 Monitoring post-humain {interview_id}")
                start_time = time.time()

                while interview_id in self.active_avatars:
                    elapsed = int(time.time() - start_time)

                    # Check toutes les 60 secondes (moins agressif)
                    if elapsed % 60 == 0:
                        try:
                            status = page.evaluate("() => window.postHumanBot ? window.postHumanBot.getStatus() : {error: true}")

                            if not status.get('error'):
                                print(f"📈 {interview_id}: {status['sent']}/{status['total']} questions - {status['elapsed']}s")

                                # WebSocket update
                                self.socketio.emit('avatar_post_human_status', {
                                    'interview_id': interview_id,
                                    'status': status,
                                    'timestamp': datetime.utcnow().isoformat()
                                })
                        except:
                            pass
                        
                    time.sleep(20)  # Check toutes les 20 secondes

            except Exception as e:
                print(f"❌ Erreur monitoring post-humain: {e}")

        thread = threading.Thread(target=monitoring)
        thread.daemon = True
        thread.start()

    # MÉTHODE PRINCIPALE À UTILISER
    def force_avatar_launch(self, interview_id, interview_data):
        """🚀 LANCEMENT AVEC AUTHENTIFICATION HUMAINE"""

        try:
            print("🎯 Méthode: Authentification humaine + transfert bot")
            return self.human_auth_then_bot_takeover(interview_id, interview_data)
        except Exception as e:
            print(f"❌ Erreur lancement humain: {e}")
            return {'success': False, 'error': str(e)}
    
    
# Instance globale
avatar_service = None

def init_avatar_service(socketio):
    """Initialise le service avatar Playwright"""
    global avatar_service
    avatar_service = AvatarService(socketio)
    avatar_service.start()
    return avatar_service

def get_avatar_service():
    """Récupère l'instance du service avatar"""
    return avatar_service




