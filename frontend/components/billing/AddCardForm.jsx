// frontend/components/billing/AddCardForm.jsx
import React from 'react';
import { ShieldCheck } from 'lucide-react';

const AddCardForm = ({
  newCard,
  processingAction,
  onCardInputChange,
  onSubmitNewCard,
  onCancel
}) => {
  return (
    <div className="px-4 py-5 sm:px-6">
      <h3 className="text-lg leading-6 font-medium text-gray-900">Ajouter une nouvelle carte</h3>
      <form onSubmit={onSubmitNewCard} className="mt-4 space-y-4">
        <div>
          <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700">
            Nom du titulaire
          </label>
          <input
            type="text"
            name="cardholderName"
            id="cardholderName"
            value={newCard.cardholderName}
            onChange={onCardInputChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
            Numéro de carte
          </label>
          <input
            type="text"
            name="cardNumber"
            id="cardNumber"
            value={newCard.cardNumber}
            onChange={onCardInputChange}
            required
            maxLength="16"
            pattern="[0-9]{16}"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="1234 5678 9012 3456"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700">
              Mois d'expiration
            </label>
            <select
              name="expiryMonth"
              id="expiryMonth"
              value={newCard.expiryMonth}
              onChange={onCardInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">MM</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                  {(i + 1).toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700">
              Année d'expiration
            </label>
            <select
              name="expiryYear"
              id="expiryYear"
              value={newCard.expiryYear}
              onChange={onCardInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">AAAA</option>
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="col-span-1">
            <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
              CVV
            </label>
            <input
              type="text"
              name="cvv"
              id="cvv"
              value={newCard.cvv}
              onChange={onCardInputChange}
              required
              maxLength="3"
              pattern="[0-9]{3}"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="123"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center">
          <ShieldCheck className="h-5 w-5 text-gray-400" />
          <p className="ml-2 text-xs text-gray-500">
            Vos données de paiement sont traitées de manière sécurisée. Nous ne stockons pas les détails de votre carte.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={processingAction}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={processingAction}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingAction ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>
                Traitement...
              </span>
            ) : (
              'Ajouter la carte'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCardForm;