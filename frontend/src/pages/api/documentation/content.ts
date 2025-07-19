// pages/api/documentation/content.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getDocumentationFile } from '@/services/documentation-service';

interface DocumentContent {
  title?: string;
  content: string | Promise<string>;
  slug: string;
  lastUpdated?: string;
  category?: string;
  tags?: string[];
  related?: {
    title: string;
    slug: string;
  }[];
}

type ApiResponse = {
  message: string;
} | DocumentContent;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
  
  try {
    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({ message: 'Paramètre slug manquant' });
    }
    
    const docSlug = Array.isArray(slug) ? slug[0] : slug;
    const docContent = await getDocumentationFile(docSlug);
    
    if (!docContent) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }
    
    res.status(200).json(docContent);
  } catch (error) {
    console.error('Erreur API content:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}