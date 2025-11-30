# ml/task_predictor_file.py - FIXED VERSION
import sys
import json
import os

# Import from the main predictor
try:
    from task_predictor import predict_from_json
except ImportError as e:
    print(f"Import error: {e}", file=sys.stderr)
    sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == '--file':
        try:
            input_file = sys.argv[2]
            print(f"Debug: Reading from file: {input_file}", file=sys.stderr)
            
            # Check if file exists
            if not os.path.exists(input_file):
                error_result = {
                    'success': False,
                    'error': f'File not found: {input_file}',
                    'tasks': [],
                    'overall_confidence': 0
                }
                print(json.dumps(error_result))
                sys.exit(1)
            
            # Read input from file with proper encoding
            with open(input_file, 'r', encoding='utf-8') as f:
                file_content = f.read()
                print(f"Debug: File content: {file_content}", file=sys.stderr)
                input_data = json.loads(file_content)
            
            print(f"Debug: Successfully parsed data: {input_data}", file=sys.stderr)
            
            # Make prediction
            result = predict_from_json(input_data)
            print(json.dumps(result))
            
        except json.JSONDecodeError as e:
            print(f"Debug: JSON decode error: {e}", file=sys.stderr)
            error_result = {
                'success': False,
                'error': f'JSON parsing failed: {str(e)}',
                'tasks': [],
                'overall_confidence': 0
            }
            print(json.dumps(error_result))
        except Exception as e:
            print(f"Debug: General error: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            error_result = {
                'success': False,
                'error': str(e),
                'tasks': [],
                'overall_confidence': 0
            }
            print(json.dumps(error_result))