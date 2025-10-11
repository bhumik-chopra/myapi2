from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
import re
import os
import math

app = FastAPI()

# Serve static files (e.g., HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Pydantic models
class CalculationRequest(BaseModel):
    expression: str

class ScientificRequest(BaseModel):
    number: float
    operation: str

class MatrixOperationRequest(BaseModel):
    matrix1: List[List[float]]
    matrix2: List[List[float]]
    operation: str

# Root route to serve an HTML UI
@app.get("/", response_class=HTMLResponse)
async def serve_ui(request: Request):
    static_dir = "static"
    index_file = os.path.join(static_dir, "index.html")
    
    if not os.path.exists(static_dir):
        return HTMLResponse(content="<h1>Static directory not found</h1>", status_code=404)
    
    if not os.path.exists(index_file):
        return HTMLResponse(content="<h1>index.html not found in static directory</h1>", status_code=404)
    
    try:
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except Exception as e:
        return HTMLResponse(content=f"<h1>Error reading file: {str(e)}</h1>", status_code=500)

# Simple calculation endpoint
@app.get("/api/calculate")
async def calculate_numbers_get(numbers: str, operation: str = "add", previous_result: Optional[str] = None):
    try:
        num_list = [float(n) for n in numbers.split(",") if n.strip()]
        
        # Handle previous_result properly
        if previous_result and previous_result.strip() and previous_result != "null":
            try:
                prev_result_float = float(previous_result)
                num_list = [prev_result_float] + num_list
            except ValueError:
                # If previous_result is invalid, just use the current numbers
                pass
        
        if len(num_list) < 2:
            return {"error": "Please provide at least 2 numbers"}
        
        if operation == "add":
            result = sum(num_list)
        elif operation == "subtract":
            result = num_list[0] - sum(num_list[1:])
        elif operation == "multiply":
            result = 1
            for num in num_list:
                result *= num
        elif operation == "divide":
            result = num_list[0]
            for num in num_list[1:]:
                if num == 0:
                    return {"error": "Division by zero is not allowed"}
                result /= num
        else:
            return {"error": "Invalid operation"}
            
        return {
            "result": result, 
            "operation": operation,
            "expression": generate_expression(num_list, operation)
        }
        
    except ValueError:
        return {"error": "Invalid input. Please provide numbers separated by commas"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

# Complex expression evaluation endpoint
@app.post("/api/calculate/complex")
async def calculate_complex_expression(request: CalculationRequest):
    try:
        expression = request.expression.strip()
        
        if not expression:
            return {"error": "Please provide an expression"}
        
        # Replace UI symbols with backend symbols
        expression = expression.replace('×', '*').replace('÷', '/')
        
        # Validate expression contains only numbers and allowed operators
        if not re.match(r'^[\d+\-*/().\s]+$', expression):
            return {"error": "Invalid characters in expression"}
        
        # Evaluate the expression safely
        result = evaluate_expression(expression)
        
        return {
            "result": result,
            "expression": expression,
            "type": "complex"
        }
        
    except Exception as e:
        return {"error": f"Error evaluating expression: {str(e)}"}

# Scientific operations endpoint
@app.post("/api/calculate/scientific")
async def calculate_scientific(request: ScientificRequest):
    try:
        number = request.number
        operation = request.operation
        
        operations = {
            'sin': math.sin,
            'cos': math.cos,
            'tan': math.tan,
            'log': math.log10,
            'ln': math.log,
            'sqrt': math.sqrt,
            'square': lambda x: x**2,
            'cube': lambda x: x**3,
            'exp': math.exp,
            'factorial': factorial,
            'abs': abs,
            'ceil': math.ceil,
            'floor': math.floor,
            'radians': math.radians,
            'degrees': math.degrees,
            'pi': lambda x: math.pi,
            'e': lambda x: math.e,
            'sin_rad': math.sin,
            'cos_rad': math.cos,
            'tan_rad': math.tan,
            'power10': lambda x: 10**x,
            'power2': lambda x: 2**x
        }
        
        if operation not in operations:
            return {"error": f"Unsupported scientific operation: {operation}"}
        
        # Handle special cases
        if operation == 'factorial' and (number < 0 or number != int(number)):
            return {"error": "Factorial requires non-negative integer"}
        
        if operation in ['log', 'ln'] and number <= 0:
            return {"error": "Logarithm requires positive number"}
        
        if operation == 'sqrt' and number < 0:
            return {"error": "Square root requires non-negative number"}
        
        # Convert degrees to radians for trigonometric functions (except *_rad functions)
        if operation in ['sin', 'cos', 'tan']:
            number = math.radians(number)
        
        if operation in ['pi', 'e']:
            result = operations[operation](0)  # These don't need the input number
        else:
            result = operations[operation](number)
        
        operation_symbols = {
            'sin': f'sin({request.number}°)',
            'cos': f'cos({request.number}°)',
            'tan': f'tan({request.number}°)',
            'sin_rad': f'sin({request.number} rad)',
            'cos_rad': f'cos({request.number} rad)',
            'tan_rad': f'tan({request.number} rad)',
            'log': f'log({request.number})',
            'ln': f'ln({request.number})',
            'sqrt': f'√({request.number})',
            'square': f'({request.number})²',
            'cube': f'({request.number})³',
            'exp': f'e^({request.number})',
            'factorial': f'({request.number})!',
            'abs': f'|{request.number}|',
            'ceil': f'ceil({request.number})',
            'floor': f'floor({request.number})',
            'radians': f'radians({request.number}°)',
            'degrees': f'degrees({request.number}rad)',
            'pi': 'π',
            'e': 'e',
            'power10': f'10^({request.number})',
            'power2': f'2^({request.number})'
        }
        
        return {
            "result": result,
            "expression": operation_symbols[operation],
            "type": "scientific"
        }
        
    except Exception as e:
        return {"error": f"Error in scientific calculation: {str(e)}"}

# Matrix operations endpoint (manual implementation)
@app.post("/api/calculate/matrix")
async def calculate_matrix_operation(request: MatrixOperationRequest):
    try:
        matrix1 = request.matrix1
        matrix2 = request.matrix2
        operation = request.operation
        
        if operation == 'add':
            if len(matrix1) != len(matrix2) or len(matrix1[0]) != len(matrix2[0]):
                return {"error": "Matrices must have same dimensions for addition"}
            result = matrix_add(matrix1, matrix2)
            expression = "Matrix Addition"
            
        elif operation == 'subtract':
            if len(matrix1) != len(matrix2) or len(matrix1[0]) != len(matrix2[0]):
                return {"error": "Matrices must have same dimensions for subtraction"}
            result = matrix_subtract(matrix1, matrix2)
            expression = "Matrix Subtraction"
            
        elif operation == 'multiply':
            if len(matrix1[0]) != len(matrix2):
                return {"error": "Number of columns in first matrix must equal number of rows in second matrix"}
            result = matrix_multiply(matrix1, matrix2)
            expression = "Matrix Multiplication"
            
        elif operation == 'elementwise_multiply':
            if len(matrix1) != len(matrix2) or len(matrix1[0]) != len(matrix2[0]):
                return {"error": "Matrices must have same dimensions for element-wise multiplication"}
            result = matrix_elementwise_multiply(matrix1, matrix2)
            expression = "Element-wise Multiplication"
            
        elif operation == 'determinant1':
            if len(matrix1) != len(matrix1[0]):
                return {"error": "Matrix must be square for determinant calculation"}
            result = matrix_determinant(matrix1)
            expression = f"det(A) = {result:.6f}"
            
        elif operation == 'determinant2':
            if len(matrix2) != len(matrix2[0]):
                return {"error": "Matrix must be square for determinant calculation"}
            result = matrix_determinant(matrix2)
            expression = f"det(B) = {result:.6f}"
            
        elif operation == 'transpose1':
            result = matrix_transpose(matrix1)
            expression = "Transpose of Matrix A"
            
        elif operation == 'transpose2':
            result = matrix_transpose(matrix2)
            expression = "Transpose of Matrix B"
            
        elif operation == 'scalar_multiply1':
            # For scalar multiplication, we'll use the first element of matrix2 as scalar
            if len(matrix2) == 1 and len(matrix2[0]) == 1:
                scalar = matrix2[0][0]
                result = matrix_scalar_multiply(matrix1, scalar)
                expression = f"Scalar Multiplication: {scalar} × A"
            else:
                return {"error": "For scalar multiplication, second matrix should be 1x1"}
            
        elif operation == 'scalar_multiply2':
            # For scalar multiplication, we'll use the first element of matrix1 as scalar
            if len(matrix1) == 1 and len(matrix1[0]) == 1:
                scalar = matrix1[0][0]
                result = matrix_scalar_multiply(matrix2, scalar)
                expression = f"Scalar Multiplication: {scalar} × B"
            else:
                return {"error": "For scalar multiplication, first matrix should be 1x1"}
            
        else:
            return {"error": f"Unsupported matrix operation: {operation}"}
        
        return {
            "result": result,
            "expression": expression,
            "type": "matrix",
            "operation": operation
        }
        
    except Exception as e:
        return {"error": f"Error in matrix operation: {str(e)}"}

# Matrix operations implementation
def matrix_add(A, B):
    return [[A[i][j] + B[i][j] for j in range(len(A[0]))] for i in range(len(A))]

def matrix_subtract(A, B):
    return [[A[i][j] - B[i][j] for j in range(len(A[0]))] for i in range(len(A))]

def matrix_multiply(A, B):
    result = [[0 for _ in range(len(B[0]))] for _ in range(len(A))]
    for i in range(len(A)):
        for j in range(len(B[0])):
            for k in range(len(B)):
                result[i][j] += A[i][k] * B[k][j]
    return result

def matrix_elementwise_multiply(A, B):
    return [[A[i][j] * B[i][j] for j in range(len(A[0]))] for i in range(len(A))]

def matrix_scalar_multiply(A, scalar):
    return [[A[i][j] * scalar for j in range(len(A[0]))] for i in range(len(A))]

def matrix_transpose(A):
    return [[A[j][i] for j in range(len(A))] for i in range(len(A[0]))]

def matrix_determinant(A):
    n = len(A)
    if n == 1:
        return A[0][0]
    elif n == 2:
        return A[0][0] * A[1][1] - A[0][1] * A[1][0]
    elif n == 3:
        return (A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
                A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
                A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]))
    else:
        # For 4x4 matrices
        if n == 4:
            det = 0
            for j in range(4):
                minor = []
                for i in range(1, 4):
                    row = []
                    for k in range(4):
                        if k != j:
                            row.append(A[i][k])
                    minor.append(row)
                det += ((-1) ** j) * A[0][j] * matrix_determinant(minor)
            return det
        else:
            raise ValueError("Determinant calculation supported only for matrices up to 4x4")

