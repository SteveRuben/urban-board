// components/ContentEditors.tsx
import { useState, useEffect } from 'react';
import { Play, Save, Database, Code, BarChart3, FileText, CheckCircle, XCircle } from 'lucide-react';
import { 
  ExecutionEnvironment, 
  ExtendedSubmissionData, 
  ExtendedExecutionResult,
  ProgrammingLanguage 
} from '@/types/coding-plateform';

// =============================================================================
// ÉDITEUR SQL
// =============================================================================

interface SQLEditorProps {
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
  onSubmit?: (data: ExtendedSubmissionData) => Promise<any>;
  readOnly?: boolean;
  datasets?: Array<{ name: string; description?: string }>;
}

export function SQLEditor({ 
  initialQuery = '', 
  onQueryChange, 
  onSubmit, 
  readOnly = false,
  datasets = []
}: SQLEditorProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    onQueryChange?.(value);
  };

  const handleSubmit = async () => {
    if (!onSubmit || !query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const submissionData: ExtendedSubmissionData = {
        content: query,
        content_type: 'sql',
        language: 'sql'
      };

      const result = await onSubmit(submissionData);
      setResults(result);
    } catch (err) {
      console.error('Erreur lors de l\'exécution SQL:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'exécution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <Database className="h-5 w-5 text-emerald-600 mr-2" />
          <span className="font-medium text-gray-900">Éditeur SQL</span>
        </div>
        
        {datasets.length > 0 && (
          <div className="text-sm text-gray-600">
            Datasets: {datasets.map(d => d.name).join(', ')}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="p-4">
        <textarea
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          readOnly={readOnly}
          className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
          placeholder="-- Écrivez votre requête SQL ici
SELECT * FROM table_name
WHERE condition = 'value';"
        />
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Conseils: Utilisez SELECT uniquement. Les requêtes sont limitées à 30 secondes.
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !query.trim()}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exécution...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Exécuter
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="border-t border-gray-200 p-4">
          <ExecutionResults results={results} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border-t border-gray-200 p-4 bg-red-50">
          <div className="flex items-center text-red-700">
            <XCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Erreur d'exécution</span>
          </div>
          <p className="mt-1 text-sm text-red-600">{error}</p>
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
  onSubmit?: (data: ExtendedSubmissionData) => Promise<any>;
  readOnly?: boolean;
}

export function VisualizationEditor({ 
  initialData, 
  onDataChange, 
  onSubmit, 
  readOnly = false 
}: VisualizationEditorProps) {
  const [vizData, setVizData] = useState(initialData || {
    type: 'bar_chart',
    data: [],
    axes: { x: '', y: '' },
    title: ''
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleDataChange = (field: string, value: any) => {
    const newData = { ...vizData, [field]: value };
    setVizData(newData);
    onDataChange?.(newData);
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;

    try {
      setLoading(true);
      
      const submissionData: ExtendedSubmissionData = {
        content: vizData,
        content_type: 'visualization'
      };

      const result = await onSubmit(submissionData);
      setResults(result);
    } catch (err) {
      console.error('Erreur lors de la validation de visualisation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center">
        <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
        <span className="font-medium text-gray-900">Éditeur de visualisation</span>
      </div>

      {/* Configuration */}
      <div className="p-4 space-y-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Données (JSON)
          </label>
          <textarea
            value={JSON.stringify(vizData.data, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleDataChange('data', parsed);
              } catch (err) {
                // Ignore invalid JSON
              }
            }}
            readOnly={readOnly}
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            placeholder='[{"category": "A", "value": 10}, {"category": "B", "value": 20}]'
          />
        </div>
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Validation...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Valider
              </>
            )}
          </button>
        </div>
      )}

      {/* Preview */}
      <div className="border-t border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-2">Aperçu</h3>
        <div className="bg-gray-50 rounded-lg p-4 min-h-32 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>Aperçu de la visualisation</p>
            <p className="text-sm">Type: {vizData.type}</p>
            {vizData.data?.length > 0 && (
              <p className="text-sm">{vizData.data.length} points de données</p>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="border-t border-gray-200 p-4">
          <ExecutionResults results={results} />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ÉDITEUR DE NOTEBOOK
// =============================================================================

interface NotebookEditorProps {
  initialNotebook?: any;
  onNotebookChange?: (notebook: any) => void;
  onSubmit?: (data: ExtendedSubmissionData) => Promise<any>;
  readOnly?: boolean;
}

export function NotebookEditor({ 
  initialNotebook, 
  onNotebookChange, 
  onSubmit, 
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
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

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

  const handleSubmit = async () => {
    if (!onSubmit) return;

    try {
      setLoading(true);
      
      const submissionData: ExtendedSubmissionData = {
        content: notebook,
        content_type: 'notebook'
      };

      const result = await onSubmit(submissionData);
      setResults(result);
    } catch (err) {
      console.error('Erreur lors de l\'exécution du notebook:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-orange-600 mr-2" />
          <span className="font-medium text-gray-900">Notebook Jupyter</span>
        </div>
        
        {!readOnly && (
          <button
            onClick={addCell}
            className="inline-flex items-center px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            + Cellule
          </button>
        )}
      </div>

      {/* Cells */}
      <div className="p-4 space-y-4">
        {notebook.cells.map((cell: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg">
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
            <textarea
              value={Array.isArray(cell.source) ? cell.source.join('') : cell.source}
              onChange={(e) => updateCell(index, e.target.value)}
              readOnly={readOnly}
              className="w-full h-32 px-3 py-2 border-0 focus:ring-2 focus:ring-orange-500 font-mono text-sm resize-none"
              placeholder="# Écrivez votre code Python ici..."
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exécution...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Exécuter le notebook
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="border-t border-gray-200 p-4">
          <ExecutionResults results={results} />
        </div>
      )}
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
// FACTORY COMPONENT - Sélecteur d'éditeur selon l'environnement
// =============================================================================

interface ContentEditorProps {
  environment: ExecutionEnvironment;
  initialContent?: any;
  onContentChange?: (content: any) => void;
  onSubmit?: (data: ExtendedSubmissionData) => Promise<any>;
  readOnly?: boolean;
  datasets?: Array<{ name: string; description?: string }>;
}

export function ContentEditor({ 
  environment, 
  initialContent, 
  onContentChange, 
  onSubmit, 
  readOnly = false,
  datasets 
}: ContentEditorProps) {
  switch (environment) {
    case 'sql_database':
      return (
        <SQLEditor
          initialQuery={typeof initialContent === 'string' ? initialContent : ''}
          onQueryChange={onContentChange}
          onSubmit={onSubmit}
          readOnly={readOnly}
          datasets={datasets}
        />
      );
      
    case 'data_visualization':
      return (
        <VisualizationEditor
          initialData={initialContent}
          onDataChange={onContentChange}
          onSubmit={onSubmit}
          readOnly={readOnly}
        />
      );
      
    case 'jupyter_notebook':
      return (
        <NotebookEditor
          initialNotebook={initialContent}
          onNotebookChange={onContentChange}
          onSubmit={onSubmit}
          readOnly={readOnly}
        />
      );
      
    case 'code_executor':
    default:
      // Fallback vers l'éditeur de code standard
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Code className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-gray-900">Éditeur de code</span>
          </div>
          <textarea
            value={typeof initialContent === 'string' ? initialContent : ''}
            onChange={(e) => onContentChange?.(e.target.value)}
            readOnly={readOnly}
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="// Votre code ici..."
          />
        </div>
      );
  }
}