// pages/api/documentation/search.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { searchDocumentation } from '@/services/documentation-service';

interface SearchResult {
  title: string;
  excerpt: string;
  slug: string;
  category?: string;
  relevance?: number;
}

type ApiResponse = {
  message: string;
} | SearchResult[];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
  
  try {
    const { query } = req.query;
    
    if (!query || (typeof query === 'string' && query.length < 2)) {
      return res.status(400).json({ message: 'Requête de recherche trop courte' });
    }
    
    const searchQuery = Array.isArray(query) ? query[0] : query;
    const results = await searchDocumentation(searchQuery);
    res.status(200).json(results);
  } catch (error) {
    console.error('Erreur API search:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}