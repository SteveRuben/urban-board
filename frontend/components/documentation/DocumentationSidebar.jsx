// components/documentation/DocumentationSidebar.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';

const DocumentationSidebar = ({ mobile = false }) => {
  const [sidebarData, setSidebarData] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const router = useRouter();
  
  useEffect(() => {
    const fetchSidebar = async () => {
      try {
        const res = await fetch('/api/documentation/sidebar');
        if (res.ok) {
          const data = await res.json();
          setSidebarData(data);
          
          // Développer automatiquement la section actuelle
          const currentPath = router.asPath;
          const currentSlug = currentPath.replace('/admin/documentation/', '');
          
          // Trouver la section qui contient l'élément actuel
          data.forEach((section) => {
            if (section.items && section.items.some(item => 
              currentSlug === item.slug || (item.items && item.items.some(subitem => currentSlug === subitem.slug))
            )) {
              setExpandedSections(prev => ({ ...prev, [section.title]: true }));
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la sidebar:', error);
      }
    };
    
    fetchSidebar();
  }, [router.asPath]);
  
  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };
  
  const isCurrentPage = (slug) => {
    const currentPath = router.asPath;
    return currentPath === `/admin/documentation/${slug}`;
  };
  
  const renderItems = (items) => {
    return items.map((item) => {
      if (item.items) {
        // Sous-section
        return (
          <div key={item.title} className="pl-4">
            <button
              onClick={() => toggleSection(item.title)}
              className="flex items-center py-2 text-sm text-gray-600 hover:text-gray-900 w-full text-left"
            >
              {expandedSections[item.title] ? (
                <ChevronDown className="h-4 w-4 mr-1" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1" />
              )}
              {item.title}
            </button>
            
            {expandedSections[item.title] && (
              <div className="pl-4 border-l border-gray-200">
                {renderItems(item.items)}
              </div>
            )}
          </div>
        );
      } else {
        // Élément simple
        return (
          <Link
            key={item.slug}
            href={`/admin/documentation/${item.slug}`}
            passHref
            legacyBehavior
          >
            <a className={`flex items-center py-2 text-sm ${
              isCurrentPage(item.slug) 
                ? 'text-primary-600 font-medium' 
                : 'text-gray-600 hover:text-gray-900'
            }`}>
              <FileText className="h-4 w-4 mr-2" />
              {item.title}
            </a>
          </Link>
        );
      }
    });
  };
  
  return (
    <nav className={`mt-5 ${mobile ? 'px-2' : 'px-4'} space-y-1`}>
      <Link href="/admin/documentation" passHref legacyBehavior>
        <a className={`flex items-center py-2 text-sm ${
          isCurrentPage('') 
            ? 'text-primary-600 font-medium' 
            : 'text-gray-600 hover:text-gray-900'
        }`}>
          <FileText className="h-4 w-4 mr-2" />
          Accueil
        </a>
      </Link>
      
      {sidebarData.map((section) => (
        <div key={section.title} className="space-y-1">
          <button
            onClick={() => toggleSection(section.title)}
            className="flex items-center py-2 text-sm font-medium text-gray-900 w-full text-left"
          >
            {expandedSections[section.title] ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            {section.title}
          </button>
          
          {expandedSections[section.title] && (
            <div className="pl-4 border-l border-gray-200">
              {renderItems(section.items)}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};

export default DocumentationSidebar;