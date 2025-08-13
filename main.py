from fastapi import FastAPI
from pydantic import BaseModel
import threading
import uvicorn
import socket
import time
from fastapi.staticfiles import StaticFiles
import os
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

class AddRequest(BaseModel):
    num1: int
    num2: int

@app.get("/add")
def add_get(num1: int, num2: int):
    return {"result": num1 + num2}

@app.post("/add")
def add_post(request: AddRequest):
    """POST endpoint that adds two numbers provided in JSON body"""
    result = request.num1 + request.num2 
    return{"result": result}     

selected_port = None

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def run_server():
    global selected_port
    port = 8000
    while is_port_in_use(port):
        print(f"Port {port} in use, trying next port...")
        port += 1
        time.sleep(1)
    
    selected_port = port
    uvicorn.run(app, host="0.0.0.0", port=port)

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

# Wait for port selection
while selected_port is None:
    time.sleep(0.1)
 
print(f"\nServer running on port {selected_port}")
print(f"Try these URLs:")
print(f"- GET: http://localhost:{selected_port}/add?num1=12&num2=6")
print(f"- POST Docs: http://localhost:{selected_port}/docs")
print("\nPress any key to stop the server...")