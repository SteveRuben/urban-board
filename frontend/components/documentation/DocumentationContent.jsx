// components/documentation/DocumentationContent.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Loader } from 'lucide-react';

const DocumentationContent = ({ slug }) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const router = useRouter();
  
  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/documentation/content?slug=${slug || ''}`);
        
        if (!res.ok) {
          throw new Error('Document non trouvé');
        }
        
        const data = await res.json();
        setDocument(data);
      } catch (error) {
        console.error('Erreur lors du chargement du document:', error);
        setError('Impossible de charger le document demandé.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [slug]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-600">Chargement de la documentation...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
        <h2 className="text-lg font-medium text-red-800 mb-2">Erreur</h2>
        <p className="text-red-600">{error}</p>
        <div className="mt-4">
          <Link href="/admin/documentation" passHref legacyBehavior>
            <a className="text-primary-600 hover:text-primary-800">
              Retour à l'accueil de la documentation
            </a>
          </Link>
        </div>
      </div>
    );
  }
  
  if (!document) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
        <h2 className="text-lg font-medium text-yellow-800 mb-2">Document introuvable</h2>
        <p className="text-yellow-600">Le document demandé n'existe pas.</p>
        <div className="mt-4">
          <Link href="/admin/documentation" passHref legacyBehavior>
            <a className="text-primary-600 hover:text-primary-800">
              Retour à l'accueil de la documentation
            </a>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="documentation-content">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{document.metadata.title}</h1>
      
      {document.metadata.description && (
        <p className="text-lg text-gray-600 mb-8">{document.metadata.description}</p>
      )}
      
      <div className="prose prose-primary max-w-none" dangerouslySetInnerHTML={{ __html: document.content }} />
      
      {document.metadata.lastUpdated && (
        <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500">
          Dernière mise à jour: {new Date(document.metadata.lastUpdated).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default DocumentationContent;