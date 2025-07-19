// components/profile/SecurityCard.tsx
import React, { ChangeEvent, FormEvent } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SecurityInfo, PasswordForm } from '@/types';

interface SecurityCardProps {
  securityInfo: SecurityInfo;
  showPasswordChangeForm: boolean;
  passwordForm: PasswordForm;
  processingAction: boolean;
  onTogglePasswordForm: () => void;
  onPasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onUpdatePassword: (e: FormEvent) => void;
  onShowTwoFactorSetup: () => void;
}

const SecurityCard: React.FC<SecurityCardProps> = ({
  securityInfo,
  showPasswordChangeForm,
  passwordForm,
  processingAction,
  onTogglePasswordForm,
  onPasswordChange,
  onUpdatePassword,
  onShowTwoFactorSetup
}) => {
  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  return (
    <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Sécurité</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Paramètres de sécurité et d'authentification
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        {/* Password section */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-md font-medium text-gray-900">Mot de passe</h3>
              {securityInfo.lastPasswordChange && (
                <p className="text-sm text-gray-500 mt-1">
                  Dernière modification : {formatDate(securityInfo.lastPasswordChange)}
                </p>
              )}
            </div>
            <button
              onClick={onTogglePasswordForm}
              disabled={processingAction}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showPasswordChangeForm ? 'Annuler' : 'Changer le mot de passe'}
            </button>
          </div>

          {showPasswordChangeForm && (
            <form onSubmit={onUpdatePassword} className="mt-6 space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={onPasswordChange}
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="newPassword"
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={onPasswordChange}
                  required
                  minLength={8}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Le mot de passe doit contenir au moins 8 caractères, incluant des lettres majuscules, minuscules et des chiffres.
                </p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={onPasswordChange}
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={processingAction}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingAction ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  Mettre à jour le mot de passe
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Two Factor Authentication section */}
        <div className="py-4 border-t border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-md font-medium text-gray-900">Authentification à deux facteurs</h3>
              <p className="text-sm text-gray-500 mt-1">
                {securityInfo.twoFactorEnabled
                  ? `Activée (${securityInfo.twoFactorMethod === 'app' ? 'Application' : securityInfo.twoFactorMethod === 'sms' ? 'SMS' : 'Email'})`
                  : "Désactivée - Activez cette option pour renforcer la sécurité de votre compte"}
              </p>
            </div>
            <button
              onClick={onShowTwoFactorSetup}
              disabled={processingAction}
              className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                securityInfo.twoFactorEnabled
                  ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-red-500'
                  : 'border-transparent text-black bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
              }`}
            >
              {securityInfo.twoFactorEnabled ? "Désactiver" : "Activer"}
            </button>
          </div>
        </div>

        {/* Recent logins section */}
        <div className="py-4 border-t border-gray-200">
          <h3 className="text-md font-medium text-gray-900 mb-4">Activité récente</h3>
          {securityInfo.loginHistory && securityInfo.loginHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appareil
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localisation
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {securityInfo.loginHistory.map((loginEntry, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(loginEntry.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {loginEntry.device || 'Inconnu'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {loginEntry.location || 'Inconnue'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          loginEntry.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {loginEntry.status === 'success' ? 'Réussi' : 'Échoué'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune activité récente à afficher</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityCard;