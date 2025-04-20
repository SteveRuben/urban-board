// pages/api/documentation/content.js
import { getDocumentationFile } from '../../../services/documentationService';

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
