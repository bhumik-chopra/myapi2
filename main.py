from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
import re
import os 
import operator

app = FastAPI()

# Serve static files (e.g., HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Pydantic model for POST request
class CalculationRequest(BaseModel):
    expression: str

class ComplexCalculationRequest(BaseModel):
    numbers: List[float]
    operations: List[str]

# Root route to serve an HTML UI
@app.get("/", response_class=HTMLResponse)
async def serve_ui(request: Request):
    with open(os.path.join("static", "index.html")) as f:
        return HTMLResponse(content=f.read())

# Simple calculation endpoint (for backward compatibility)
@app.get("/api/calculate")
async def calculate_numbers_get(numbers: str, operation: str = "add", previous_result: Optional[float] = None):
    try:
        num_list = [float(n) for n in numbers.split(",") if n]
        
        if previous_result is not None:
            num_list = [previous_result] + num_list
        
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

# Complex expression evaluation endpoint
@app.post("/api/calculate/complex")
async def calculate_complex_expression(request: CalculationRequest):
    try:
        expression = request.expression.strip()
        
        if not expression:
            return {"error": "Please provide an expression"}
        
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

@app.post("/api/calculate/sequential")
async def calculate_sequential_operations(request: ComplexCalculationRequest):
    try:
        numbers = request.numbers
        operations = request.operations
        
        if len(numbers) < 2:
            return {"error": "Please provide at least 2 numbers"}
        
        if len(operations) != len(numbers) - 1:
            return {"error": "Number of operations should be one less than numbers"}
        
        result = numbers[0]
        expression_parts = [str(numbers[0])]
        
        for i, operation in enumerate(operations):
            next_num = numbers[i + 1]
            
            if operation == 'add':
                result += next_num
                expression_parts.append(f" + {next_num}")
            elif operation == 'subtract':
                result -= next_num
                expression_parts.append(f" - {next_num}")
            elif operation == 'multiply':
                result *= next_num
                expression_parts.append(f" × {next_num}")
            elif operation == 'divide':
                if next_num == 0:
                    return {"error": "Division by zero is not allowed"}
                result /= next_num
                expression_parts.append(f" ÷ {next_num}")
            else:
                return {"error": f"Invalid operation: {operation}"}
        
        expression = ''.join(expression_parts)
        
        return {
            "result": result,
            "expression": expression,
            "type": "sequential"
        }
        
    except Exception as e:
        return {"error": f"Error in sequential calculation: {str(e)}"}

def evaluate_expression(expression):
    """Safely evaluate mathematical expression with operator precedence"""
    # Remove spaces
    expression = expression.replace(' ', '')
    
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
    # Pattern to match numbers (including decimals) and operators
    pattern = r'(-?\d+\.?\d*)([\+\-\*/])(-?\d+\.?\d*)'
    
    while True:
        match = re.search(pattern, expression)
        if not match:
            break
            
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
            
            # Replace the operation with its result
            expression = expression.replace(match.group(0), str(result), 1)
        else:
            break
    
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
    uvicorn.run(app, host="0.0.0.0", port=8000)

