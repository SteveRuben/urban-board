// frontend/components/interview/CVUpload.jsx
import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configuration pour react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const CVUpload = ({ onCVUploaded, onCVTextExtracted }) => {
  const [cvFile, setCVFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cvPreviewUrl, setCVPreviewUrl] = useState(null);
  
  const fileInputRef = useRef(null);
  
  // Gérer le chargement du PDF
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };
  
  // Navigation entre les pages
  const changePage = (offset) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.min(Math.max(1, newPageNumber), numPages);
    });
  };
  
  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);
  
  // Gérer le téléchargement du CV
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }
    
    // Vérifier que le fichier est un PDF
    if (file.type !== 'application/pdf') {
      setError("Veuillez télécharger un fichier PDF");
      setCVFile(null);
      setCVPreviewUrl(null);
      return;
    }
    
    setError(null);
    setCVFile(file);
    
    // Créer une URL pour la prévisualisation
    if (cvPreviewUrl) {
      URL.revokeObjectURL(cvPreviewUrl);
    }
    
    const newPreviewUrl = URL.createObjectURL(file);
    setCVPreviewUrl(newPreviewUrl);
    
    // Notifier le composant parent
    if (onCVUploaded) {
      onCVUploaded(file);
    }
  };
  
  // Nettoyer l'URL lors du démontage du composant
  React.useEffect(() => {
    return () => {
      if (cvPreviewUrl) {
        URL.revokeObjectURL(cvPreviewUrl);
      }
    };
  }, [cvPreviewUrl]);
  
  // Déclencher le clic sur l'input de fichier
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  return (
    <div className="cv-upload-container">
      {/* Zone de téléchargement */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${cvFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-300 hover:bg-primary-50'}`}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />
        
        {cvFile ? (
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-900">{cvFile.name}</p>
            <p className="text-xs text-gray-500 mt-1">Cliquez pour changer de fichier</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Déposez votre CV ici ou cliquez pour parcourir</p>
            <p className="text-xs text-gray-500 mt-1">Fichier PDF uniquement</p>
          </div>
        )}
      </div>
      
      {/* Message d'erreur */}
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {/* Prévisualisation du PDF */}
      {cvPreviewUrl && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Aperçu du CV</h3>
          <div className="border rounded-lg overflow-hidden bg-gray-100">
            <Document
              file={cvPreviewUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex justify-center items-center h-96">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              }
              error={
                <div className="flex justify-center items-center h-96 text-red-500">
                  Impossible de charger le PDF
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                width={500}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
            
            {/* Navigation entre les pages */}
            {numPages > 1 && (
              <div className="flex justify-between items-center p-2 bg-gray-200 border-t">
                <button
                  onClick={previousPage}
                  disabled={pageNumber <= 1}
                  className={`px-3 py-1 rounded ${
                    pageNumber <= 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Précédent
                </button>
                
                <p className="text-sm text-gray-600">
                  Page {pageNumber} sur {numPages}
                </p>
                
                <button
                  onClick={nextPage}
                  disabled={pageNumber >= numPages}
                  className={`px-3 py-1 rounded ${
                    pageNumber >= numPages 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CVUpload;