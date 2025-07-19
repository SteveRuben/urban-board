// pages/api/documentation/sidebar.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getDocumentationSidebar } from '@/services/documentation-service';

interface SidebarItem {
  title: string;
  slug: string;
  children?: SidebarItem[];
}

interface SidebarCategory {
  category: string;
  items: SidebarItem[];
}

type ApiResponse = {
  message: string;
} | SidebarCategory[];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
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