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
class AddRequest(BaseModel):
    numbers: List[float]

# Root route to serve an HTML UI
@app.get("/", response_class=HTMLResponse)
async def serve_ui(request: Request):
    with open(os.path.join("static", "index.html")) as f:
        return HTMLResponse(content=f.read())

# GET method to add numbers via query parameter
@app.get("/api/add")
async def add_numbers_get(numbers: str):
    try:
        num_list = [float(n) for n in numbers.split(",") if n]
        return {"result": sum(num_list)}
    except ValueError:
        return {"error": "Invalid input. Please provide numbers separated by commas"}

# POST method to add numbers via JSON
@app.post("/api/add")
async def add_numbers_post(request: AddRequest):
    return {"result": sum(request.numbers)}

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
