// components/profile/TwoFactorAuthModal.tsx
import React, { Fragment, useEffect, useState, ChangeEvent } from 'react';
import { Dialog, Transition, RadioGroup } from '@headlessui/react';
import { XIcon, PhoneIcon , MailIcon, QrCodeIcon, CheckCircleIcon } from 'lucide-react';
import Image from 'next/image';

type TwoFactorMethod = 'app' | 'sms' | 'email';
type TwoFactorSetupState = 'idle' | 'setup' | 'verify';

interface TwoFactorSetupData {
  method: TwoFactorMethod;
  qrCode?: string;
  secretKey?: string;
  backupCodes?: string[];
  verificationSent?: boolean;
}

interface TwoFactorAuthModalProps {
  setupState: TwoFactorSetupState;
  setupData: TwoFactorSetupData | null;
  verificationCode: string;
  processingAction: boolean;
  onMethodChange: (method: TwoFactorMethod) => void;
  onVerificationCodeChange: (code: string) => void;
  onVerificationSubmit: () => void;
  onCancel: () => void;
}

const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  setupState,
  setupData,
  verificationCode,
  processingAction,
  onMethodChange,
  onVerificationCodeChange,
  onVerificationSubmit,
  onCancel
}) => {
  // État local pour gérer l'affichage du code de secours
  const [showBackupCodes, setShowBackupCodes] = useState<boolean>(false);
  
  // Focus sur le champ de code quand on est en mode vérification
  useEffect(() => {
    if (setupState === 'verify') {
      const timer = setTimeout(() => {
        const codeInput = document.getElementById('verification-code');
        if (codeInput) {
          codeInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [setupState]);
  
  // Formater le code de vérification pendant la saisie (grouper par 3 chiffres)
  const handleCodeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
    onVerificationCodeChange(value);
  };

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog
        as="div"
        className="fixed z-10 inset-0 overflow-y-auto"
        onClose={onCancel}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* Centrer la boîte de dialogue dans l'écran */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={onCancel}
                >
                  <span className="sr-only">Fermer</span>
                  <XIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                    Authentification à deux facteurs
                  </Dialog.Title>
                  
                  {setupState === 'setup' && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-4">
                        L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte. 
                        Chaque fois que vous vous connectez, vous devrez fournir un code en plus de votre mot de passe.
                      </p>
                      
                      <div className="mt-6">
                        <RadioGroup value={setupData?.method || 'app'} onChange={onMethodChange}>
                          <RadioGroup.Label className="text-sm font-medium text-gray-700">
                            Choisissez votre méthode préférée
                          </RadioGroup.Label>
                          
                          <div className="mt-4 grid grid-cols-1 gap-y-4">
                            <RadioGroup.Option
                              value="app"
                              className={({ checked }) =>
                                `${checked ? 'bg-indigo-50 border-indigo-200' : 'border-gray-200'}
                                relative rounded-lg border p-4 flex cursor-pointer focus:outline-none`
                              }
                            >
                              {({ checked }) => (
                                <>
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center">
                                      <div className="text-sm">
                                        <RadioGroup.Label
                                          as="p"
                                          className={`font-medium ${checked ? 'text-indigo-900' : 'text-gray-900'}`}
                                        >
                                          <div className="flex items-center">
                                            <QrCodeIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                            Application d'authentification
                                          </div>
                                        </RadioGroup.Label>
                                        <RadioGroup.Description
                                          as="span"
                                          className={`inline ${checked ? 'text-indigo-700' : 'text-gray-500'}`}
                                        >
                                          Google Authenticator, Authy, ou toute autre application compatible TOTP
                                        </RadioGroup.Description>
                                      </div>
                                    </div>
                                    {checked && (
                                      <div className="flex-shrink-0 text-indigo-600">
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </RadioGroup.Option>
                            
                            <RadioGroup.Option
                              value="sms"
                              className={({ checked }) =>
                                `${checked ? 'bg-indigo-50 border-indigo-200' : 'border-gray-200'}
                                relative rounded-lg border p-4 flex cursor-pointer focus:outline-none`
                              }
                            >
                              {({ checked }) => (
                                <>
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center">
                                      <div className="text-sm">
                                        <RadioGroup.Label
                                          as="p"
                                          className={`font-medium ${checked ? 'text-indigo-900' : 'text-gray-900'}`}
                                        >
                                          <div className="flex items-center">
                                            <PhoneIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                            SMS
                                          </div>
                                        </RadioGroup.Label>
                                        <RadioGroup.Description
                                          as="span"
                                          className={`inline ${checked ? 'text-indigo-700' : 'text-gray-500'}`}
                                        >
                                          Recevez un code par SMS sur votre téléphone mobile
                                        </RadioGroup.Description>
                                      </div>
                                    </div>
                                    {checked && (
                                      <div className="flex-shrink-0 text-indigo-600">
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </RadioGroup.Option>
                            
                            <RadioGroup.Option
                              value="email"
                              className={({ checked }) =>
                                `${checked ? 'bg-indigo-50 border-indigo-200' : 'border-gray-200'}
                                relative rounded-lg border p-4 flex cursor-pointer focus:outline-none`
                              }
                            >
                              {({ checked }) => (
                                <>
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center">
                                      <div className="text-sm">
                                        <RadioGroup.Label
                                          as="p"
                                          className={`font-medium ${checked ? 'text-indigo-900' : 'text-gray-900'}`}
                                        >
                                          <div className="flex items-center">
                                            <MailIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                            Email
                                          </div>
                                        </RadioGroup.Label>
                                        <RadioGroup.Description
                                          as="span"
                                          className={`inline ${checked ? 'text-indigo-700' : 'text-gray-500'}`}
                                        >
                                          Recevez un code par email à chaque connexion
                                        </RadioGroup.Description>
                                      </div>
                                    </div>
                                    {checked && (
                                      <div className="flex-shrink-0 text-indigo-600">
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </RadioGroup.Option>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      {/* Instructions spécifiques selon la méthode */}
                      {setupData?.method === 'app' && setupData?.qrCode && (
                        <div className="mt-6 text-center">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Scannez ce QR code avec votre application d'authentification
                          </h4>
                          <div className="inline-block p-2 bg-white border border-gray-200 rounded-lg">
                            <Image 
                              src={`data:image/png;base64,${setupData.qrCode}`} 
                              alt="QR Code" 
                              width={180} 
                              height={180} 
                            />
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            Ou entrez cette clé manuellement : <span className="font-mono">{setupData.secretKey}</span>
                          </p>
                          
                          <div className="mt-4 flex flex-col space-y-2">
                            <button
                              type="button"
                              onClick={() => onMethodChange('verify' as TwoFactorMethod)}
                              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              J'ai scanné le QR code
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setShowBackupCodes(!showBackupCodes)}
                              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              {showBackupCodes ? "Masquer les codes de secours" : "Afficher les codes de secours"}
                            </button>
                          </div>
                          
                          {showBackupCodes && setupData.backupCodes && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-md">
                              <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center justify-center">
                                <span className="text-red-600 mr-1">Important:</span> Conservez ces codes de secours
                              </h5>
                              <p className="text-xs text-gray-500 mb-2">
                                Utilisez ces codes si vous perdez l'accès à votre méthode d'authentification principale.
                                Conservez-les dans un endroit sûr.
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {setupData.backupCodes.map((code, index) => (
                                  <div key={index} className="bg-white p-1 rounded border border-gray-200 font-mono text-sm">
                                    {code}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {setupData?.method === 'sms' && (
                        <div className="mt-6">
                          <p className="text-sm text-gray-500 mb-4">
                            Un SMS avec un code de vérification sera envoyé à votre numéro de téléphone mobile associé à votre compte.
                          </p>
                          <button
                            type="button"
                            onClick={() => onMethodChange('verify' as TwoFactorMethod)}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Envoyer le code par SMS
                          </button>
                        </div>
                      )}
                      
                      {setupData?.method === 'email' && (
                        <div className="mt-6">
                          <p className="text-sm text-gray-500 mb-4">
                            Un email avec un code de vérification sera envoyé à votre adresse email associée à votre compte.
                          </p>
                          <button
                            type="button"
                            onClick={() => onMethodChange('verify' as TwoFactorMethod)}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Envoyer le code par email
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {setupState === 'verify' && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-6">
                        Entrez le code de vérification {
                          setupData?.method === 'app' 
                            ? 'affiché dans votre application d\'authentification' 
                            : setupData?.method === 'sms'
                              ? 'reçu par SMS'
                              : 'reçu par email'
                        }
                      </p>
                      
                      <div className="mt-2">
                        <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700">
                          Code de vérification
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="verification-code"
                            id="verification-code"
                            value={verificationCode}
                            onChange={handleCodeChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-center tracking-widest"
                            placeholder="000000"
                            maxLength={6}
                            autoComplete="off"
                            inputMode="numeric"
                            pattern="[0-9]*"
                          />
                          <p className="mt-1 text-xs text-gray-400 text-right">
                            Saisissez le code à 6 chiffres
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-between">
                        <button
                          type="button"
                          onClick={() => onMethodChange(setupData?.method || 'app')}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Retour
                        </button>
                        <button
                          type="button"
                          onClick={onVerificationSubmit}
                          disabled={verificationCode.length < 6 || processingAction}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingAction ? (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : null}
                          Vérifier
                        </button>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <button
                          type="button"
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                          onClick={() => {
                            // Logique pour renvoyer le code
                            if (setupData?.method === 'sms' || setupData?.method === 'email') {
                              // Simuler un renvoi de code
                              alert(`Un nouveau code a été envoyé par ${setupData.method === 'sms' ? 'SMS' : 'email'}`);
                            }
                          }}
                        >
                          Je n'ai pas reçu de code, renvoyer
                        </button>
                      </div>
                      
                      {setupData?.method === 'app' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                            <p className="text-xs text-gray-600">
                              Après avoir activé l'authentification à deux facteurs, chaque connexion nécessitera votre mot de passe et un code généré par votre application.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default TwoFactorAuthModal;