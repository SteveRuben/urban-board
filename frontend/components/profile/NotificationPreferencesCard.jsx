// components/profile/NotificationPreferencesCard.jsx
import React from 'react';

const NotificationCategory = ({ title, description, preferences, category, onNotificationPreferenceChange, processingAction }) => {
  return (
    <div className="mb-6">
      <h3 className="text-md font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 mb-3">{description}</p>
      
      <div className="space-y-4">
        {Object.entries(preferences[category]).map(([type, enabled]) => {
          // Convertir le camelCase en texte lisible
          const label = type
            .replace(/([A-Z])/g, ' $1') // ajoute un espace avant chaque lettre majuscule
            .replace(/^./, (str) => str.toUpperCase()) // majuscule première lettre
            .replace('New Messages', 'Nouveaux messages')
            .replace('Interview Reminders', 'Rappels d\'entretien')
            .replace('Weekly Reports', 'Rapports hebdomadaires')
            .replace('Marketing Emails', 'Emails marketing')
            .replace('Candidate Updates', 'Mises à jour des candidats')
            .replace('Team Notifications', 'Notifications d\'équipe');
          
          return (
            <div key={type} className="flex items-center">
              <div className="flex items-center h-5">
                <input
                  id={`${category}-${type}`}
                  name={`${category}-${type}`}
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => onNotificationPreferenceChange(category, type, e.target.checked)}
                  disabled={processingAction}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor={`${category}-${type}`} className="font-medium text-gray-700">
                  {label}
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const NotificationPreferencesCard = ({
  notificationPreferences,
  processingAction,
  onNotificationPreferenceChange,
  onSaveNotificationPreferences
}) => {
  return (
    <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg leading-6 font-medium text-gray-900">Préférences de notification</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Personnalisez les notifications que vous recevez
          </p>
        </div>
        <button
          onClick={onSaveNotificationPreferences}
          disabled={processingAction}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processingAction ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          Enregistrer les préférences
        </button>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Email notifications */}
          <NotificationCategory
            title="Notifications par email"
            description="Paramétrez les emails que vous recevez"
            preferences={notificationPreferences}
            category="email"
            onNotificationPreferenceChange={onNotificationPreferenceChange}
            processingAction={processingAction}
          />
          
          {/* Push notifications */}
          <NotificationCategory
            title="Notifications push"
            description="Paramétrez les notifications push que vous recevez sur votre téléphone"
            preferences={notificationPreferences}
            category="push"
            onNotificationPreferenceChange={onNotificationPreferenceChange}
            processingAction={processingAction}
          />
          
          {/* Desktop notifications */}
          <NotificationCategory
            title="Notifications de bureau"
            description="Paramétrez les notifications que vous recevez sur votre ordinateur"
            preferences={notificationPreferences}
            category="desktop"
            onNotificationPreferenceChange={onNotificationPreferenceChange}
            processingAction={processingAction}
          />
        </div>
        
        <div className="mt-8 pt-5 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onSaveNotificationPreferences}
              disabled={processingAction}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingAction ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Enregistrer les préférences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesCard;