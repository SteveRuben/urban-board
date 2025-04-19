// pages/api/documentation/sidebar.js
import { getDocumentationSidebar } from '@/services/documentationService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
  
  try {
    const sidebar = await getDocumentationSidebar();
    res.status(200).json(sidebar);
  } catch (error) {
    console.error('Erreur API sidebar:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// pages/api/documentation/content.js
import { getDocumentationFile } from '@/services/documentationService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
  
  try {
    const { slug } = req.query;
    const docContent = await getDocumentationFile(slug);
    
    if (!docContent) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }
    
    res.status(200).json(docContent);
  } catch (error) {
    console.error('Erreur API content:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// pages/api/documentation/search.js
import { searchDocumentation } from '@/services/documentationService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
  
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Requête de recherche trop courte' });
    }
    
    const results = await searchDocumentation(query);
    res.status(200).json(results);
  } catch (error) {
    console.error('Erreur API search:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}