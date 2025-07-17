// components/ContentEditors.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Database, BarChart3, FileText, CheckCircle, XCircle, 
  Eye,
  Square,
  Circle,
  Type,
  Monitor,
  User,
  Layout,
  Undo,
  Redo,
  MousePointer,
  ArrowRight,
  Edit3,
  Copy,
  Trash2,
  ZoomOut,
  ZoomIn,

  Layers,
  Settings,
  Plus,
  Diamond,
  Sun,
  Moon,
  DollarSign,
  Calculator,
  SpellCheck,
  Bold,
  Italic,
  Underline,
  Quote,
  Link,
  ListOrdered,
  List,
  AlignLeft,
  AlignRight,
  AlignCenter,
  FileSpreadsheet} from 'lucide-react';
import dynamic from 'next/dynamic';
import { 
  ExecutionEnvironment, 
  ExtendedSubmissionData, 
  ExtendedExecutionResult,
  ProgrammingLanguage, 
  DiagramType,
  DiagramFormat,  
  FinancialDocumentType, 
  DocumentFormat
} from '@/types/coding-plateform';
import CodingPlatformService from '@/services/coding-platform-service';

// Import Monaco Editor dynamiquement
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">Chargement de l'éditeur...</p>
      </div>
    </div>
  ),
});

// Fonction helper pour mapper les langages vers Monaco
const getMonacoLanguage = (platformLanguage: string): string => {
  const languageMap: { [key: string]: string } = {
    python: "python",
    javascript: "javascript",
    java: "java",
    cpp: "cpp",
    c: "c",
    typescript: "typescript",
    sql: "sql",
    html: "html",
    css: "css",
  }

  return languageMap[platformLanguage?.toLowerCase()] || "python"
}

// =============================================================================
// ÉDITEUR DE CODE AVEC MONACO - VERSION SIMPLIFIÉE
// =============================================================================

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  onCodeChange?: (code: string) => void;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({ 
  initialCode = '', 
  language = 'python',
  onCodeChange, 
  readOnly = false,
  height = "400px"
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);

  // Mettre à jour le code quand initialCode change
  useEffect(() => {
    if (initialCode !== code) {
      setCode(initialCode);
    }
  }, [initialCode]);

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Monaco Editor - Prend toute la hauteur disponible */}
      <div className="flex-1" style={{ height }}>
        <MonacoEditor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: "on",
            folding: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: "on",
            quickSuggestions: true,
            parameterHints: { enabled: true },
            autoIndent: "full",
            formatOnPaste: true,
            formatOnType: true,
            renderLineHighlight: "all",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            padding: { top: 16, bottom: 16 },
            readOnly: readOnly,
          }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// ÉDITEUR DE TEXTE PROFESSIONNEL (Secrétaires)
