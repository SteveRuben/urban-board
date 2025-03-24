// frontend/pages/auth/reset-password.jsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, CheckCircle, LockKeyhole } from 'lucide-react';

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const router = useRouter();

  // Récupérer le token de l'URL
  useEffect(() => {
    if (router.query.token) {
      setToken(router.query.token);
    }
  }, [router.query]);

  // Vérifier la force du mot de passe
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    const password = newPassword;
    
    // Longueur minimum
    if (password.length >= 8) strength += 1;
    
    // Majuscules et minuscules
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    
    // Chiffres
    if (/[0-9]/.test(password)) strength += 1;
    
    // Caractères spéciaux
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  }, [newPassword]);

  // Valider le formulaire
  const validateForm = () => {
    let isValid = true;
    
    if (!token) {
      setError('Token de réinitialisation manquant ou invalide');
      isValid = false;
    }
    
    if (!newPassword) {
      setError('Veuillez saisir un nouveau mot de passe');
      isValid = false;
    } else if (passwordStrength < 3) {
      setError('Le mot de passe est trop faible');
      isValid = false;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      isValid = false;
    }
    
    return isValid;
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setError('');
      
      const result = await resetPassword(token, newPassword);
      
      if (!result.success) {
        setError(result.error || 'Erreur lors de la réinitialisation du mot de passe');
        return;
      }
      
      // Afficher un message de succès
      setSuccess(true);
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      console.error('Erreur de réinitialisation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu des barres de force du mot de passe
  const renderPasswordStrength = () => {
    const bars = [];
    const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Fort'];
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
    
    for (let i = 0; i < 4; i++) {
      bars.push(
        <div
          key={i}
          className={`h-1 w-1/4 rounded-full ${
            i < passwordStrength ? strengthColors[i] : 'bg-gray-200'
          }`}
        />
      );
    }
    
    return (
      <div className="mt-1">
        <div className="flex space-x-1">{bars}</div>
        {newPassword && (
          <p className="text-xs mt-1 text-gray-500">
            Force: {strengthLabels[passwordStrength - 1] || 'Très faible'}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
          <LockKeyhole className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Réinitialisation du mot de passe
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {success 
            ? "Votre mot de passe a été réinitialisé avec succès" 
            : "Créez un nouveau mot de passe pour votre compte"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {success ? (
            // Affichage du message de succès
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900">Mot de passe réinitialisé</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant
                    vous connecter avec votre nouveau mot de passe.
                  </p>
                </div>
                <div className="mt-5">
                  <Link 
                    href="/auth/login"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Se connecter
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            // Formulaire de réinitialisation
            <>
              {!token && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center text-yellow-700">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>Lien de réinitialisation invalide ou expiré. Veuillez faire une nouvelle demande.</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    Nouveau mot de passe
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="new-password"
                      name="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {renderPasswordStrength()}
                  <p className="mt-1 text-xs text-gray-500">
                    Le mot de passe doit contenir au moins 8 caractères, une majuscule, 
                    une minuscule, un chiffre et un caractère spécial.
                  </p>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirmer le mot de passe
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !token}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      (isSubmitting || !token) ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Réinitialisation en cours...
                      </>
                    ) : (
                      'Réinitialiser le mot de passe'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link 
                href="/auth/login" 
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;