from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List
import os

app = FastAPI()

# Serve static files (e.g., HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Pydantic model for POST request
class CalculationRequest(BaseModel):
    numbers: List[float]
    operation: str

# Root route to serve an HTML UI
@app.get("/", response_class=HTMLResponse)
async def serve_ui(request: Request):
    with open(os.path.join("static", "index.html")) as f:
        return HTMLResponse(content=f.read())

# GET method to perform calculations via query parameter
@app.get("/api/calculate")
async def calculate_numbers_get(numbers: str, operation: str = "add"):
    try:
        num_list = [float(n) for n in numbers.split(",") if n]
        
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
            
        return {"result": result, "operation": operation}
        
    except ValueError:
        return {"error": "Invalid input. Please provide numbers separated by commas"}

# POST method to perform calculations via JSON
@app.post("/api/calculate")
async def calculate_numbers_post(request: CalculationRequest):
    numbers = request.numbers
    operation = request.operation
    
    if len(numbers) < 2:
        return {"error": "Please provide at least 2 numbers"}
    
    if operation == "add":
        result = sum(numbers)
    elif operation == "subtract":
        result = numbers[0] - sum(numbers[1:])
    elif operation == "multiply":
        result = 1
        for num in numbers:
            result *= num
    elif operation == "divide":
        result = numbers[0]
        for num in numbers[1:]:
            if num == 0:
                return {"error": "Division by zero is not allowed"}
            result /= num
    else:
        return {"error": "Invalid operation"}
        
    return {"result": result, "operation": operation}

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
