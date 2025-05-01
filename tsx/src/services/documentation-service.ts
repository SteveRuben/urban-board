// services/documentationService.ts
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import matter from 'gray-matter';
import { marked } from 'marked';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const DOCS_DIRECTORY = path.join(process.cwd(), 'documentation');

// Types definitions
interface SidebarItem {
  title: string;
  slug: string;
  children?: SidebarItem[];
}

interface SidebarCategory {
  category: string;
  items: SidebarItem[];
}

interface DocumentMetadata {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  order?: number;
  lastUpdated?: string;
  [key: string]: any; // Pour les métadonnées supplémentaires
}

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
  metadata: DocumentMetadata;
}

interface SearchResult {
  title: string;
  slug: string;
  excerpt: string;
  category?: string;
  relevance?: number;
}

/**
 * Récupère la structure de la barre latérale de documentation
 */
export const getDocumentationSidebar = async (): Promise<SidebarCategory[]> => {
  try {
    const sidebarPath = path.join(DOCS_DIRECTORY, 'sidebar.json');
    const sidebarContent = await readFile(sidebarPath, 'utf8');
    return JSON.parse(sidebarContent) as SidebarCategory[];
  } catch (error) {
    console.error('Erreur lors du chargement de la barre latérale:', error);
    return [];
  }
};

/**
 * Récupère un fichier de documentation par son slug
 * @param slug - Le slug du document à récupérer
 */
export const getDocumentationFile = async (slug?: string): Promise<DocumentContent | null> => {
  try {
    // Si aucun slug fourni, charger index.md
    const filePath = slug 
      ? path.join(DOCS_DIRECTORY, `${slug}.md`) 
      : path.join(DOCS_DIRECTORY, 'index.md');
    
    const fileContent = await readFile(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    
    const htmlContent = marked(content);
    
    return {
      metadata: data as DocumentMetadata,
      content: htmlContent,
      slug: slug || 'index'
    };
  } catch (error) {
    console.error(`Erreur lors du chargement du fichier de documentation (${slug}):`, error);
    return null;
  }
};

/**
 * Recherche dans les fichiers de documentation
 * @param query - La requête de recherche
 */
export const searchDocumentation = async (query: string): Promise<SearchResult[]> => {
  if (!query) return [];
  
  const results: SearchResult[] = [];
  
  // Fonction récursive pour explorer les dossiers
  const searchInDirectory = async (dirPath: string, relativePath: string = ''): Promise<void> => {
    try {
      const entries = await readdir(dirPath);
      
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        const entryStats = await stat(entryPath);
        
        if (entryStats.isDirectory()) {
          // Si c'est un dossier, explorer récursivement
          await searchInDirectory(entryPath, path.join(relativePath, entry));
        } else if (entry.endsWith('.md')) {
          // Si c'est un fichier Markdown, vérifier son contenu
          const content = await readFile(entryPath, 'utf8');
          const { data, content: markdownContent } = matter(content);
          
          const lowerQuery = query.toLowerCase();
          const lowerTitle = ((data.title as string) || '').toLowerCase();
          const lowerContent = markdownContent.toLowerCase();
          
          if (lowerTitle.includes(lowerQuery) || lowerContent.includes(lowerQuery)) {
            // Créer un slug relatif pour ce fichier
            const slug = path.join(
              relativePath, 
              entry === 'index.md' ? '' : entry.replace('.md', '')
            );
            
            // Préparer l'extrait en supprimant les caractères de formatation Markdown
            let excerpt = markdownContent
              .replace(/#+\s/g, '') // Supprimer les titres
              .replace(/\*\*/g, '') // Supprimer les gras
              .replace(/\*/g, '')   // Supprimer les italiques
              .replace(/`/g, '')    // Supprimer le code inline
              .trim()
              .substring(0, 150);
              
            if (markdownContent.length > 150) {
              excerpt += '...';
            }
            
            results.push({
              title: (data.title as string) || entry.replace('.md', ''),
              slug: slug,
              excerpt: excerpt,
              category: data.category as string | undefined
            });
          }
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la recherche dans le dossier ${dirPath}:`, error);
    }
  };
  
  await searchInDirectory(DOCS_DIRECTORY);
  return results;
};