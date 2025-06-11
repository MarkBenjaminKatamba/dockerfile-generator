import ollama
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def build_dockerfile_prompt(language: str, specifications: Optional[str] = None) -> str:
    base = (
        """
ONLY Generate an ideal Dockerfile for {language} with best practices. DO NOT provide any descriptions.
Include:
- Base image
- Installing dependencies
- Setting working directory
- Adding source code
- Running the application
""".format(language=language)
    )
    if specifications and specifications.strip():
        base += f"\nIn addition, the Dockerfile should satisfy these user specifications: {specifications.strip()}"
    return base

EXPLANATION_PROMPT = """
Please provide a comprehensive explanation of the following Dockerfile, including:
1. What each instruction does
2. Why certain choices were made
3. Best practices used
4. Potential optimizations

Dockerfile:
{dockerfile}
"""

class LanguageRequest(BaseModel):
    language: str
    specifications: Optional[str] = None

class DockerfileResponse(BaseModel):
    dockerfile: str
    explanation: Optional[str] = None

def generate_dockerfile(language: str, specifications: Optional[str] = None) -> str:
    prompt = build_dockerfile_prompt(language, specifications)
    response = ollama.chat(model='llama3.2:3b', messages=[{'role': 'user', 'content': prompt}])
    return response['message']['content']

def generate_explanation(dockerfile: str) -> str:
    response = ollama.chat(model='llama3.2:3b', messages=[{'role': 'user', 'content': EXPLANATION_PROMPT.format(dockerfile=dockerfile)}])
    return response['message']['content']

@app.post("/api/generate", response_model=DockerfileResponse)
async def generate(request: LanguageRequest):
    dockerfile = generate_dockerfile(request.language, request.specifications)
    return DockerfileResponse(dockerfile=dockerfile)

@app.post("/api/explain", response_model=DockerfileResponse)
async def explain(request: LanguageRequest):
    dockerfile = generate_dockerfile(request.language, request.specifications)
    explanation = generate_explanation(dockerfile)
    return DockerfileResponse(dockerfile=dockerfile, explanation=explanation)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)