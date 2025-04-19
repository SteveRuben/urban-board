// services/documentationService.js
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import matter from 'gray-matter';
import { marked } from 'marked';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const DOCS_DIRECTORY = path.join(process.cwd(), 'documentation');

export const getDocumentationSidebar = async () => {
  try {
    const sidebarPath = path.join(DOCS_DIRECTORY, 'sidebar.json');
    const sidebarContent = await readFile(sidebarPath, 'utf8');
    return JSON.parse(sidebarContent);
  } catch (error) {
    console.error('Erreur lors du chargement de la barre latérale:', error);
    return [];
  }
};

export const getDocumentationFile = async (slug) => {
  try {
    // Si aucun slug fourni, charger index.md
    const filePath = slug 
      ? path.join(DOCS_DIRECTORY, `${slug}.md`) 
      : path.join(DOCS_DIRECTORY, 'index.md');
    
    const fileContent = await readFile(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    
    const htmlContent = marked(content);
    
    return {
      metadata: data,
      content: htmlContent,
      slug: slug || 'index'
    };
  } catch (error) {
    console.error(`Erreur lors du chargement du fichier de documentation (${slug}):`, error);
    return null;
  }
};

export const searchDocumentation = async (query) => {
  if (!query) return [];
  
  const results = [];
  
  // Fonction récursive pour explorer les dossiers
  const searchInDirectory = async (dirPath, relativePath = '') => {
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
        const lowerTitle = (data.title || '').toLowerCase();
        const lowerContent = markdownContent.toLowerCase();
        
        if (lowerTitle.includes(lowerQuery) || lowerContent.includes(lowerQuery)) {
          // Créer un slug relatif pour ce fichier
          const slug = path.join(
            relativePath, 
            entry === 'index.md' ? '' : entry.replace('.md', '')
          );
          
          results.push({
            title: data.title || entry.replace('.md', ''),
            slug: slug,
            excerpt: markdownContent.substring(0, 150) + '...'
          });
        }
      }
    }
  };
  
  await searchInDirectory(DOCS_DIRECTORY);
  return results;
};