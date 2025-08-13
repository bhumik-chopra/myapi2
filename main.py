from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os

app = FastAPI()

# Serve static files (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_ui(request: Request):
    # Serve the HTML file from static directory
    with open(os.path.join("static", "index.html")) as f:
        return HTMLResponse(content=f.read(), status_code=200)

# API endpoints
@app.get("/api/add")
def add_get(num1: int, num2: int):
    return {"result": num1 + num2}

@app.post("/api/add")
def add_post(num1: int, num2: int):
    return {"result": num1 + num2}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
