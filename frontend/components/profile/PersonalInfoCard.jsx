// components/profile/PersonalInfoCard.jsx
import React, { useRef } from 'react';
import Image from 'next/image';

const PersonalInfoCard = ({
  personalInfo,
  editingPersonalInfo,
  processingAction,
  onPersonalInfoChange,
  onEditPersonalInfo,
  onCancelEditPersonalInfo,
  onSavePersonalInfo,
  onAvatarChange
}) => {
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onAvatarChange(e.target.files[0]);
    }
  };

  return (
    <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg leading-6 font-medium text-gray-900">Informations personnelles</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Vos informations de profil et de contact
          </p>
        </div>
        {!editingPersonalInfo ? (
          <button
            onClick={onEditPersonalInfo}
            disabled={processingAction}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Modifier
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={onCancelEditPersonalInfo}
              disabled={processingAction}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              onClick={onSavePersonalInfo}
              disabled={processingAction}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingAction ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Enregistrer
            </button>
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap md:flex-nowrap">
          {/* Avatar section */}
          <div className="w-full md:w-1/3 flex flex-col items-center justify-start mb-6 md:mb-0">
            <div className="relative w-32 h-32 rounded-full overflow-hidden">
              <Image
                src={personalInfo.avatarUrl || '/images/default-avatar.png'}
                alt="Photo de profil"
                layout="fill"
                objectFit="cover"
                className="cursor-pointer"
                onClick={editingPersonalInfo ? handleAvatarClick : undefined}
              />
              {editingPersonalInfo && (
                <div 
                  className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center cursor-pointer"
                  onClick={handleAvatarClick}
                >
                  <span className="text-black text-sm font-medium">Modifier</span>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            {editingPersonalInfo && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Cliquez sur l'image pour changer votre photo de profil
              </p>
            )}
          </div>

          {/* Information form */}
          <div className="w-full md:w-2/3 space-y-6">
            {editingPersonalInfo ? (
              // Form mode
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      Prénom
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={personalInfo.firstName}
                      onChange={onPersonalInfoChange}
                      autoComplete="given-name"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Nom
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={personalInfo.lastName}
                      onChange={onPersonalInfoChange}
                      autoComplete="family-name"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={personalInfo.email}
                    onChange={onPersonalInfoChange}
                    autoComplete="email"
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
                      Fonction
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      id="jobTitle"
                      value={personalInfo.jobTitle}
                      onChange={onPersonalInfoChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Entreprise
                    </label>
                    <input
                      type="text"
                      name="company"
                      id="company"
                      value={personalInfo.company}
                      onChange={onPersonalInfoChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={personalInfo.phone}
                    onChange={onPersonalInfoChange}
                    autoComplete="tel"
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </>
            ) : (
              // View mode
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Nom complet</dt>
                  <dd className="mt-1 text-sm text-gray-900">{`${personalInfo.firstName} ${personalInfo.lastName}`}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{personalInfo.email}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Fonction</dt>
                  <dd className="mt-1 text-sm text-gray-900">{personalInfo.jobTitle || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Entreprise</dt>
                  <dd className="mt-1 text-sm text-gray-900">{personalInfo.company || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{personalInfo.phone || '-'}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoCard;