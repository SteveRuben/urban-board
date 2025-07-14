# app/services/execution_services.py - Version production minimale

import json
import sqlite3
import pandas as pd
import numpy as np
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import tempfile
import os
import requests
import base64
import psycopg2
from datetime import datetime, timezone
from flask import current_app

from app.types.coding_platform import (
    ExecutionEnvironment, TestcaseType, ProgrammingLanguage
)

class BaseExecutionService(ABC):
    """Interface de base pour tous les services d'exécution"""
    
    @abstractmethod
    def execute(self, content: str, testcase: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Exécute le contenu et retourne les résultats"""
        pass
    
    @abstractmethod
    def validate_output(self, actual_output: Any, expected_output: Any, **kwargs) -> bool:
        """Valide la sortie par rapport à l'attendu"""
        pass

class CodeExecutionService(BaseExecutionService):
    """Service d'exécution pour le code classique (Judge0) - Inchangé"""
    
    def execute(self, content: str, testcase: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Exécute le code via Judge0 API"""
        language = kwargs.get('language', ProgrammingLanguage.PYTHON)
        timeout = testcase.get('timeout_seconds', 5)
        
        try:
            LANGUAGE_IDS = {
                ProgrammingLanguage.PYTHON: 71,
                ProgrammingLanguage.JAVASCRIPT: 63,
                ProgrammingLanguage.JAVA: 62,
                ProgrammingLanguage.CPP: 54,
                ProgrammingLanguage.C: 50,
            }
            
            language_id = LANGUAGE_IDS.get(language)
            if not language_id:
                return {
                    'success': False,
                    'error': f'Unsupported language: {language.value}',
                    'passed': False
                }
            
            submission_data = {
                'source_code': base64.b64encode(content.encode()).decode(),
                'language_id': language_id,
                'stdin': base64.b64encode(testcase.get('input_data', '').encode()).decode(),
                'expected_output': base64.b64encode(testcase.get('expected_output', '').encode()).decode(),
                'cpu_time_limit': timeout,
                'memory_limit': testcase.get('memory_limit_mb', 128) * 1024,
            }
            
            headers = {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': current_app.config.get('JUDGE0_API_KEY', ''),
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            }
            
            submit_url = f"{current_app.config.get('JUDGE0_API_URL', '')}/submissions?wait=true&base64_encoded=true"
            response = requests.post(submit_url, json=submission_data, headers=headers, timeout=30)
            
            if response.status_code != 200:
                return {
                    'success': False,
                    'error': f'Judge0 API error: {response.status_code}',
                    'passed': False
                }
            
            result = response.json()
            stdout = base64.b64decode(result.get('stdout', '')).decode() if result.get('stdout') else ''
            stderr = base64.b64decode(result.get('stderr', '')).decode() if result.get('stderr') else ''
            
            expected_output = testcase.get('expected_output', '')
            passed = self.validate_output(stdout.strip(), expected_output.strip())
            
            return {
                'success': True,
                'passed': passed,
                'stdout': stdout,
                'stderr': stderr,
                'execution_time': result.get('time'),
                'memory_used': result.get('memory'),
                'status': result.get('status', {}).get('description', 'Unknown')
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Execution error: {str(e)}',
                'passed': False
            }
    
    def validate_output(self, actual_output: str, expected_output: str, **kwargs) -> bool:
        """Validation basique de chaîne de caractères"""
        return actual_output == expected_output

class SQLExecutionService(BaseExecutionService):
    """Service d'exécution pour les requêtes SQL"""
    
    def execute(self, content: str, testcase: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Exécute une requête SQL"""
        try:
            dataset_reference = testcase.get('dataset_reference')
            if not dataset_reference:
                return {
                    'success': False,
                    'error': 'No dataset reference provided',
                    'passed': False
                }
            
            # Obtenir connexion DB
            conn = self._get_database_connection(dataset_reference)
            
            # Validation de sécurité
            if not self._is_safe_query(content):
                return {
                    'success': False,
                    'error': 'Query contains forbidden operations',
                    'passed': False
                }
            
            # Exécuter la requête
            try:
                result_df = pd.read_sql_query(content, conn)
                actual_result = result_df.to_dict('records')
                
                # Valider contre l'attendu
                expected_result = testcase.get('expected_output')
                if expected_result:
                    if isinstance(expected_result, str):
                        expected_result = json.loads(expected_result)
                
                passed = self.validate_output(actual_result, expected_result, **kwargs)
                
                return {
                    'success': True,
                    'passed': passed,
                    'result': actual_result,
                    'row_count': len(result_df),
                    'columns': list(result_df.columns)
                }
                
            except Exception as sql_error:
                return {
                    'success': False,
                    'error': f'SQL execution error: {str(sql_error)}',
                    'passed': False
                }
            finally:
                if hasattr(conn, 'close'):
                    conn.close()
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Database error: {str(e)}',
                'passed': False
            }
    
    def validate_output(self, actual_output: List[Dict], expected_output: List[Dict], **kwargs) -> bool:
        """Validation des résultats SQL"""
        if not expected_output:
            return True
        
        tolerance = kwargs.get('numerical_tolerance', 0.001)
        
        if len(actual_output) != len(expected_output):
            return False
        
        for actual_row, expected_row in zip(actual_output, expected_output):
            if not self._compare_rows(actual_row, expected_row, tolerance):
                return False
        
        return True
    
    def _compare_rows(self, actual: Dict, expected: Dict, tolerance: float) -> bool:
        """Compare deux lignes avec tolérance numérique"""
        if set(actual.keys()) != set(expected.keys()):
            return False
        
        for key in actual.keys():
            actual_val = actual[key]
            expected_val = expected[key]
            
            if isinstance(actual_val, (int, float)) and isinstance(expected_val, (int, float)):
                if abs(actual_val - expected_val) > tolerance:
                    return False
            else:
                if str(actual_val) != str(expected_val):
                    return False
        
        return True
    
    def _get_database_connection(self, dataset_reference: str):
        """Obtient une connexion à la base de données"""
        datasets_path = current_app.config.get('DATASETS_PATH', 'app/datasets/')
        
        # SQLite par défaut
        if dataset_reference.endswith('.db') or dataset_reference.endswith('.sqlite'):
            db_path = os.path.join(datasets_path, 'sqlite', dataset_reference)
            if not os.path.exists(db_path):
                raise FileNotFoundError(f"Database file not found: {db_path}")
            return sqlite3.connect(db_path)
        
        # PostgreSQL
        elif dataset_reference.startswith('postgresql://'):
            return psycopg2.connect(dataset_reference)
        
        # Configuration PostgreSQL par nom
        else:
            pg_config = current_app.config.get('SQL_DATABASES', {}).get('postgresql', {})
            if pg_config:
                conn_str = f"postgresql://{pg_config['username']}:{pg_config['password']}@{pg_config['host']}:{pg_config['port']}/{dataset_reference}"
                return psycopg2.connect(conn_str)
        
        raise ValueError(f"Unsupported dataset reference: {dataset_reference}")
    
    def _is_safe_query(self, query: str) -> bool:
        """Valide que la requête est sécurisée"""
        query_upper = query.upper().strip()
        
        # Commandes interdites
        forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'CREATE', 'ALTER', 'TRUNCATE', 'EXEC']
        
        for cmd in forbidden:
            if cmd in query_upper:
                return False
        
        # Doit commencer par SELECT ou WITH
        if not (query_upper.startswith('SELECT') or query_upper.startswith('WITH')):
            return False
        
        return True

class NotebookExecutionService(BaseExecutionService):
    """Service d'exécution pour les notebooks Jupyter avec validation intelligente"""
    
    def _get_available_kernel(self):
        """Trouve un kernel Python disponible"""
        try:
            from jupyter_client import kernelspec
            km = kernelspec.KernelSpecManager()
            available_kernels = km.find_kernel_specs()
            
            # Ordre de préférence pour les kernels Python
            preferred_kernels = ['python3', 'python', 'python3.11', 'python3.10', 'python3.9']
            
            for kernel in preferred_kernels:
                if kernel in available_kernels:
                    current_app.logger.info(f"Using kernel: {kernel}")
                    return kernel
            
            # Si aucun kernel préféré n'est trouvé, prendre le premier disponible qui contient "python"
            for kernel_name in available_kernels.keys():
                if 'python' in kernel_name.lower():
                    current_app.logger.info(f"Using fallback kernel: {kernel_name}")
                    return kernel_name
            
            current_app.logger.error(f"No Python kernel found. Available: {list(available_kernels.keys())}")
            return None
            
        except Exception as e:
            current_app.logger.error(f"Error finding kernels: {str(e)}")
            return None
    
    def _create_notebook_from_dict(self, content_dict):
        """Crée un notebook nbformat à partir d'un dictionnaire"""
        import nbformat
        
        # Créer un nouveau notebook
        notebook = nbformat.v4.new_notebook()
        
        # Ajouter les métadonnées
        notebook.metadata = {
            'kernelspec': {
                'display_name': 'Python 3',
                'language': 'python',
                'name': 'python3'
            },
            'language_info': {
                'name': 'python',
                'version': '3.8.0',
                'mimetype': 'text/x-python',
                'codemirror_mode': {'name': 'ipython', 'version': 3},
                'pygments_lexer': 'ipython3',
                'nbconvert_exporter': 'python',
                'file_extension': '.py'
            }
        }
        
        # Traiter les cellules
        cells_data = content_dict.get('cells', [])
        for cell_data in cells_data:
            cell_type = cell_data.get('cell_type', 'code')
            
            # Traiter le source (peut être une liste ou une chaîne)
            source = cell_data.get('source', '')
            if isinstance(source, list):
                source = ''.join(source)
            
            if cell_type == 'code':
                cell = nbformat.v4.new_code_cell(source)
            elif cell_type == 'markdown':
                cell = nbformat.v4.new_markdown_cell(source)
            else:
                cell = nbformat.v4.new_raw_cell(source)
            
            notebook.cells.append(cell)
        
        return notebook
    
    def execute(self, content: str, testcase: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Exécute un notebook Jupyter avec validation intelligente"""
        current_app.logger.info("Starting notebook execution")
        
        try:
            import nbformat
            from nbconvert.preprocessors import ExecutePreprocessor
            
            # Trouver un kernel disponible
            kernel_name = self._get_available_kernel()
            if not kernel_name:
                return {
                    'success': False,
                    'error': 'No Python kernel available for notebook execution. Please install ipykernel: pip install ipykernel',
                    'passed': False
                }
            
            # Parse du contenu notebook
            current_app.logger.info(f"Parsing notebook content: {type(content)}")
            
            if isinstance(content, str):
                try:
                    import json
                    content_dict = json.loads(content)
                    notebook = self._create_notebook_from_dict(content_dict)
                except json.JSONDecodeError:
                    notebook = nbformat.reads(content, as_version=4)
            elif isinstance(content, dict):
                notebook = self._create_notebook_from_dict(content)
            else:
                raise ValueError(f"Unsupported content type: {type(content)}")
            
            current_app.logger.info(f"Notebook created. Cells count: {len(notebook.cells)}")
            
            # Log des cellules avant exécution
            for i, cell in enumerate(notebook.cells):
                if cell.cell_type == 'code':
                    current_app.logger.info(f"Cell {i}: {cell.source[:50]}...")
            
            # Configuration d'exécution
            ep = ExecutePreprocessor(
                timeout=kwargs.get('timeout', 300),
                kernel_name=kernel_name,
                allow_errors=True  # Continue même en cas d'erreur
            )
            
            # Exécuter le notebook
            try:
                current_app.logger.info("Starting notebook preprocessing")
                
                import tempfile
                with tempfile.TemporaryDirectory() as temp_dir:
                    ep.preprocess(notebook, {'metadata': {'path': temp_dir}})
                
                current_app.logger.info("Notebook preprocessing completed")
                
                # Extraction intelligente des résultats
                execution_results = self._extract_execution_results(notebook)
                
                # Validation intelligente
                expected_criteria = self._get_expected_data_for_validation(testcase)
                passed = self.validate_output_smart(execution_results, expected_criteria, **kwargs)
                
                current_app.logger.info(f"Validation result: {passed}")
                
                return {
                    'success': True,
                    'passed': passed,
                    'stdout': execution_results.get('stdout', ''),
                    'stderr': execution_results.get('stderr', ''),
                    'final_result': execution_results.get('final_result'),
                    'outputs': execution_results.get('original_outputs', []),  # Pour compatibilité
                    'kernel_used': kernel_name,
                    'execution_time': None,
                    'memory_used': None,
                    'status': 'Completed'
                }
                
            except Exception as exec_error:
                current_app.logger.error(f"Notebook execution error: {str(exec_error)}")
                current_app.logger.error(f"Error type: {type(exec_error)}")
                import traceback
                current_app.logger.error(f"Full traceback: {traceback.format_exc()}")
                
                return {
                    'success': False,
                    'error': f'Notebook execution error: {str(exec_error)}',
                    'passed': False,
                    'kernel_used': kernel_name,
                    'full_error': traceback.format_exc()
                }
            
        except ImportError as import_error:
            current_app.logger.error(f"Missing dependencies: {str(import_error)}")
            return {
                'success': False,
                'error': f'Missing dependencies: {str(import_error)}. Please install: pip install nbconvert nbformat ipykernel',
                'passed': False
            }
        except Exception as e:
            current_app.logger.error(f"Notebook processing error: {str(e)}")
            import traceback
            current_app.logger.error(f"Full traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': f'Notebook processing error: {str(e)}',
                'passed': False,
                'full_error': traceback.format_exc()
            }
    
    def _extract_execution_results(self, notebook):
        """Extraction intelligente des résultats du notebook"""
        results = {
            'stdout': '',
            'stderr': '',
            'final_result': None,
            'all_results': [],
            'prints': [],
            'original_outputs': []  # Pour compatibilité avec l'ancien format
        }
        
        stdout_parts = []
        stderr_parts = []
        
        for i, cell in enumerate(notebook.cells):
            if cell.cell_type == 'code' and cell.outputs:
                current_app.logger.info(f"Processing cell {i} outputs: {len(cell.outputs)} outputs")
                
                for j, output in enumerate(cell.outputs):
                    current_app.logger.info(f"Output {j} type: {output.output_type}")
                    
                    # Format original pour compatibilité
                    original_output = {
                        'type': 'stream' if output.output_type == 'stream' else 
                               'result' if output.output_type == 'execute_result' else
                               'error' if output.output_type == 'error' else 'display',
                        'cell_index': i
                    }
                    
                    if output.output_type == 'stream':
                        text = output.text
                        original_output.update({
                            'name': output.name,
                            'text': text
                        })
                        
                        if output.name == 'stdout':
                            stdout_parts.append(text)
                            results['prints'].append(text.strip())
                        elif output.name == 'stderr':
                            stderr_parts.append(text)
                    
                    elif output.output_type == 'execute_result':
                        data = output.data
                        original_output['data'] = data
                        
                        if 'text/plain' in data:
                            result_value = str(data['text/plain']).strip()
                            # Nettoyer les quotes autour des strings si présentes
                            if result_value.startswith("'") and result_value.endswith("'"):
                                result_value = result_value[1:-1]
                            elif result_value.startswith('"') and result_value.endswith('"'):
                                result_value = result_value[1:-1]
                            
                            results['all_results'].append(result_value)
                            results['final_result'] = result_value  # Le dernier devient final
                    
                    elif output.output_type == 'display_data':
                        original_output['data'] = output.data
                    
                    elif output.output_type == 'error':
                        original_output.update({
                            'ename': output.ename,
                            'evalue': output.evalue,
                            'traceback': output.traceback
                        })
                        stderr_parts.append(f"{output.ename}: {output.evalue}")
                    
                    results['original_outputs'].append(original_output)
            else:
                current_app.logger.info(f"Cell {i} has no outputs")
        
        results['stdout'] = ''.join(stdout_parts)
        results['stderr'] = ''.join(stderr_parts)
        
        current_app.logger.info(f"Extracted results: final_result='{results['final_result']}', prints={results['prints']}")
        current_app.logger.info(f"Total outputs: {len(results['original_outputs'])}")
        
        return results
    
    def _get_expected_data_for_validation(self, testcase: Dict[str, Any]) -> Dict[str, Any]:
        """Détermine les données attendues selon le type de test"""
        testcase_type = testcase.get('testcase_type', 'unit_test')
        
        if testcase_type == 'notebook_cell_test':
            print( 'Pour les tests de cellule notebook, utiliser notebook_cell_output')
            print(testcase.get('notebook_cell_output', {}))
            return testcase.get('notebook_cell_output', {})
        else:
            print('Pour les autres types, utiliser expected_output')
            expected_output = testcase.get('expected_output')
            if isinstance(expected_output, str):
                try:
                    import json
                    return json.loads(expected_output)
                except json.JSONDecodeError:
                    return {'text_output': expected_output}
            return expected_output or {}
    
    def validate_output_smart(self, execution_results: Dict, expected_criteria: Any, **kwargs) -> bool:
        """Validation intelligente basée sur des critères simples"""
        current_app.logger.info(f"=== SMART VALIDATION START ===")
        current_app.logger.info(f"Expected criteria: {expected_criteria}")
        current_app.logger.info(f"Expected criteria type: {type(expected_criteria)}")

        if not expected_criteria:
            result = len(execution_results.get('original_outputs', [])) > 0
            current_app.logger.info(f"No criteria - has outputs: {result}")
            return result

        if isinstance(expected_criteria, str):
            current_app.logger.info(f"String criteria: '{expected_criteria}'")
            try:
                import json
                parsed_criteria = json.loads(expected_criteria)
                current_app.logger.info(f"Parsed as JSON: {parsed_criteria}")
                expected_criteria = parsed_criteria
            except json.JSONDecodeError:
                current_app.logger.info("Not valid JSON, searching as string")
                result = self._search_in_results(execution_results, expected_criteria, **kwargs)
                current_app.logger.info(f"Search result: {result}")
                return result

        if not isinstance(expected_criteria, dict):
            current_app.logger.info("Invalid criteria format")
            return False

        tolerance = kwargs.get('numerical_tolerance', 0.001)
        current_app.logger.info(f"Using tolerance: {tolerance}")

        # 🆕 DÉTECTER SI C'EST UN OBJET DE SORTIE NOTEBOOK STANDARD
        if self._is_notebook_output_object(expected_criteria):
            current_app.logger.info("Detected notebook output object - validating against actual outputs")
            return self._validate_notebook_output_object(execution_results, expected_criteria, tolerance)

        # Validation du résultat final
        if 'expected_final_result' in expected_criteria:
            expected_final = expected_criteria['expected_final_result']
            actual_final = execution_results.get('final_result')

            current_app.logger.info(f"Comparing final result: actual='{actual_final}' vs expected='{expected_final}'")

            if not self._compare_values(actual_final, expected_final, tolerance):
                current_app.logger.info("Final result validation failed")
                return False

        # Validation des prints
        if 'expected_prints' in expected_criteria:
            expected_prints = expected_criteria['expected_prints']
            actual_prints = execution_results.get('prints', [])

            current_app.logger.info(f"Comparing prints: actual={actual_prints} vs expected={expected_prints}")

            if isinstance(expected_prints, list):
                for expected_print in expected_prints:
                    if not any(self._compare_values(actual.strip(), expected_print, tolerance) 
                             for actual in actual_prints):
                        current_app.logger.info(f"Expected print '{expected_print}' not found")
                        return False
            else:
                if not any(self._compare_values(actual.strip(), expected_prints, tolerance) 
                         for actual in actual_prints):
                    current_app.logger.info(f"Expected print '{expected_prints}' not found")
                    return False

        # Validation "must contain"
        if 'must_contain' in expected_criteria:
            must_contain = expected_criteria['must_contain']
            all_text = execution_results.get('stdout', '') + str(execution_results.get('final_result', ''))

            current_app.logger.info(f"Checking must_contain: '{must_contain}' in '{all_text}'")

            if isinstance(must_contain, list):
                for item in must_contain:
                    if str(item) not in all_text:
                        current_app.logger.info(f"Required text '{item}' not found")
                        return False
            else:
                if str(must_contain) not in all_text:
                    current_app.logger.info(f"Required text '{must_contain}' not found")
                    return False

        # Validation qu'il y a au moins un résultat
        if expected_criteria.get('must_have_result', False):
            if not execution_results.get('final_result') and not execution_results.get('prints'):
                current_app.logger.info("No result found but must_have_result=True")
                return False

        # 🆕 SI AUCUN CRITÈRE SPÉCIFIQUE N'EST TROUVÉ, NE PAS PASSER PAR DÉFAUT
        specific_criteria_found = any(key in expected_criteria for key in [
            'expected_final_result', 'expected_prints', 'must_contain', 'must_have_result'
        ])

        if not specific_criteria_found:
            current_app.logger.info("No recognized validation criteria found - this might be an unsupported format")
            # Pour les objets non reconnus, vérifier au moins qu'il y a des sorties
            has_outputs = len(execution_results.get('original_outputs', [])) > 0
            current_app.logger.info(f"Fallback validation - has outputs: {has_outputs}")
            return has_outputs

        current_app.logger.info("All validations passed")
        return True

    def _is_notebook_output_object(self, criteria: Dict) -> bool:
        """Détecte si l'objet ressemble à une sortie de cellule notebook"""
        return (
            isinstance(criteria, dict) and
            'output_type' in criteria and
            criteria.get('output_type') in ['execute_result', 'display_data', 'stream']
        )

    def _validate_notebook_output_object(self, execution_results: Dict, expected_output: Dict, tolerance: float = 0.001) -> bool:
        """Valide un objet de sortie notebook contre les résultats d'exécution"""
        current_app.logger.info("=== NOTEBOOK OUTPUT VALIDATION ===")

        expected_type = expected_output.get('output_type')
        current_app.logger.info(f"Expected output type: {expected_type}")

        # Chercher dans les sorties originales
        original_outputs = execution_results.get('original_outputs', [])
        current_app.logger.info(f"Found {len(original_outputs)} original outputs")

        if not original_outputs:
            current_app.logger.info("No outputs found - validation failed")
            return False

        # 🆕 Extraire la valeur attendue pour validation intelligente
        expected_value = self._extract_expected_value(expected_output)
        current_app.logger.info(f"Expected value extracted: '{expected_value}'")

        # Chercher une sortie correspondante selon le type
        for i, output in enumerate(original_outputs):
            current_app.logger.info(f"Checking output {i}: type='{output.get('type')}'")

            if expected_type == 'execute_result' and output.get('type') == 'result':
                # Comparer les données execute_result
                expected_data = expected_output.get('data', {})
                actual_data = output.get('data', {})

                current_app.logger.info(f"Expected data: {expected_data}")
                current_app.logger.info(f"Actual data: {actual_data}")

                # Vérifier text/plain en priorité
                if 'text/plain' in expected_data:
                    expected_text = str(expected_data['text/plain']).strip()
                    actual_text = str(actual_data.get('text/plain', '')).strip()

                    # Nettoyer les quotes si présentes
                    if actual_text.startswith("'") and actual_text.endswith("'"):
                        actual_text = actual_text[1:-1]
                    elif actual_text.startswith('"') and actual_text.endswith('"'):
                        actual_text = actual_text[1:-1]

                    current_app.logger.info(f"Comparing text/plain: '{actual_text}' vs '{expected_text}'")

                    if self._compare_values(actual_text, expected_text, tolerance):
                        current_app.logger.info("Match found in execute_result")
                        return True

            # 🆕 VALIDATION INTELLIGENTE: Si on attend execute_result mais on trouve stream
            elif expected_type == 'execute_result' and output.get('type') == 'stream':
                if output.get('name') == 'stdout':
                    actual_text = output.get('text', '').strip()
                    current_app.logger.info(f"Cross-type validation: stream stdout '{actual_text}' vs expected execute_result '{expected_value}'")

                    if self._compare_values(actual_text, expected_value, tolerance):
                        current_app.logger.info("Match found: execute_result expected but stream stdout matches")
                        return True

            elif expected_type == 'stream' and output.get('type') == 'stream':
                expected_name = expected_output.get('name', 'stdout')
                expected_text = expected_output.get('text', '')

                actual_name = output.get('name', '')
                actual_text = output.get('text', '')

                current_app.logger.info(f"Comparing stream: name='{actual_name}' vs '{expected_name}', text='{actual_text}' vs '{expected_text}'")

                if (actual_name == expected_name and 
                    self._compare_values(actual_text.strip(), expected_text.strip(), tolerance)):
                    current_app.logger.info("Match found in stream")
                    return True

            # 🆕 VALIDATION INTELLIGENTE: Si on attend stream mais on trouve execute_result
            elif expected_type == 'stream' and output.get('type') == 'result':
                expected_name = expected_output.get('name', 'stdout')
                if expected_name == 'stdout':
                    actual_data = output.get('data', {})
                    if 'text/plain' in actual_data:
                        actual_text = str(actual_data['text/plain']).strip()
                        # Nettoyer les quotes
                        if actual_text.startswith("'") and actual_text.endswith("'"):
                            actual_text = actual_text[1:-1]
                        elif actual_text.startswith('"') and actual_text.endswith('"'):
                            actual_text = actual_text[1:-1]

                        current_app.logger.info(f"Cross-type validation: execute_result '{actual_text}' vs expected stream '{expected_value}'")

                        if self._compare_values(actual_text, expected_value, tolerance):
                            current_app.logger.info("Match found: stream expected but execute_result matches")
                            return True

            elif expected_type == 'display_data' and output.get('type') == 'display':
                # Comparer les données de display
                expected_data = expected_output.get('data', {})
                actual_data = output.get('data', {})

                current_app.logger.info(f"Comparing display data: {actual_data} vs {expected_data}")

                # Validation simple pour display_data
                if expected_data and actual_data:
                    # Au moins un format doit correspondre
                    for format_type, expected_content in expected_data.items():
                        if format_type in actual_data:
                            if self._compare_values(str(actual_data[format_type]), str(expected_content), tolerance):
                                current_app.logger.info(f"Match found in display_data format: {format_type}")
                                return True

        current_app.logger.info("No matching notebook output found")
        return False
    def _extract_expected_value(self, expected_output: Dict) -> str:
        """Extrait la valeur principale d'un objet de sortie attendu"""
        output_type = expected_output.get('output_type')
        
        if output_type == 'execute_result':
            data = expected_output.get('data', {})
            if 'text/plain' in data:
                return str(data['text/plain']).strip()
        elif output_type == 'stream':
            return expected_output.get('text', '').strip()
        elif output_type == 'display_data':
            data = expected_output.get('data', {})
            if 'text/plain' in data:
                return str(data['text/plain']).strip()
        
        return ''

    def _search_in_results(self, execution_results: Dict, search_value: str, **kwargs) -> bool:
        """Cherche une valeur dans tous les résultats"""
        tolerance = kwargs.get('numerical_tolerance', 0.001)
        
        current_app.logger.info(f"=== SEARCH IN RESULTS ===")
        current_app.logger.info(f"Searching for: '{search_value}'")
        current_app.logger.info(f"Final result: '{execution_results.get('final_result')}'")
        current_app.logger.info(f"Prints: {execution_results.get('prints', [])}")
        current_app.logger.info(f"Stdout: '{execution_results.get('stdout')}'")
        
        # Chercher dans le résultat final
        final_result = execution_results.get('final_result')
        if final_result is not None:
            comparison_result = self._compare_values(final_result, search_value, tolerance)
            current_app.logger.info(f"Final result comparison: '{final_result}' vs '{search_value}' = {comparison_result}")
            if comparison_result:
                current_app.logger.info("MATCH FOUND in final result")
                return True
        
        # Chercher dans les prints
        for i, print_output in enumerate(execution_results.get('prints', [])):
            comparison_result = self._compare_values(print_output.strip(), search_value, tolerance)
            current_app.logger.info(f"Print {i} comparison: '{print_output.strip()}' vs '{search_value}' = {comparison_result}")
            if comparison_result:
                current_app.logger.info(f"MATCH FOUND in print {i}")
                return True
        
        # Chercher dans stdout
        stdout = execution_results.get('stdout')
        if stdout:
            comparison_result = self._compare_values(stdout, search_value, tolerance)
            current_app.logger.info(f"Stdout comparison: '{stdout}' vs '{search_value}' = {comparison_result}")
            if comparison_result:
                current_app.logger.info("MATCH FOUND in stdout")
                return True
        
        current_app.logger.info("NO MATCH FOUND anywhere")
        return False
    
    def _is_numeric(self, value_str):
        """Vérifie si une string représente un nombre"""
        if not isinstance(value_str, str):
            return False
        try:
            float(value_str)
            return True
        except (ValueError, TypeError):
            return False
    
    def _compare_values(self, actual, expected, tolerance=0.001):
        """Compare intelligemment deux valeurs avec logique corrigée"""
        if actual is None or expected is None:
            result = actual == expected
            current_app.logger.info(f"Null comparison: {actual} == {expected} = {result}")
            return result
        
        # Nettoyer les strings
        actual_str = str(actual).strip()
        expected_str = str(expected).strip()
        
        # Comparaison exacte (priorité 1)
        if actual_str == expected_str:
            current_app.logger.info(f"Exact match: '{actual_str}' == '{expected_str}'")
            return True
        
        # Vérifier si ce sont des nombres
        actual_is_numeric = self._is_numeric(actual_str)
        expected_is_numeric = self._is_numeric(expected_str)
        
        current_app.logger.info(f"Type check: actual='{actual_str}' (numeric: {actual_is_numeric}), expected='{expected_str}' (numeric: {expected_is_numeric})")
        
        # Si les deux sont numériques, faire SEULEMENT une comparaison numérique stricte
        if actual_is_numeric and expected_is_numeric:
            try:
                actual_num = float(actual_str)
                expected_num = float(expected_str)
                is_equal = abs(actual_num - expected_num) <= tolerance
                current_app.logger.info(f"Numeric comparison: {actual_num} vs {expected_num}, tolerance={tolerance}, equal={is_equal}")
                return is_equal
            except (ValueError, TypeError):
                current_app.logger.info("Failed to convert to float despite numeric check")
                pass
        
        # Si l'un est numérique et l'autre non, retourner False (pas de conversion automatique)
        if actual_is_numeric != expected_is_numeric:
            current_app.logger.info(f"Type mismatch: actual_numeric={actual_is_numeric}, expected_numeric={expected_is_numeric}")
            return False
        
        # Comparaison partielle SEULEMENT pour les strings non-numériques
        # Et seulement si une des strings fait plus de 3 caractères (éviter les faux positifs)
        if not actual_is_numeric and not expected_is_numeric:
            if len(expected_str) > 3 or len(actual_str) > 3:
                if expected_str in actual_str or actual_str in expected_str:
                    current_app.logger.info(f"Partial string match: '{expected_str}' in '{actual_str}'")
                    return True
        
        current_app.logger.info(f"No match found: '{actual_str}' vs '{expected_str}'")
        return False
    
    # === MÉTHODES DE COMPATIBILITÉ AVEC L'ANCIEN FORMAT ===
    
    def validate_output(self, actual_output: List, expected_data: Dict, **kwargs) -> bool:
        """Méthode de compatibilité - redirige vers la validation intelligente"""
        testcase = kwargs.get('testcase', {})
        testcase_type = testcase.get('testcase_type', 'unit_test')
        
        current_app.logger.info(f"Legacy validate_output called - Type: {testcase_type}")
        
        if testcase_type == 'notebook_cell_test':
            # Convertir l'ancien format vers le nouveau pour la validation
            execution_results = {
                'stdout': '',
                'stderr': '',
                'final_result': None,
                'prints': [],
                'original_outputs': actual_output
            }
            
            # Extraire les données depuis actual_output
            stdout_parts = []
            for output in actual_output:
                if output.get('type') == 'stream' and output.get('name') == 'stdout':
                    stdout_parts.append(output.get('text', ''))
                    execution_results['prints'].append(output.get('text', '').strip())
                elif output.get('type') == 'result':
                    data = output.get('data', {})
                    if 'text/plain' in data:
                        result_value = str(data['text/plain']).strip()
                        # Nettoyer les quotes autour des strings si présentes
                        if result_value.startswith("'") and result_value.endswith("'"):
                            result_value = result_value[1:-1]
                        elif result_value.startswith('"') and result_value.endswith('"'):
                            result_value = result_value[1:-1]
                        execution_results['final_result'] = result_value
            
            execution_results['stdout'] = ''.join(stdout_parts)
            
            return self.validate_output_smart(execution_results, expected_data, **kwargs)
        else:
            # Logique originale pour les autres types
            return self._validate_generic_notebook_output(actual_output, expected_data, **kwargs)
    
    def _validate_generic_notebook_output(self, actual_output: List, expected_data: Dict, **kwargs) -> bool:
        """Validation générique pour les autres types de tests (legacy)"""
        if not expected_data:
            return len(actual_output) > 0
        
        # Validation basique - vérifier qu'il y a des outputs
        if expected_data.get('min_outputs', 0) > 0:
            if len(actual_output) < expected_data['min_outputs']:
                return False
        
        # Validation des types de sortie spécifiques
        if 'required_output_types' in expected_data:
            required_types = set(expected_data['required_output_types'])
            actual_types = set(output.get('type') for output in actual_output)
            if not required_types.issubset(actual_types):
                return False
        
        return True

class DataVisualizationService(BaseExecutionService):
    """Service de validation pour les visualisations de données"""
    
    def execute(self, content: str, testcase: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Valide une visualisation de données"""
        try:
            # Parse du contenu de visualisation
            if isinstance(content, str):
                viz_data = json.loads(content)
            else:
                viz_data = content
            
            # Valider la structure
            expected_viz = testcase.get('expected_visualization', {})
            passed = self.validate_output(viz_data, expected_viz, **kwargs)
            
            # Analyser les propriétés
            analysis = {
                'type': viz_data.get('type', 'unknown'),
                'data_points': len(viz_data.get('data', [])),
                'has_title': bool(viz_data.get('title')),
                'has_labels': bool(viz_data.get('labels')),
                'axes': viz_data.get('axes', {})
            }
            
            return {
                'success': True,
                'passed': passed,
                'visualization_type': analysis['type'],
                'data_points': analysis['data_points'],
                'properties': analysis
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Visualization validation error: {str(e)}',
                'passed': False
            }
    
    def validate_output(self, actual_viz: Dict, expected_viz: Dict, **kwargs) -> bool:
        """Valide la structure d'une visualisation"""
        if not expected_viz:
            return True
        
        # Vérifier le type
        if expected_viz.get('type') and actual_viz.get('type') != expected_viz['type']:
            return False
        
        # Vérifier les axes
        expected_axes = expected_viz.get('axes', {})
        actual_axes = actual_viz.get('axes', {})
        
        for axis, expected_field in expected_axes.items():
            if actual_axes.get(axis) != expected_field:
                return False
        
        # Vérifier le nombre de points
        min_data_points = expected_viz.get('min_data_points', 0)
        actual_data_points = len(actual_viz.get('data', []))
        
        if actual_data_points < min_data_points:
            return False
        
        return True

class StatisticalAnalysisService(BaseExecutionService):
    """Service de validation pour les analyses statistiques"""
    
    def execute(self, content: str, testcase: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Valide une analyse statistique"""
        try:
            # Parse des résultats
            if isinstance(content, str):
                analysis_results = json.loads(content)
            else:
                analysis_results = content
            
            # Valider contre les assertions
            assertions = testcase.get('statistical_assertions', {})
            passed = self.validate_output(analysis_results, assertions, **kwargs)
            
            return {
                'success': True,
                'passed': passed,
                'analysis_results': analysis_results
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Statistical analysis error: {str(e)}',
                'passed': False
            }
    
    def validate_output(self, actual_results: Dict, statistical_assertions: Dict, **kwargs) -> bool:
        """Valide les résultats statistiques"""
        if not statistical_assertions:
            return True
        
        tolerance = kwargs.get('numerical_tolerance', 0.001)
        
        for assertion, expected_value in statistical_assertions.items():
            actual_value = actual_results.get(assertion)
            
            if actual_value is None:
                return False
            
            if isinstance(expected_value, (int, float)) and isinstance(actual_value, (int, float)):
                if abs(actual_value - expected_value) > tolerance:
                    return False
            else:
                if str(actual_value) != str(expected_value):
                    return False
        
        return True

class ExecutionServiceFactory:
    """Factory pour créer les services d'exécution appropriés"""
    
    _services = {
        ExecutionEnvironment.CODE_EXECUTOR: CodeExecutionService,
        ExecutionEnvironment.SQL_DATABASE: SQLExecutionService,
        ExecutionEnvironment.JUPYTER_NOTEBOOK: NotebookExecutionService,
        ExecutionEnvironment.DATA_VISUALIZATION: DataVisualizationService,
        ExecutionEnvironment.FILE_ANALYSIS: StatisticalAnalysisService,
    }
    
    @classmethod
    def get_service(cls, environment: ExecutionEnvironment) -> BaseExecutionService:
        """Retourne le service d'exécution approprié"""
        service_class = cls._services.get(environment)
        if not service_class:
            raise ValueError(f"Unsupported execution environment: {environment.value}")
        
        return service_class()
    
    @classmethod
    def register_service(cls, environment: ExecutionEnvironment, service_class: type):
        """Enregistre un nouveau service d'exécution"""
        cls._services[environment] = service_class