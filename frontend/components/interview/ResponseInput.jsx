// frontend/components/interview/ResponseInput.jsx
import React, { useState, useEffect } from 'react';

const ResponseInput = ({ initialValue = '', onSubmit, disabled = false }) => {
  const [response, setResponse] = useState(initialValue);
  const [submitted, setSubmitted] = useState(false);

  // Mettre à jour la réponse lorsque initialValue change
  useEffect(() => {
    if (initialValue) {
      setResponse(initialValue);
    }
  }, [initialValue]);

  // Gérer la soumission de la réponse
  const handleSubmit = (e) => {
    e.preventDefault();
    if (response.trim() && !disabled) {
      onSubmit(response);
      setSubmitted(true);
    }
  };

  return (
    <div className="response-input">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows="6"
            placeholder="Écrivez votre réponse ici..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            disabled={disabled || submitted}
          ></textarea>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-gray-500 text-sm">
            {response.length > 0 ? (
              <span>{response.length} caractères</span>
            ) : null}
          </div>
          
          <div className="flex space-x-3">
            {submitted ? (
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                onClick={() => setSubmitted(false)}
              >
                Modifier
              </button>
            ) : (
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                onClick={() => setResponse('')}
                disabled={disabled}
              >
                Effacer
              </button>
            )}
            
            <button
              type="submit"
              className={`px-4 py-2 rounded-md ${
                disabled || submitted
                  ? 'bg-gray-400 text-black cursor-not-allowed'
                  : 'bg-primary-600 text-black hover:bg-primary-700'
              }`}
              disabled={disabled || submitted || !response.trim()}
            >
              {submitted ? 'Réponse soumise' : 'Soumettre la réponse'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ResponseInput;