// =============================================================================

  interface TextEditorProps {
    initialDocument?: any;
    documentFormat?: DocumentFormat;
    onDocumentChange?: (document: any) => void;
    readOnly?: boolean;
  }

  export function TextEditor({ 
    initialDocument, 
    documentFormat = 'word',
    onDocumentChange, 
    readOnly = false 
  }: TextEditorProps) {
    const [document, setDocument] = useState(initialDocument || {
      title: '',
      content: '',
      format: documentFormat,
      metadata: {
        created: new Date().toISOString(),
        author: '',
        language: 'fr'
      }
    });

    const [showFormatting, setShowFormatting] = useState(true);

    const handleDocumentChange = (field: string, value: any) => {
      const newDocument = { ...document, [field]: value };
      setDocument(newDocument);
      onDocumentChange?.(newDocument);
    };

    const formatText = (command: string) => {
      document.execCommand(command, false);
    };

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-pink-600 border-b border-pink-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-white" />
            <span className="font-medium text-white">Éditeur de Document</span>
            <span className="px-2 py-1 bg-white/20 rounded text-sm text-white">
              {documentFormat?.toUpperCase()}
            </span>
          </div>
          
          <button
            onClick={() => setShowFormatting(!showFormatting)}
            className="p-1 bg-white/20 hover:bg-white/30 rounded text-white"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Barre d'outils de formatage */}
        {showFormatting && !readOnly && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 flex-wrap">
            <button onClick={() => formatText('bold')} className="p-1 rounded hover:bg-gray-200" title="Gras">
              <Bold className="h-4 w-4" />
            </button>
            <button onClick={() => formatText('italic')} className="p-1 rounded hover:bg-gray-200" title="Italique">
              <Italic className="h-4 w-4" />
            </button>
            <button onClick={() => formatText('underline')} className="p-1 rounded hover:bg-gray-200" title="Souligné">
              <Underline className="h-4 w-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            
            <button onClick={() => formatText('justifyLeft')} className="p-1 rounded hover:bg-gray-200" title="Aligner à gauche">
              <AlignLeft className="h-4 w-4" />
            </button>
            <button onClick={() => formatText('justifyCenter')} className="p-1 rounded hover:bg-gray-200" title="Centrer">
              <AlignCenter className="h-4 w-4" />
            </button>
            <button onClick={() => formatText('justifyRight')} className="p-1 rounded hover:bg-gray-200" title="Aligner à droite">
              <AlignRight className="h-4 w-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            
            <button onClick={() => formatText('insertUnorderedList')} className="p-1 rounded hover:bg-gray-200" title="Liste à puces">
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => formatText('insertOrderedList')} className="p-1 rounded hover:bg-gray-200" title="Liste numérotée">
              <ListOrdered className="h-4 w-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            
            <button className="p-1 rounded hover:bg-gray-200" title="Vérification orthographique">
              <SpellCheck className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Métadonnées du document */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre du document</label>
            <input
              type="text"
              value={document.title}
              onChange={(e) => handleDocumentChange('title', e.target.value)}
              readOnly={readOnly}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
              placeholder="Titre du document"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auteur</label>
            <input
              type="text"
              value={document.metadata?.author || ''}
              onChange={(e) => handleDocumentChange('metadata', { ...document.metadata, author: e.target.value })}
              readOnly={readOnly}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
              placeholder="Nom de l'auteur"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={document.format}
              onChange={(e) => handleDocumentChange('format', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
            >
              <option value="word">Word (.docx)</option>
              <option value="pdf">PDF</option>
              <option value="plain_text">Texte brut</option>
              <option value="html">HTML</option>
              <option value="markdown">Markdown</option>
              <option value="rtf">RTF</option>
            </select>
          </div>
        </div>

        {/* Éditeur de contenu */}
        <div className="flex-1">
          <div className="h-full">
            <textarea
              value={document.content}
              onChange={(e) => handleDocumentChange('content', e.target.value)}
              readOnly={readOnly}
              className="w-full h-full p-4 border-0 focus:outline-none resize-none text-gray-900 leading-relaxed"
              placeholder="Rédigez votre document ici..."
              style={{ fontSize: '14px', lineHeight: '1.6' }}
            />
          </div>
        </div>

        {/* Statistiques du document */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span>Mots: {document.content?.split(/\s+/).filter(word => word.length > 0).length || 0}</span>
            <span>Caractères: {document.content?.length || 0}</span>
            <span>Paragraphes: {document.content?.split('\n\n').length || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Sauvegarde automatique</span>
          </div>
        </div>
      </div>
    );
  }

// =============================================================================
// ÉDITEUR DE TABLEUR PROFESSIONNEL (Comptables)
// =============================================================================

  interface SpreadsheetEditorProps {
    initialSpreadsheet?: any;
    financialDocumentType?: FinancialDocumentType;
    onSpreadsheetChange?: (spreadsheet: any) => void;
    readOnly?: boolean;
  }

  export function SpreadsheetEditor({ 
    initialSpreadsheet, 
    financialDocumentType = 'balance_sheet',
    onSpreadsheetChange, 
    readOnly = false 
  }: SpreadsheetEditorProps) {
    const [spreadsheet, setSpreadsheet] = useState(initialSpreadsheet || {
      type: financialDocumentType,
      title: '',
      sheets: [{
        name: 'Feuille1',
        data: Array(20).fill(null).map(() => Array(10).fill('')),
        formulas: {},
        formatting: {}
      }],
      metadata: {
        created: new Date().toISOString(),
        currency: 'EUR',
        fiscalYear: new Date().getFullYear()
      }
    });

    const [activeSheet, setActiveSheet] = useState(0);
    const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
    const [formula, setFormula] = useState('');
    const [showCalculator, setShowCalculator] = useState(false);

    const updateCell = (row: number, col: number, value: string) => {
      const newSpreadsheet = { ...spreadsheet };
      newSpreadsheet.sheets[activeSheet].data[row][col] = value;
      setSpreadsheet(newSpreadsheet);
      onSpreadsheetChange?.(newSpreadsheet);
    };

    const getColumnLabel = (col: number) => {
      let label = '';
      while (col >= 0) {
        label = String.fromCharCode(65 + (col % 26)) + label;
        col = Math.floor(col / 26) - 1;
      }
      return label;
    };

    const addFormula = (formula: string) => {
      const { row, col } = selectedCell;
      const newSpreadsheet = { ...spreadsheet };
      newSpreadsheet.sheets[activeSheet].formulas[`${row}-${col}`] = formula;
      setSpreadsheet(newSpreadsheet);
      onSpreadsheetChange?.(newSpreadsheet);
    };

    const getFinancialTemplates = () => {
      const templates = {
        balance_sheet: {
          headers: ['Actif', 'Montant', '', 'Passif', 'Montant'],
          rows: [
            ['ACTIF IMMOBILISE', '', '', 'CAPITAUX PROPRES', ''],
            ['Immobilisations incorporelles', '0', '', 'Capital', '0'],
            ['Immobilisations corporelles', '0', '', 'Réserves', '0'],
            ['Immobilisations financières', '0', '', 'Résultat', '0'],
            ['', '', '', '', ''],
            ['ACTIF CIRCULANT', '', '', 'DETTES', ''],
            ['Stocks', '0', '', 'Dettes financières', '0'],
            ['Créances clients', '0', '', 'Dettes fournisseurs', '0'],
            ['Trésorerie', '0', '', 'Autres dettes', '0']
          ]
        },
        income_statement: {
          headers: ['Compte de résultat', 'N', 'N-1', 'Variation', '%'],
          rows: [
            ['CHIFFRE D\'AFFAIRES', '0', '0', '=B2-C2', '=(B2-C2)/C2'],
            ['Achats', '0', '0', '=B3-C3', '=(B3-C3)/C3'],
            ['Charges externes', '0', '0', '=B4-C4', '=(B4-C4)/C4'],
            ['Charges de personnel', '0', '0', '=B5-C5', '=(B5-C5)/C5'],
            ['', '', '', '', ''],
            ['RESULTAT OPERATIONNEL', '=B2-B3-B4-B5', '=C2-C3-C4-C5', '=B7-C7', '=(B7-C7)/C7']
          ]
        }
      };
      return templates[financialDocumentType] || templates.balance_sheet;
    };

    const loadTemplate = () => {
      const template = getFinancialTemplates();
      const newSpreadsheet = { ...spreadsheet };
      const sheet = newSpreadsheet.sheets?.[activeSheet];
      
      // Charger les en-têtes
      template.headers.forEach((header, col) => {
        sheet.data[0][col] = header;
      });
      
      // Charger les lignes
      template.rows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          sheet.data[rowIndex + 1][colIndex] = cell;
          if (cell.startsWith('=')) {
            sheet.formulas[`${rowIndex + 1}-${colIndex}`] = cell;
          }
        });
      });
      
      setSpreadsheet(newSpreadsheet);
      onSpreadsheetChange?.(newSpreadsheet);
    };

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-amber-600 border-b border-amber-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-white" />
            <span className="font-medium text-white">Tableur Comptable</span>
            <span className="px-2 py-1 bg-white/20 rounded text-sm text-white">
              { financialDocumentType}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadTemplate}
              disabled={readOnly}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-sm"
            >
              Template
            </button>
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="p-1 bg-white/20 hover:bg-white/30 rounded text-white"
            >
              <Calculator className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Barre d'outils */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Cellule:</label>
            <span className="font-mono text-sm bg-white px-2 py-1 border rounded">
              {getColumnLabel(selectedCell.col)}{selectedCell.row + 1}
            </span>
          </div>
          
          <div className="flex items-center gap-2 flex-1">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  updateCell(selectedCell.row, selectedCell.col, formula);
                  setFormula('');
                }
              }}
              readOnly={readOnly}
              placeholder="=SOMME(A1:A10) ou valeur..."
              className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Devise:</span>
            <select
              value={spreadsheet.metadata?.currency || 'EUR'}
              onChange={(e) => setSpreadsheet(prev => ({
                ...prev,
                metadata: { ...prev.metadata, currency: e.target.value }
              }))}
              disabled={readOnly}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>

        {/* Grille de tableur */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600"></th>
                {Array.from({ length: 10 }, (_, col) => (
                  <th key={col} className="min-w-24 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600">
                    {getColumnLabel(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spreadsheet?.sheets?.[activeSheet]?.data.map((row: string[], rowIndex: number) => (
                <tr key={rowIndex}>
                  <td className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600 text-center">
                    {rowIndex + 1}
                  </td>
                  {row.slice(0, 10).map((cell: string, colIndex: number) => (
                    <td
                      key={colIndex}
                      className={`min-w-24 h-8 border border-gray-300 cursor-pointer ${
                        selectedCell.row === rowIndex && selectedCell.col === colIndex
                          ? 'bg-blue-100 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                    >
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        readOnly={readOnly}
                        className="w-full h-full px-1 text-xs border-0 bg-transparent focus:outline-none"
                        style={{ 
                          textAlign: /^[0-9\-\.,]+$/.test(cell) ? 'right' : 'left',
                          fontWeight: cell.startsWith('=') ? 'bold' : 'normal'
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Onglets des feuilles */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            {spreadsheet.sheets?.map((sheet: any, index: number) => (
              <button
                key={index}
                onClick={() => setActiveSheet(index)}
                className={`px-3 py-1 rounded ${
                  activeSheet === index ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {sheet.name}
              </button>
            ))}
          </div>
          
          <div className="text-gray-600">
            Année fiscale: {spreadsheet.metadata?.fiscalYear || new Date().getFullYear()}
          </div>
        </div>
      </div>
    );
  }

// =============================================================================
// ÉDITEUR SQL
// =============================================================================

interface SQLEditorProps {
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
  readOnly?: boolean;
  datasets?: Array<{ name: string; description?: string }>;
}

export function SQLEditor({ 
  initialQuery = '', 
  onQueryChange, 
  readOnly = false,
  datasets = []
}: SQLEditorProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleQueryChange = (value: string | undefined) => {
    const newQuery = value || '';
    setQuery(newQuery);
    onQueryChange?.(newQuery);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-emerald-600 border-b border-emerald-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center">
          <Database className="h-5 w-5 text-white mr-2" />
          <span className="font-medium text-white">Éditeur SQL</span>
        </div>
        
        {datasets.length > 0 && (
          <div className="text-sm text-emerald-100">
            Datasets: {datasets.map(d => d.name).join(', ')}
          </div>
        )}
      </div>

      {/* Monaco Editor pour SQL */}
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language="sql"
          value={query}
          onChange={handleQueryChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            folding: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            readOnly: readOnly,
            padding: { top: 16, bottom: 16 },
          }}
        />
      </div>

      {/* Info */}
      {!readOnly && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="text-sm text-gray-600">
            💡 Conseils: Utilisez SELECT uniquement. Les requêtes sont limitées à 30 secondes.
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ÉDITEUR DE VISUALISATION
// =============================================================================

interface VisualizationEditorProps {
  initialData?: any;
  onDataChange?: (data: any) => void;
  readOnly?: boolean;
}

export function VisualizationEditor({ 
  initialData, 
  onDataChange, 
  readOnly = false 
}: VisualizationEditorProps) {
  const [vizData, setVizData] = useState(initialData || {
    type: 'bar_chart',
    data: [],
    axes: { x: '', y: '' },
    title: ''
  });

  const handleDataChange = (field: string, value: any) => {
    const newData = { ...vizData, [field]: value };
    setVizData(newData);
    onDataChange?.(newData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-purple-600 border-b border-purple-700 flex items-center flex-shrink-0">
        <BarChart3 className="h-5 w-5 text-white mr-2" />
        <span className="font-medium text-white">Éditeur de visualisation</span>
      </div>

      {/* Configuration */}
      <div className="p-4 space-y-4 flex-shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de graphique
            </label>
            <select
              value={vizData.type}
              onChange={(e) => handleDataChange('type', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            >
              <option value="bar_chart">Graphique en barres</option>
              <option value="line_chart">Graphique linéaire</option>
              <option value="scatter_plot">Nuage de points</option>
              <option value="pie_chart">Graphique circulaire</option>
              <option value="histogram">Histogramme</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre
            </label>
            <input
              type="text"
              value={vizData.title}
              onChange={(e) => handleDataChange('title', e.target.value)}
              readOnly={readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              placeholder="Titre du graphique"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Axe X
            </label>
            <input
              type="text"
              value={vizData.axes?.x || ''}
              onChange={(e) => handleDataChange('axes', { ...vizData.axes, x: e.target.value })}
              readOnly={readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              placeholder="Nom de la colonne X"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Axe Y
            </label>
            <input
              type="text"
              value={vizData.axes?.y || ''}
              onChange={(e) => handleDataChange('axes', { ...vizData.axes, y: e.target.value })}
              readOnly={readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              placeholder="Nom de la colonne Y"
            />
          </div>
        </div>
      </div>

      {/* Monaco Editor pour les données JSON */}
      <div className="flex-1 border-t border-gray-200">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700">
            Données (JSON)
          </label>
        </div>
        <div className="h-full">
          <MonacoEditor
            height="100%"
            language="json"
            value={JSON.stringify(vizData.data, null, 2)}
            onChange={(value) => {
              try {
                const parsed = JSON.parse(value || '[]');
                handleDataChange('data', parsed);
              } catch (err) {
                // Ignore invalid JSON during typing
              }
            }}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              readOnly: readOnly,
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ÉDITEUR DE NOTEBOOK
// =============================================================================

interface NotebookEditorProps {
  initialNotebook?: any;
  onNotebookChange?: (notebook: any) => void;
  readOnly?: boolean;
}

export function NotebookEditor({ 
  initialNotebook, 
  onNotebookChange, 
  readOnly = false 
}: NotebookEditorProps) {
  const [notebook, setNotebook] = useState(initialNotebook || {
    cells: [
      {
        cell_type: 'code',
        source: ['# Votre code Python ici\nimport pandas as pd\nimport numpy as np\n'],
        outputs: []
      }
    ]
  });

  const addCell = () => {
    const newNotebook = {
      ...notebook,
      cells: [
        ...notebook.cells,
        {
          cell_type: 'code',
          source: [''],
          outputs: []
        }
      ]
    };
    setNotebook(newNotebook);
    onNotebookChange?.(newNotebook);
  };

  const updateCell = (index: number, source: string) => {
    const newNotebook = {
      ...notebook,
      cells: notebook.cells.map((cell: any, i: number) => 
        i === index ? { ...cell, source: [source] } : cell
      )
    };
    setNotebook(newNotebook);
    onNotebookChange?.(newNotebook);
  };

  const removeCell = (index: number) => {
    const newNotebook = {
      ...notebook,
      cells: notebook.cells.filter((_: any, i: number) => i !== index)
    };
    setNotebook(newNotebook);
    onNotebookChange?.(newNotebook);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-orange-600 border-b border-orange-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-white mr-2" />
          <span className="font-medium text-white">Notebook Jupyter</span>
        </div>
        
        {!readOnly && (
          <button
            onClick={addCell}
            className="inline-flex items-center px-3 py-1 text-sm bg-white/20 text-white rounded-md hover:bg-white/30"
          >
            + Cellule
          </button>
        )}
      </div>

      {/* Cells */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {notebook.cells.map((cell: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Cellule {index + 1} ({cell.cell_type})
              </span>
              {!readOnly && notebook.cells.length > 1 && (
                <button
                  onClick={() => removeCell(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Supprimer
                </button>
              )}
            </div>
            <div className="h-32">
              <MonacoEditor
                height="100%"
                language="python"
                value={Array.isArray(cell.source) ? cell.source.join('') : cell.source}
                onChange={(value) => updateCell(index, value || '')}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  readOnly: readOnly,
                  padding: { top: 8, bottom: 8 },
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// COMPOSANT DE RÉSULTATS D'EXÉCUTION
// =============================================================================

interface ExecutionResultsProps {
  results: {
    execution_results?: ExtendedExecutionResult[];
    summary?: {
      passed: number;
      total: number;
      success_rate: number;
      all_passed: boolean;
    };
    note?: string;
  };
}

function ExecutionResults({ results }: ExecutionResultsProps) {
  const { execution_results = [], summary, note } = results;

  return (
    <div className="space-y-4">
      {/* Summary */}
      {summary && (
        <div className={`p-4 rounded-lg ${
          summary.all_passed ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            {summary.all_passed ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-yellow-600 mr-2" />
            )}
            <span className={`font-medium ${
              summary.all_passed ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {summary.passed}/{summary.total} tests réussis ({summary.success_rate}%)
            </span>
          </div>
          {note && (
            <p className={`mt-1 text-sm ${
              summary.all_passed ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {note}
            </p>
          )}
        </div>
      )}

      {/* Individual Results */}
      {execution_results.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Détails des tests</h4>
          {execution_results.map((result, index) => (
            <div
              key={result.testcase_id || index}
              className={`p-3 rounded-lg border ${
                result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {result.passed ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  )}
                  <span className={`text-sm font-medium ${
                    result.passed ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Test {index + 1} - {result.testcase_type}
                  </span>
                </div>
                {result.execution_time && (
                  <span className="text-xs text-gray-500">
                    {result.execution_time}ms
                  </span>
                )}
              </div>
              
              {/* Result Details */}
              {result.result_rows !== undefined && (
                <p className="text-sm text-gray-600 mt-1">
                  {result.result_rows} lignes retournées
                </p>
              )}
              
              {result.data_points !== undefined && (
                <p className="text-sm text-gray-600 mt-1">
                  {result.data_points} points de données
                </p>
              )}
              
              {result.error && (
                <p className="text-sm text-red-600 mt-1">
                  Erreur: {result.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ÉDITEUR DE DIAGRAMMES PROFESSIONNEL - VERSION AMÉLIORÉE
// =============================================================================

// Interfaces pour le diagramme
interface DiagramElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  text: string;
  style: {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    borderWidth: number;
    borderStyle: 'solid' | 'dashed' | 'dotted';
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    opacity: number;
    shadow: boolean;
  };
  properties?: Record<string, any>;
  locked?: boolean;
  visible?: boolean;
  layer?: string;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  type: string;
  label?: string;
  style: {
    strokeColor: string;
    strokeWidth: number;
    strokeStyle: 'solid' | 'dashed' | 'dotted';
    arrowStart?: string;
    arrowEnd?: string;
  };
  points?: { x: number; y: number }[];
}

interface DiagramData {
  type: string;
  format: string;
  elements: DiagramElement[];
  connections: Connection[];
  metadata: {
    timestamp: string;
    version: string;
    tool: string;
  };
}

// Configuration des outils selon le type de diagramme
const DIAGRAM_TOOLS = {
  uml_use_case: [
    { id: 'actor', name: 'Acteur', icon: User, color: '#3b82f6', shape: 'stick' },
    { id: 'usecase', name: 'Cas d\'usage', icon: Circle, color: '#10b981', shape: 'oval' },
    { id: 'system', name: 'Système', icon: Square, color: '#8b5cf6', shape: 'rect' },
    { id: 'note', name: 'Note', icon: Type, color: '#f59e0b', shape: 'note' }
  ],
  uml_sequence: [
    { id: 'lifeline', name: 'Objet', icon: User, color: '#3b82f6', shape: 'rect' },
    { id: 'activation', name: 'Activation', icon: Square, color: '#f59e0b', shape: 'rect' },
    { id: 'note', name: 'Note', icon: Type, color: '#6b7280', shape: 'note' }
  ],
  uml_class: [
    { id: 'class', name: 'Classe', icon: Square, color: '#3b82f6', shape: 'class' },
    { id: 'interface', name: 'Interface', icon: Circle, color: '#10b981', shape: 'interface' },
    { id: 'package', name: 'Package', icon: Database, color: '#8b5cf6', shape: 'package' }
  ],
  flowchart: [
    { id: 'start', name: 'Début/Fin', icon: Circle, color: '#10b981', shape: 'oval' },
    { id: 'process', name: 'Processus', icon: Square, color: '#3b82f6', shape: 'rect' },
    { id: 'decision', name: 'Décision', icon: Diamond, color: '#f59e0b', shape: 'diamond' },
    { id: 'data', name: 'Données', icon: Database, color: '#8b5cf6', shape: 'parallelogram' }
  ],
  wireframe: [
    { id: 'container', name: 'Conteneur', icon: Square, color: '#6b7280', shape: 'rect' },
    { id: 'button', name: 'Bouton', icon: Square, color: '#3b82f6', shape: 'button' },
    { id: 'text', name: 'Texte', icon: Type, color: '#374151', shape: 'text' },
    { id: 'image', name: 'Image', icon: Monitor, color: '#8b5cf6', shape: 'image' },
    { id: 'input', name: 'Champ', icon: Square, color: '#10b981', shape: 'input' }
  ]
};

const CONNECTION_TYPES = {
  uml_use_case: [
    { id: 'association', name: 'Association', style: 'solid' },
    { id: 'include', name: 'Include', style: 'dashed' },
    { id: 'extend', name: 'Extend', style: 'dashed' }
  ],
  uml_sequence: [
    { id: 'message', name: 'Message', style: 'solid' },
    { id: 'return', name: 'Retour', style: 'dashed' }
  ],
  uml_class: [
    { id: 'association', name: 'Association', style: 'solid' },
    { id: 'inheritance', name: 'Héritage', style: 'solid' },
    { id: 'composition', name: 'Composition', style: 'solid' }
  ],
  flowchart: [
    { id: 'flow', name: 'Flux', style: 'solid' }
  ],
  wireframe: [
    { id: 'link', name: 'Lien', style: 'dashed' }
  ]
};

// Templates prédéfinis
const PREDEFINED_TEMPLATES = [
  {
    id: 'empty',
    name: 'Diagramme vide',
    description: 'Commencer avec un diagramme vierge',
    category: 'basic',
    elements: [],
    connections: []
  },
  {
    id: 'login_usecase',
    name: 'Système de connexion',
    description: 'Diagramme de cas d\'usage pour un système de connexion',
    category: 'uml_use_case',
    elements: [
      {
        id: 'user', type: 'actor', x: 50, y: 150, width: 80, height: 100,
        text: 'Utilisateur', 
        style: { 
          backgroundColor: '#dbeafe', borderColor: '#3b82f6', textColor: '#1e40af', 
          borderWidth: 2, borderStyle: 'solid', fontSize: 12, fontWeight: 'normal', 
          opacity: 1, shadow: false 
        }
      },
      {
        id: 'login', type: 'usecase', x: 200, y: 100, width: 140, height: 60,
        text: 'Se connecter', 
        style: { 
          backgroundColor: '#dcfce7', borderColor: '#10b981', textColor: '#047857', 
          borderWidth: 2, borderStyle: 'solid', fontSize: 12, fontWeight: 'normal', 
          opacity: 1, shadow: false 
        }
      }
    ],
    connections: [
      { 
        id: 'conn1', from: 'user', to: 'login', type: 'association', 
        style: { strokeColor: '#374151', strokeWidth: 2, strokeStyle: 'solid' } 
      }
    ]
  }
];

interface BusinessAnalystDiagramEditorProps {
  initialDiagram?: any;
  diagramType?: 'uml_use_case' | 'uml_sequence' | 'uml_class' | 'flowchart' | 'wireframe';
  diagramFormat?: string;
  onDiagramChange?: (diagram: any) => void;
  readOnly?: boolean;
}

function BusinessAnalystDiagramEditor({ 
  initialDiagram, 
  diagramType = 'uml_use_case',
  diagramFormat = 'json',
  onDiagramChange, 
  readOnly = false 
}: BusinessAnalystDiagramEditorProps) {
  
  // États principaux
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<DiagramElement[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize] = useState(20);
  const [history, setHistory] = useState<{ elements: DiagramElement[], connections: Connection[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activePanel, setActivePanel] = useState<string>('tools');
  const [darkMode, setDarkMode] = useState(false);

  // Charger le diagramme initial
  useEffect(() => {
    if (initialDiagram) {
      try {
        const parsed = typeof initialDiagram === 'string' 
          ? JSON.parse(initialDiagram) 
          : initialDiagram;
        
        if (parsed.elements) setElements(parsed.elements);
        if (parsed.connections) setConnections(parsed.connections);
      } catch (error) {
        console.error('Erreur lors du chargement du diagramme:', error);
      }
    }
  }, [initialDiagram]);

  // Sauvegarder automatiquement et notifier le changement
  useEffect(() => {
    const diagramData: DiagramData = {
      type: diagramType,
      format: diagramFormat,
      elements: elements,
      connections: connections,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        tool: 'professional-diagram-editor'
      }
    };
    
    onDiagramChange?.(diagramData);
    setLastSaved(new Date());
  }, [elements, connections, diagramType, diagramFormat, onDiagramChange]);

  // Sauvegarder dans l'historique
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: [...elements], connections: [...connections] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [elements, connections, history, historyIndex]);

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setElements([...prevState.elements]);
      setConnections([...prevState.connections]);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setElements([...nextState.elements]);
      setConnections([...nextState.connections]);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const snapToGridValue = (value: number) => {
    return snapToGrid ? Math.round(value / gridSize) * gridSize : value;
  };

  // Obtenir les outils du diagramme actuel
  const getCurrentTools = () => DIAGRAM_TOOLS[diagramType] || [];

  // Créer un nouvel élément
  const createElement = (tool: any, x: number, y: number) => {
    const newElement: DiagramElement = {
      id: `${tool.id}_${Date.now()}`,
      type: tool.id,
      x: snapToGridValue(x),
      y: snapToGridValue(y),
      width: getDefaultWidth(tool.id),
      height: getDefaultHeight(tool.id),
      text: getDefaultText(tool.id),
      style: {
        backgroundColor: tool.color + '20',
        borderColor: tool.color,
        textColor: '#374151',
        borderWidth: 2,
        borderStyle: 'solid',
        fontSize: 12,
        fontWeight: 'normal',
        opacity: 1,
        shadow: false
      },
      visible: true,
      locked: false,
      layer: 'default'
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElements([newElement.id]);
    saveToHistory();
  };

  const getDefaultWidth = (type: string) => {
    const widths: Record<string, number> = {
      actor: 80, usecase: 140, system: 120, class: 160,
      lifeline: 100, process: 120, decision: 100, start: 100,
      container: 200, button: 100, text: 120, image: 150, input: 140
    };
    return widths[type] || 120;
  };

  const getDefaultHeight = (type: string) => {
    const heights: Record<string, number> = {
      actor: 100, usecase: 60, system: 80, class: 120,
      lifeline: 60, process: 60, decision: 80, start: 60,
      container: 120, button: 40, text: 30, image: 100, input: 30
    };
    return heights[type] || 60;
  };

  const getDefaultText = (type: string) => {
    const texts: Record<string, string> = {
      actor: 'Acteur', usecase: 'Cas d\'usage', system: 'Système',
      class: 'Classe', lifeline: 'Objet', process: 'Processus',
      decision: 'Condition ?', start: 'Début', data: 'Données',
      container: 'Conteneur', button: 'Bouton', text: 'Texte',
      image: 'Image', input: 'Champ'
    };
    return texts[type] || 'Élément';
  };

  // Gestion des clics sur le canvas
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (readOnly) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    if (selectedTool === 'select') {
      setSelectedElements([]);
      setIsConnecting(false);
      setConnectionStart(null);
    } else if (selectedTool === 'connection') {
      setIsConnecting(true);
    } else {
      const tool = getCurrentTools().find(t => t.id === selectedTool);
      if (tool) {
        createElement(tool, x, y);
      }
    }
  };

  // Gestion des éléments
  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    
    if (selectedTool === 'connection') {
      if (isConnecting && connectionStart && connectionStart !== elementId) {
        createConnection(connectionStart, elementId);
      } else {
        setConnectionStart(elementId);
        setIsConnecting(true);
      }
    } else {
      if (e.ctrlKey || e.metaKey) {
        setSelectedElements(prev => 
          prev.includes(elementId) 
            ? prev.filter(id => id !== elementId)
            : [...prev, elementId]
        );
      } else {
        setSelectedElements([elementId]);
      }
    }
  };

  const createConnection = (fromId: string, toId: string) => {
    const newConnection: Connection = {
      id: `conn_${Date.now()}`,
      from: fromId,
      to: toId,
      type: 'association',
      style: {
        strokeColor: '#374151',
        strokeWidth: 2,
        strokeStyle: 'solid',
        arrowEnd: 'arrow'
      }
    };
    
    setConnections(prev => [...prev, newConnection]);
    setIsConnecting(false);
    setConnectionStart(null);
    saveToHistory();
  };

  const handleElementDoubleClick = (elementId: string) => {
    if (readOnly) return;
    const element = elements.find(el => el.id === elementId);
    if (element) {
      setEditingElement(elementId);
      setEditText(element.text);
    }
  };

  const handleTextEdit = (newText: string) => {
    if (editingElement) {
      setElements(prev => prev.map(el => 
        el.id === editingElement ? { ...el, text: newText } : el
      ));
      setEditingElement(null);
      saveToHistory();
    }
  };

  const deleteSelected = () => {
    if (selectedElements.length > 0 && !readOnly) {
      setElements(prev => prev.filter(el => !selectedElements.includes(el.id)));
      setConnections(prev => prev.filter(conn => 
        !selectedElements.includes(conn.from) && !selectedElements.includes(conn.to)
      ));
      setSelectedElements([]);
      saveToHistory();
    }
  };

  const duplicateSelected = () => {
    if (selectedElements.length > 0 && !readOnly) {
      const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
      const newElements = selectedElementsData.map(el => ({
        ...el,
        id: `${el.type}_${Date.now()}_${Math.random()}`,
        x: el.x + 20,
        y: el.y + 20
      }));
      
      setElements(prev => [...prev, ...newElements]);
      setSelectedElements(newElements.map(el => el.id));
      saveToHistory();
    }
  };

  const loadTemplate = (template: any) => {
    setElements(template.elements.map((el: any) => ({ ...el, id: `${el.type}_${Date.now()}_${Math.random()}` })));
    setConnections(template.connections.map((conn: any) => ({ ...conn, id: `conn_${Date.now()}_${Math.random()}` })));
    setShowTemplates(false);
    saveToHistory();
  };

  // Rendu des formes
  const renderShape = (element: DiagramElement) => {
    const { type, width, height, style } = element;
    
    const commonProps = {
      width: width - 4,
      height: height - 4,
      fill: style.backgroundColor,
      stroke: style.borderColor,
      strokeWidth: style.borderWidth,
      opacity: style.opacity
    };

    switch (type) {
      case 'actor':
        return (
          <g>
            <circle cx={width/2} cy={20} r={12} {...commonProps} />
            <line x1={width/2} y1={32} x2={width/2} y2={height-30} stroke={style.borderColor} strokeWidth={style.borderWidth} />
            <line x1={width/2} y1={45} x2={20} y2={55} stroke={style.borderColor} strokeWidth={style.borderWidth} />
            <line x1={width/2} y1={45} x2={width-20} y2={55} stroke={style.borderColor} strokeWidth={style.borderWidth} />
            <line x1={width/2} y1={height-30} x2={20} y2={height-10} stroke={style.borderColor} strokeWidth={style.borderWidth} />
            <line x1={width/2} y1={height-30} x2={width-20} y2={height-10} stroke={style.borderColor} strokeWidth={style.borderWidth} />
          </g>
        );
      
      case 'usecase':
        return <ellipse cx={width/2} cy={height/2} rx={(width-4)/2} ry={(height-4)/2} {...commonProps} />;
      
      case 'decision':
        const midX = width / 2;
        const midY = height / 2;
        return (
          <polygon 
            points={`${midX},2 ${width-2},${midY} ${midX},${height-2} 2,${midY}`} 
            {...commonProps} 
          />
        );
      
      default:
        return <rect x="2" y="2" width={width-4} height={height-4} {...commonProps} rx={4} />;
    }
  };

  // Rendu des connexions
  const renderConnections = () => {
    return connections.map(conn => {
      const fromElement = elements.find(el => el.id === conn.from);
      const toElement = elements.find(el => el.id === conn.to);
      
      if (!fromElement || !toElement) return null;
      
      const x1 = (fromElement.x + fromElement.width / 2) * zoom + pan.x;
      const y1 = (fromElement.y + fromElement.height / 2) * zoom + pan.y;
      const x2 = (toElement.x + toElement.width / 2) * zoom + pan.x;
      const y2 = (toElement.y + toElement.height / 2) * zoom + pan.y;
      
      return (
        <g key={conn.id}>
          <defs>
            <marker
              id={`arrow-${conn.id}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={conn.style.strokeColor} />
            </marker>
          </defs>
          <line
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={conn.style.strokeColor}
            strokeWidth={conn.style.strokeWidth}
            strokeDasharray={conn.style.strokeStyle === 'dashed' ? '5,5' : '0'}
            markerEnd={`url(#arrow-${conn.id})`}
          />
          {conn.label && (
            <text
              x={(x1 + x2) / 2}
              y={(y1 + y2) / 2 - 5}
              textAnchor="middle"
              className="text-xs fill-gray-700"
            >
              {conn.label}
            </text>
          )}
        </g>
      );
    });
  };

  // Gestionnaires clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElements.length > 0 && !editingElement) {
          deleteSelected();
        }
      } else if (e.key === 'Escape') {
        setSelectedElements([]);
        setIsConnecting(false);
        setConnectionStart(null);
        setEditingElement(null);
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        } else if (e.key === 'd') {
          e.preventDefault();
          duplicateSelected();
        } else if (e.key === 'a') {
          e.preventDefault();
          setSelectedElements(elements.map(el => el.id));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements, editingElement, readOnly, elements]);

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col ${darkMode ? 'dark' : ''}`}>
      {/* Header amélioré */}
      <div className={`px-4 py-3 border-b flex items-center justify-between flex-shrink-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <Layout className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Éditeur Professionnel - {diagramType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Interface StarUML-like pour Business Analysts
            </div>
          </div>
        </div>
        
        {!readOnly && (
          <div className="flex items-center gap-2">
            {lastSaved && (
              <div className={`flex items-center gap-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Sauvé {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
            
            <button onClick={undo} disabled={historyIndex <= 0} className={`p-1 rounded hover:bg-gray-100 disabled:opacity-30 ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-600'}`} title="Annuler (Ctrl+Z)">
              <Undo className="h-4 w-4" />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className={`p-1 rounded hover:bg-gray-100 disabled:opacity-30 ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-600'}`} title="Refaire (Ctrl+Y)">
              <Redo className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowTemplates(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Layout className="h-4 w-4" />
              Templates
            </button>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-1 rounded hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-600'}`}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Panneau latéral professionnel */}
        {!readOnly && (
          <div className={`w-72 border-r flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            {/* Onglets */}
            <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {[
                { id: 'tools', name: 'Outils', icon: Settings },
                { id: 'properties', name: 'Propriétés', icon: Edit3 },
                { id: 'layers', name: 'Calques', icon: Layers }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id)}
                  className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-medium ${
                    activePanel === tab.id 
                      ? darkMode ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400' : 'bg-white text-blue-600 border-b-2 border-blue-600'
                      : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Contenu des panneaux */}
            <div className="flex-1 overflow-y-auto">
              {activePanel === 'tools' && (
                <div className="p-4 space-y-4">
                  {/* Outils de base */}
                  <div>
                    <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Outils de base</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedTool('select')}
                        className={`p-3 rounded flex items-center gap-2 text-sm ${
                          selectedTool === 'select' 
                            ? darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700' 
                            : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        <MousePointer className="h-4 w-4" />
                        Sélection
                      </button>
                      <button
                        onClick={() => setSelectedTool('connection')}
                        className={`p-3 rounded flex items-center gap-2 text-sm ${
                          selectedTool === 'connection' 
                            ? darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700' 
                            : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        <ArrowRight className="h-4 w-4" />
                        Connexion
                      </button>
                    </div>
                  </div>

                  {/* Formes selon le type de diagramme */}
                  <div>
                    <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      Éléments {diagramType.replace('_', ' ')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {getCurrentTools().map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => setSelectedTool(tool.id)}
                          className={`p-3 rounded flex flex-col items-center gap-1 text-xs transition-all ${
                            selectedTool === tool.id 
                              ? darkMode ? 'bg-blue-900 text-blue-300 ring-2 ring-blue-500' : 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' 
                              : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-100'
                          }`}
                          title={tool.name}
                        >
                          <tool.icon className="h-5 w-5" style={{ color: tool.color }} />
                          <span className="text-center leading-tight">{tool.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Options de vue */}
                  <div>
                    <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Options de vue</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={showGrid}
                          onChange={(e) => setShowGrid(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Afficher la grille</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={snapToGrid}
                          onChange={(e) => setSnapToGrid(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Magnétisme grille</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activePanel === 'properties' && (
                <div className="p-4">
                  {selectedElements.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        Propriétés ({selectedElements.length} élément{selectedElements.length > 1 ? 's' : ''})
                      </h3>
                      
                      {selectedElements.length === 1 && (() => {
                        const element = elements.find(el => el.id === selectedElements[0]);
                        if (!element) return null;
                        
                        return (
                          <div className="space-y-3">
                            <div>
                              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Texte</label>
                              <input
                                type="text"
                                value={element.text}
                                onChange={(e) => setElements(prev => prev.map(el => 
                                  el.id === element.id ? { ...el, text: e.target.value } : el
                                ))}
                                className={`w-full px-2 py-1 text-sm rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Largeur</label>
                                <input
                                  type="number"
                                  value={element.width}
                                  onChange={(e) => setElements(prev => prev.map(el => 
                                    el.id === element.id ? { ...el, width: parseInt(e.target.value) || 0 } : el
                                  ))}
                                  className={`w-full px-2 py-1 text-sm rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                />
                              </div>
                              <div>
                                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Hauteur</label>
                                <input
                                  type="number"
                                  value={element.height}
                                  onChange={(e) => setElements(prev => prev.map(el => 
                                    el.id === element.id ? { ...el, height: parseInt(e.target.value) || 0 } : el
                                  ))}
                                  className={`w-full px-2 py-1 text-sm rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Couleur de fond</label>
                              <input
                                type="color"
                                value={element.style.backgroundColor}
                                onChange={(e) => setElements(prev => prev.map(el => 
                                  el.id === element.id ? { ...el, style: { ...el.style, backgroundColor: e.target.value } } : el
                                ))}
                                className="w-full h-8 rounded border"
                              />
                            </div>
                            
                            <div>
                              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Couleur de bordure</label>
                              <input
                                type="color"
                                value={element.style.borderColor}
                                onChange={(e) => setElements(prev => prev.map(el => 
                                  el.id === element.id ? { ...el, style: { ...el.style, borderColor: e.target.value } } : el
                                ))}
                                className="w-full h-8 rounded border"
                              />
                            </div>
                          </div>
                        );
                      })()}
                      
                      <div className="flex gap-2 pt-4 border-t">
                        <button
                          onClick={duplicateSelected}
                          className="flex-1 p-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-1 text-sm"
                        >
                          <Copy className="h-4 w-4" />
                          Dupliquer
                        </button>
                        <button
                          onClick={deleteSelected}
                          className="flex-1 p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1 text-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sélectionnez un élément pour voir ses propriétés</p>
                    </div>
                  )}
                </div>
              )}

              {activePanel === 'layers' && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Calques</h3>
                    <button className={`p-1 rounded hover:bg-gray-200 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-600'}`}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className={`p-2 rounded border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            <Eye className="h-4 w-4" />
                          </button>
                          <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Calque par défaut</span>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zone de travail principale */}
        <div className="flex-1 flex flex-col">
          {/* Barre d'outils de vue */}
          <div className={`px-4 py-2 border-b flex items-center justify-between ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.1))}
                className={`p-1 rounded hover:bg-gray-200 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-600'}`}
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className={`text-sm font-mono min-w-[60px] text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(prev => Math.min(prev * 1.2, 5))}
                className={`p-1 rounded hover:bg-gray-200 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-600'}`}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button 
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                className={`px-2 py-1 text-xs rounded hover:bg-gray-200 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-600'}`}
              >
                Ajuster
              </button>
            </div>
            
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {elements.length} élément{elements.length !== 1 ? 's' : ''} • {connections.length} connexion{connections.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Canvas principal */}
          <div 
            ref={canvasRef}
            className={`flex-1 relative overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
            onClick={handleCanvasClick}
            style={{ 
              cursor: selectedTool === 'select' ? 'default' : 'crosshair',
              backgroundImage: showGrid ? 
                darkMode ? 
                  'radial-gradient(circle, #374151 1px, transparent 1px)' :
                  'radial-gradient(circle, #e5e7eb 1px, transparent 1px)' 
                : 'none',
              backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`
            }}
          >
            {/* Connexions */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {renderConnections()}
            </svg>

            {/* Éléments */}
            {elements.map(element => (
              <div
                key={element.id}
                className={`absolute cursor-pointer transition-all ${
                  selectedElements.includes(element.id) ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                }`}
                style={{
                  left: element.x * zoom + pan.x,
                  top: element.y * zoom + pan.y,
                  width: element.width * zoom,
                  height: element.height * zoom,
                  zIndex: selectedElements.includes(element.id) ? 10 : 2,
                  opacity: element.visible ? element.style.opacity : 0.3
                }}
                onClick={(e) => handleElementClick(e, element.id)}
                onDoubleClick={() => handleElementDoubleClick(element.id)}
              >
                <svg width="100%" height="100%" className="absolute inset-0">
                  {renderShape(element)}
                </svg>
                
                {/* Texte de l'élément */}
                <div 
                  className="absolute inset-0 flex items-center justify-center p-2 text-center pointer-events-none"
                  style={{ 
                    color: element.style.textColor,
                    fontSize: Math.max(8, element.style.fontSize * zoom),
                    fontWeight: element.style.fontWeight
                  }}
                >
                  {editingElement === element.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => handleTextEdit(editText)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleTextEdit(editText);
                        else if (e.key === 'Escape') setEditingElement(null);
                      }}
                      className="w-full text-center bg-white border border-blue-500 rounded px-1 outline-none pointer-events-auto"
                      style={{ fontSize: Math.max(8, element.style.fontSize * zoom) }}
                      autoFocus
                    />
                  ) : (
                    <span className="break-words select-none">{element.text}</span>
                  )}
                </div>
                
                {/* Poignées de redimensionnement */}
                {selectedElements.includes(element.id) && (
                  <>
                    {[
                      { position: 'nw', cursor: 'nw-resize', top: -3, left: -3 },
                      { position: 'ne', cursor: 'ne-resize', top: -3, right: -3 },
                      { position: 'sw', cursor: 'sw-resize', bottom: -3, left: -3 },
                      { position: 'se', cursor: 'se-resize', bottom: -3, right: -3 }
                    ].map(handle => (
                      <div
                        key={handle.position}
                        className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm"
                        style={{
                          cursor: handle.cursor,
                          top: handle.top,
                          left: handle.left,
                          right: handle.right,
                          bottom: handle.bottom
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            ))}

            {/* Message si canvas vide */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Layout className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-medium mb-2">Commencez votre diagramme professionnel</p>
                  <p className="text-sm">Sélectionnez un outil dans le panneau de gauche et cliquez ici</p>
                  {!readOnly && (
                    <button
                      onClick={() => setShowTemplates(true)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Choisir un template
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Indicateur mode connexion */}
            {isConnecting && connectionStart && (
              <div className="absolute top-4 left-4 bg-blue-100 border border-blue-300 rounded-lg p-3 z-20">
                <div className="flex items-center gap-2 text-blue-800">
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-sm font-medium">Mode connexion actif</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">Cliquez sur un autre élément pour créer une connexion</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Templates */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-3xl w-full mx-4 rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Choisir un template</h2>
                <button
                  onClick={() => setShowTemplates(false)}
                  className={`p-2 rounded hover:bg-gray-200 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-600'}`}
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PREDEFINED_TEMPLATES.map(template => (
                  <div
                    key={template.id}
                    onClick={() => loadTemplate(template)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${darkMode ? 'bg-gray-700 border-gray-600 hover:border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-500'}`}
                  >
                    <div className="text-center mb-3">
                      <div className="text-3xl mb-2">📊</div>
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{template.name}</h3>
                    </div>
                    <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {template.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre de statut professionnelle */}
      <div className={`px-4 py-2 border-t text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Raccourcis :</span>
            <span className="ml-2">Ctrl+Z/Y: Annuler/Refaire • Del: Supprimer • Ctrl+D: Dupliquer • Ctrl+A: Tout sélectionner • Double-clic: Éditer texte</span>
          </div>
          <div className="flex items-center gap-4">
            {selectedElements.length > 0 && (
              <span>{selectedElements.length} élément{selectedElements.length > 1 ? 's' : ''} sélectionné{selectedElements.length > 1 ? 's' : ''}</span>
            )}
            <span>Zoom: {Math.round(zoom * 100)}%</span>
            <span className="text-green-500">● Sauvegarde auto</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Interface DiagramEditor mise à jour
interface DiagramEditorProps {
  initialDiagram?: any;
  diagramType?: DiagramType;
  diagramFormat?: DiagramFormat;
  onDiagramChange?: (diagram: any) => void;
  readOnly?: boolean;
}

export function DiagramEditor({ 
  initialDiagram, 
  diagramType = 'uml_use_case',
  diagramFormat = 'json',
  onDiagramChange, 
  readOnly = false 
}: DiagramEditorProps) {
  return (
    <BusinessAnalystDiagramEditor
      initialDiagram={initialDiagram}
      diagramType={diagramType}
      diagramFormat={diagramFormat}
      onDiagramChange={onDiagramChange}
      readOnly={readOnly}
    />
  );
}

// =============================================================================
// FACTORY COMPONENT - Sélecteur d'éditeur selon l'environnement
// =============================================================================

interface ContentEditorProps {
  environment: ExecutionEnvironment;
  initialContent?: any;
  onContentChange?: (content: any) => void;
  readOnly?: boolean;
  datasets?: Array<{ name: string; description?: string }>;
  language?: string;
  height?: string;
  diagramType?: DiagramType;
  diagramFormat?: DiagramFormat;
  documentFormat?: DocumentFormat; // 🆕
  financialDocumentType?: FinancialDocumentType

}

export function ContentEditor({ 
  environment, 
  initialContent, 
  onContentChange, 
  readOnly = false,
  datasets,
  language = 'python',
  height = "400px",
  diagramType = 'uml_use_case',
  diagramFormat = 'json',
  documentFormat = 'word', // Nouveau
  financialDocumentType = 'balance_sheet'
 
}: ContentEditorProps) {
  switch (environment) {
    case 'sql_database':
      return (
        <SQLEditor
          initialQuery={typeof initialContent === 'string' ? initialContent : ''}
          onQueryChange={onContentChange}
          readOnly={readOnly}
          datasets={datasets}
        />
      );
      
    case 'data_visualization':
      return (
        <VisualizationEditor
          initialData={initialContent}
          onDataChange={onContentChange}
          readOnly={readOnly}
        />
      );
      
    case 'jupyter_notebook':
      return (
        <NotebookEditor
          initialNotebook={initialContent}
          onNotebookChange={onContentChange}
          readOnly={readOnly}
        />
      );
      
    case 'diagram_editor':
      return (
        <DiagramEditor
          initialDiagram={initialContent}
          diagramType={diagramType}
          diagramFormat={diagramFormat}
          onDiagramChange={onContentChange}
          readOnly={readOnly}
        />
      );
    case 'text_editor':
      return (
        <TextEditor
          initialDocument={initialContent}
          documentFormat={documentFormat}
          onDocumentChange={onContentChange}
          readOnly={readOnly}
        />
      );

    case 'spreadsheet_editor':
      return (
        <SpreadsheetEditor
          initialSpreadsheet={initialContent}
          financialDocumentType={financialDocumentType}
          onSpreadsheetChange={onContentChange}
          readOnly={readOnly}
        />
      );
    case 'code_executor':
    default:
      return (
        <CodeEditor
          initialCode={typeof initialContent === 'string' ? initialContent : ''}
          language={language}
          onCodeChange={onContentChange}
          readOnly={readOnly}
          height={height}
        />
      );
  }
}