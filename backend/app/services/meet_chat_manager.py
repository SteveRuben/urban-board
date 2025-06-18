import queue
import threading
import time

class MeetChatManager:
    """Gestionnaire thread-safe pour les messages Meet"""
    
    def __init__(self, avatar_service):
        self.avatar_service = avatar_service
        self.message_queue = queue.Queue()
        self.processor_thread = None
        self.running = False
        
    def start(self):
        """Démarre le processeur de messages"""
        if self.running:
            return
            
        self.running = True
        self.processor_thread = threading.Thread(target=self._process_messages)
        self.processor_thread.daemon = True
        self.processor_thread.start()
        print("✅ MeetChatManager démarré")
    
    def stop(self):
        """Arrête le processeur"""
        self.running = False
        if self.processor_thread:
            self.processor_thread.join(timeout=2)
    
    def send_message(self, interview_id: str, message: str, delay: int = 0):
        """Ajoute un message à la queue"""
        self.message_queue.put({
            'interview_id': interview_id,
            'message': message,
            'delay': delay,
            'timestamp': time.time()
        })
        print(f"📝 Message mis en queue pour {interview_id}: {message[:50]}...")
    
    def _process_messages(self):
        """Traite les messages depuis le thread principal"""
        while self.running:
            try:
                # Attendre un message avec timeout
                message_data = self.message_queue.get(timeout=1)
                
                interview_id = message_data['interview_id']
                message = message_data['message']
                delay = message_data['delay']
                
                # Attendre le délai si nécessaire
                if delay > 0:
                    time.sleep(delay)
                
                # Vérifier que l'avatar est toujours actif
                if interview_id not in self.avatar_service.active_avatars:
                    continue
                
                # Envoyer le message dans Meet
                success = self._send_to_meet_chat(interview_id, message)
                
                if success:
                    print(f"✅ Message envoyé dans Meet: {message[:50]}...")
                else:
                    print(f"❌ Échec envoi Meet: {message[:50]}...")
                
                self.message_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                print(f"❌ Erreur processeur messages: {e}")
    
    def _send_to_meet_chat(self, interview_id: str, message: str) -> bool:
        """Envoie réellement le message dans Meet (thread principal)"""
        
        try:
            if interview_id not in self.avatar_service.avatar_pages:
                print(f"❌ Page non trouvée pour {interview_id}")
                return False
            
            page = self.avatar_service.avatar_pages[interview_id]
            
            print(f"🎯 Tentative envoi Meet pour {interview_id}")
            
            # STRATÉGIE 1 : JavaScript injection direct
            success = self._inject_message_javascript(page, message)
            if success:
                return True
            
            # STRATÉGIE 2 : Sélecteurs Playwright
            success = self._send_with_selectors(page, message)
            if success:
                return True
                
            # STRATÉGIE 3 : Simulation clavier
            success = self._send_with_keyboard(page, message)
            return success
            
        except Exception as e:
            print(f"❌ Erreur envoi Meet: {e}")
            return False
    
    def _inject_message_javascript(self, page, message: str) -> bool:
        """Injection JavaScript directe dans Meet"""
        
        try:
            print("🔧 Tentative injection JavaScript...")
            
            # Échapper les caractères spéciaux
            escaped_message = message.replace('"', '\\"').replace('\n', '\\n')
            
            script = f"""
            async () => {{
                console.log('🤖 Avatar: Tentative envoi message');
                
                // Fonction pour attendre un élément
                function waitForElement(selector, timeout = 5000) {{
                    return new Promise((resolve) => {{
                        const interval = setInterval(() => {{
                            const element = document.querySelector(selector);
                            if (element) {{
                                clearInterval(interval);
                                resolve(element);
                            }}
                        }}, 100);
                        
                        setTimeout(() => {{
                            clearInterval(interval);
                            resolve(null);
                        }}, timeout);
                    }});
                }}
                
                try {{
                    // 1. Chercher et ouvrir le chat
                    const chatSelectors = [
                        '[aria-label*="chat" i]',
                        '[data-tooltip*="chat" i]',
                        'button[data-panel-id="chat"]',
                        '[aria-label*="Afficher le chat" i]',
                        '[aria-label*="Show chat" i]'
                    ];
                    
                    let chatOpened = false;
                    for (const selector of chatSelectors) {{
                        const chatBtn = document.querySelector(selector);
                        if (chatBtn && chatBtn.offsetParent !== null) {{
                            console.log('🎯 Clic bouton chat:', selector);
                            chatBtn.click();
                            await new Promise(r => setTimeout(r, 1000));
                            chatOpened = true;
                            break;
                        }}
                    }}
                    
                    if (!chatOpened) {{
                        console.log('⚠️ Chat non ouvert, essai raccourci');
                        // Essayer raccourci clavier
                        const event = new KeyboardEvent('keydown', {{
                            key: 'c',
                            ctrlKey: true,
                            altKey: true,
                            bubbles: true
                        }});
                        document.dispatchEvent(event);
                        await new Promise(r => setTimeout(r, 1000));
                    }}
                    
                    // 2. Trouver la zone de texte
                    const textSelectors = [
                        'textarea[placeholder*="message" i]',
                        'textarea[aria-label*="message" i]',
                        'textarea[placeholder*="Saisissez" i]',
                        '[contenteditable="true"]',
                        'div[role="textbox"]',
                        '.DPvwYc textarea'
                    ];
                    
                    let textInput = null;
                    for (const selector of textSelectors) {{
                        textInput = await waitForElement(selector, 2000);
                        if (textInput) {{
                            console.log('✅ Zone texte trouvée:', selector);
                            break;
                        }}
                    }}
                    
                    if (!textInput) {{
                        console.log('❌ Zone texte non trouvée');
                        return 'no_text_input';
                    }}
                    
                    // 3. Envoyer le message
                    textInput.focus();
                    await new Promise(r => setTimeout(r, 300));
                    
                    // Vider et remplir
                    textInput.value = '';
                    textInput.textContent = '';
                    
                    // Simuler la frappe
                    textInput.value = "{escaped_message}";
                    textInput.textContent = "{escaped_message}";
                    
                    // Déclencher les événements
                    textInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    textInput.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    
                    await new Promise(r => setTimeout(r, 500));
                    
                    // Envoyer avec Enter
                    const enterEvent = new KeyboardEvent('keydown', {{
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        bubbles: true
                    }});
                    textInput.dispatchEvent(enterEvent);
                    
                    console.log('✅ Message envoyé:', "{escaped_message}");
                    return 'success';
                    
                }} catch (error) {{
                    console.log('❌ Erreur JS:', error);
                    return 'error: ' + error.message;
                }}
            }}
            """
            
            result = page.evaluate(script)
            
            if result == 'success':
                print("✅ Message envoyé via JavaScript")
                return True
            else:
                print(f"⚠️ JavaScript résultat: {result}")
                return False
                
        except Exception as e:
            print(f"❌ Erreur JavaScript injection: {e}")
            return False
    
    def _send_with_selectors(self, page, message: str) -> bool:
        """Envoi avec sélecteurs Playwright"""
        
        try:
            print("🔧 Tentative sélecteurs Playwright...")
            
            # Ouvrir le chat
            chat_selectors = [
                '[aria-label*="chat" i]',
                '[data-tooltip*="chat" i]',
                'button[data-panel-id="chat"]'
            ]
            
            for selector in chat_selectors:
                try:
                    chat_btn = page.wait_for_selector(selector, timeout=2000)
                    if chat_btn and chat_btn.is_visible():
                        chat_btn.click()
                        page.wait_for_timeout(1000)
                        print(f"✅ Chat ouvert: {selector}")
                        break
                except:
                    continue
            
            # Chercher zone de texte
            text_selectors = [
                'textarea[placeholder*="message" i]',
                'textarea[aria-label*="message" i]',
                '[role="textbox"]'
            ]
            
            for selector in text_selectors:
                try:
                    text_input = page.wait_for_selector(selector, timeout=3000)
                    if text_input and text_input.is_visible():
                        text_input.click()
                        text_input.fill('')
                        text_input.type(message)
                        text_input.press('Enter')
                        print("✅ Message envoyé via sélecteurs")
                        return True
                except:
                    continue
            
            return False
            
        except Exception as e:
            print(f"❌ Erreur sélecteurs: {e}")
            return False
    
    def _send_with_keyboard(self, page, message: str) -> bool:
        """Envoi via simulation clavier"""
        
        try:
            print("🔧 Tentative simulation clavier...")
            
            # Ouvrir chat avec raccourci
            page.keyboard.press('Control+Alt+c')
            page.wait_for_timeout(1000)
            
            # Taper directement
            page.keyboard.type(message)
            page.keyboard.press('Enter')
            
            print("✅ Message envoyé via clavier")
            return True
            
        except Exception as e:
            print(f"❌ Erreur clavier: {e}")
            return False