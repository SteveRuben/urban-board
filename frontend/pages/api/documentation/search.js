// pages/api/documentation/search.js
import { searchDocumentation } from '../../../services/documentationService';

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