def factorial(n):
    if n == 0:
        return 1
    result = 1
    for i in range(1, int(n) + 1):
        result *= i
    return result

def evaluate_expression(expression):
    """Safely evaluate mathematical expression with operator precedence"""
    # Remove spaces
    expression = expression.replace(' ', '')
    
    # Handle negative numbers at the beginning
    if expression.startswith('-'):
        expression = '0' + expression
    
    # Handle parentheses first
    while '(' in expression:
        expression = solve_parentheses(expression)
    
    # Then handle multiplication and division
    expression = solve_operations(expression, ['*', '/'])
    
    # Finally handle addition and subtraction
    expression = solve_operations(expression, ['+', '-'])
    
    return float(expression)

def solve_parentheses(expression):
    """Solve expressions within parentheses"""
    def replace_parentheses(match):
        inner_expr = match.group(1)
        # Handle negative numbers at the beginning of parentheses
        if inner_expr.startswith('-'):
            inner_expr = '0' + inner_expr
        # Solve the inner expression
        inner_expr = solve_operations(inner_expr, ['*', '/'])
        inner_expr = solve_operations(inner_expr, ['+', '-'])
        return inner_expr
    
    pattern = r'\(([^()]+)\)'
    while re.search(pattern, expression):
        expression = re.sub(pattern, replace_parentheses, expression)
    return expression

def solve_operations(expression, operators):
    """Solve specific operations in expression"""
    # Improved pattern to handle negative numbers and consecutive operators
    pattern = r'(-?\d+\.?\d*)([\+\-\*/])(-?\d+\.?\d*)'
    
    # Find all matches first to avoid infinite loops
    matches = list(re.finditer(pattern, expression))
    
    for match in matches:
        left = float(match.group(1))
        op = match.group(2)
        right = float(match.group(3))
        
        if op in operators:
            if op == '+':
                result = left + right
            elif op == '-':
                result = left - right
            elif op == '*':
                result = left * right
            elif op == '/':
                if right == 0:
                    raise ValueError("Division by zero")
                result = left / right
            
            # Replace only this specific occurrence
            expression = expression.replace(match.group(0), str(result), 1)
            break  # Restart after each replacement
    
    return expression

def generate_expression(numbers, operation):
    symbols = {
        'add': '+',
        'subtract': '-',
        'multiply': '×',
        'divide': '÷'
    }
    symbol = symbols.get(operation, '+')
    return f" {symbol} ".join(str(num) for num in numbers)

# Run the server
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
