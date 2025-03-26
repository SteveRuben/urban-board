// components/interview/CVUpload.jsx
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { File, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import aiInterviewService from '../../services/ai-interview-service';

/**
 * Composant pour le téléchargement et l'analyse du CV
 */
const CVUpload = ({ onCVUploaded, onAnalysisComplete }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploadStatus, setUploadStatus] = useState('initial'); // 'initial', 'uploading', 'success', 'error'
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  
  // Déclencher le dialogue de sélection de fichier
  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  // Gérer le changement de fichier
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Vérifier le type de fichier
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Format de fichier non supporté. Veuillez choisir un fichier PDF, DOC ou DOCX.');
        setUploadStatus('error');
        return;
      }
      
      // Vérifier la taille du fichier (max 10Mo)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Le fichier est trop volumineux. La taille maximale est de 10Mo.');
        setUploadStatus('error');
        return;
      }
      
      // Réinitialiser les états
      setError(null);
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setUploadStatus('success');
      setAnalysisComplete(false);
      setAnalysisResult(null);
      
      // Notifier le parent
      if (onCVUploaded) {
        onCVUploaded(selectedFile);
      }
    }
  };
  
  // Supprimer le fichier
  const handleRemoveFile = () => {
    setFile(null);
    setFileName('');
    setUploadStatus('initial');
    setAnalysisComplete(false);
    setAnalysisResult(null);
    setError(null);
    
    // Réinitialiser l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Notifier le parent
    if (onCVUploaded) {
      onCVUploaded(null);
    }
  };
  
  // Analyser le CV téléchargé
  const handleAnalyzeCV = async () => {
    if (!file) return;
    
    try {
      setAnalyzing(true);
      setError(null);
      
      // Appeler le service d'analyse
      const result = await aiInterviewService.analyzeCV(file);
      
      setAnalysisResult(result);
      setAnalysisComplete(true);
      setAnalyzing(false);
      
      // Notifier le parent
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      console.error('Erreur lors de l\'analyse du CV:', err);
      setError('Impossible d\'analyser le CV. Veuillez réessayer.');
      setAnalyzing(false);
    }
  };
  
  return (
    <div className="cv-upload">
      {/* Zone de téléchargement */}
      {uploadStatus === 'initial' && (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={handleBrowseClick}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-2">
            <p className="text-gray-600">
              Glissez-déposez votre CV ici ou&nbsp;
              <span className="text-primary-600 font-medium">parcourir</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOC ou DOCX (max. 10Mo)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
          />
        </div>
      )}
      
      {/* Fichier téléchargé avec succès */}
      {uploadStatus === 'success' && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <File className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-700">{fileName}</h3>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} Mo
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 flex">
              {!analysisComplete && !analyzing && (
                <button
                  onClick={handleAnalyzeCV}
                  className="mr-2 p-1.5 bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100"
                  title="Analyser le CV"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleRemoveFile}
                className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                title="Supprimer le fichier"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Indicateur d'analyse en cours */}
          {analyzing && (
            <div className="mt-3">
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Analyse du CV en cours...</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                <div className="bg-primary-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                L'IA extrait les informations pertinentes, cela peut prendre quelques instants.
              </p>
            </div>
          )}
          
          {/* Résultat de l'analyse */}
          {analysisComplete && analysisResult && (
            <div className="mt-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-600">Analyse terminée</span>
              </div>
              
              {/* Résumé des compétences extraites */}
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <h4 className="text-xs font-semibold uppercase text-gray-600 mb-2">Compétences détectées</h4>
                <div className="flex flex-wrap gap-1">
                  {analysisResult.skills?.slice(0, 8).map((skill, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                  {analysisResult.skills?.length > 8 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      +{analysisResult.skills.length - 8} autres
                    </span>
                  )}
                </div>
                
                {/* Expérience */}
                {analysisResult.experience_years && (
                  <div className="mt-2">
                    <h4 className="text-xs font-semibold uppercase text-gray-600 mb-1">Expérience</h4>
                    <p className="text-sm">{analysisResult.experience_years} ans</p>
                  </div>
                )}
                
                {/* Formation */}
                {analysisResult.education && (
                  <div className="mt-2">
                    <h4 className="text-xs font-semibold uppercase text-gray-600 mb-1">Formation</h4>
                    <p className="text-sm">{analysisResult.education}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

CVUpload.propTypes = {
  onCVUploaded: PropTypes.func,
  onAnalysisComplete: PropTypes.func
};

export default CVUpload;