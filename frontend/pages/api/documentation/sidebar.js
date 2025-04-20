// pages/api/documentation/sidebar.js
import { getDocumentationSidebar } from '../../../services/documentationService';

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