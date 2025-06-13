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

# Define language-specific best practices and common patterns
LANGUAGE_CONTEXT = {
    "Node.js": """
For Node.js applications, prioritize:
- Multi-stage builds: a 'builder' stage for `npm install` (including dev dependencies) and `npm run build` (for TypeScript compilation or asset bundling), and a 'production' stage for the compiled output and production-only dependencies.
- Base image: `node:<version>-alpine` (e.g., `node:22-alpine` or `node:lts-alpine`) for a small footprint.
- Dependency management: Copy `package.json` and `package-lock.json` (or `yarn.lock`) first to leverage Docker's build cache. Use `npm ci --production` in the final stage.
- Non-root user: Run the application as a non-root user (e.g., `node` user) for security.
- Environment: Set `NODE_ENV=production`.
- Entry point: Typically `CMD ["node", "dist/index.js"]` or `CMD ["npm", "start"]`.
- Port: Expose relevant application port (e.g., 3000, 8080).
""",
    "Python": """
For Python applications, prioritize:
- Multi-stage builds: a 'builder' stage for `pip install` (including build dependencies) and a 'production' stage for installed packages and application code.
- Base image: `python:<version>-slim-bullseye` (e.g., `python:3.11-slim-bullseye`) for a balanced size/feature set, or `python:<version>-alpine` if strict minimal.
- Dependency management: Copy `requirements.txt` first. Use `pip install --no-cache-dir -r requirements.txt`.
- Environment: Set `PYTHONUNBUFFERED=1` for immediate log output.
- Non-root user: Run as a non-root user.
- Entry point: `CMD ["gunicorn", ...]`, `CMD ["python", "app.py"]`, or specific web server commands.
- Port: Expose relevant application port (e.g., 8000 for FastAPI/Django).
""",
    "Java": """
For Java applications (Spring Boot, Quarkus, etc.), prioritize:
- Multi-stage builds: a 'builder' stage for Maven/Gradle build (`mvn package`, `gradle build`), and a 'runner' stage for a JRE (Java Runtime Environment) and the final JAR/WAR.
- Base image: `eclipse-temurin:<version>-jdk-focal` (for builder) and `eclipse-temurin:<version>-jre-focal` (for runner), or `alpine` variants for minimalism.
- Application packaging: Copy the compiled JAR/WAR.
- Memory: Set `JAVA_TOOL_OPTIONS` for JVM memory tuning (e.g., `-Xmx256m`).
- Entry point: `ENTRYPOINT ["java", "-jar", "app.jar"]`.
- Port: Expose relevant application port (e.g., 8080).
""",
    "Go": """
For Go applications, prioritize:
- Multi-stage builds: a 'builder' stage using `golang:<version>-alpine` for compilation, and a 'final' stage using `scratch` or `alpine` for the statically linked executable.
- Static compilation: Ensure `CGO_ENABLED=0` and `GOOS=linux` during build.
- Minimal final image: Copy only the compiled binary to the final stage.
- Entry point: `CMD ["./app-name"]`.
- Port: Expose relevant application port.
""",
    "Ruby": """
For Ruby applications (e.g., Rails), prioritize:
- Multi-stage builds: a 'builder' stage for `bundle install` (often with `--without development test`) and asset precompilation, and a 'production' stage for the application and vendored gems.
- Base image: `ruby:<version>-alpine` or `ruby:<version>-slim`.
- Dependency management: Use `BUNDLE_PATH` for vendored gems.
- Non-root user: Run as a non-root user.
- Entry point: `CMD ["bundle", "exec", "rails", "s", "-b", "0.0.0.0", "-p", "3000"]` for Rails, or specific Rack server commands.
- Port: Expose relevant application port (e.g., 3000).
""",
    "PHP": """
For PHP applications (e.g., Laravel, Symfony), prioritize:
- Multi-stage builds: a 'composer' stage for installing Composer dependencies (`composer install --no-dev --optimize-autoloader`), and a 'final' stage with PHP-FPM or Apache/Nginx.
- Base image: `php:<version>-fpm-alpine` (for FPM) or `php:<version>-apache` (for Apache).
- Web server setup: Include Nginx or Apache configuration if serving web content.
- Permissions: Set proper permissions for web server and application directories.
- Entry point: `CMD ["php-fpm"]` or `CMD ["apache2-foreground"]`.
- Port: Expose relevant application port (e.g., 80, 8080).
""",
    "Rust": """
For Rust applications, prioritize:
- Multi-stage builds: a 'builder' stage using `rust:<version>-slim-buster` or `rust:<version>-alpine` for compiling the release binary, and a 'final' stage using `scratch` or `alpine`.
- Compilation: Use `cargo build --release`.
- Minimal final image: Copy only the compiled release binary to the final stage.
- Entry point: `CMD ["./target/release/app-name"]`.
- Port: Expose relevant application port.
""",
    "C#": """
For C# (.NET Core/.NET) applications, prioritize:
- Multi-stage builds: an 'sdk' stage using `mcr.microsoft.com/dotnet/sdk:<version>` for restoring dependencies, building, and publishing, and an 'aspnet' stage using `mcr.microsoft.com/dotnet/aspnet:<version>` for runtime.
- Build process: `dotnet restore`, `dotnet build`, `dotnet publish`.
- Entry point: `ENTRYPOINT ["dotnet", "App.dll"]`.
- Port: Expose relevant application port (e.g., 8080).
""",
    "C++": """
For C++ applications, prioritize:
- Multi-stage builds: a 'builder' stage using a compiler image (e.g., `gcc:latest`, `ubuntu:latest` with `build-essential`) for compilation, and a 'final' stage using a minimal base image (e.g., `alpine`, `debian:slim`).
- Compilation: Use appropriate `g++` or `clang++` commands. Link static libraries where possible.
- Minimal final image: Copy only the compiled executable to the final stage.
- Entry point: `CMD ["./app-name"]`.
- Port: Expose relevant application port if it's a networked application.
""",
    "TypeScript": """
For TypeScript applications, follow Node.js best practices with an emphasis on the compilation step.
- Multi-stage builds: a 'builder' stage for `npm install` and `npm run build` (which typically invokes `tsc`).
- Base image: `node:<version>-alpine`.
- Build output: Ensure the `dist` or `build` folder containing compiled JavaScript is copied to the final stage.
- Entry point: `CMD ["node", "dist/index.js"]`.
"""
}

def build_dockerfile_prompt(language: str, specifications: Optional[str] = None) -> str:
    # General instructions for a PRODUCTION-READY Dockerfile
    base_prompt = f"""
Generate a PRODUCTION-READY Dockerfile for a {language} application.
The Dockerfile must adhere to the following principles for robust production deployment:
- **Security**: Use minimal base images, run as a non-root user when possible, and ensure only necessary components are included.
- **Efficiency**: Leverage multi-stage builds, optimize caching for faster rebuilds, and keep the final image size as small as possible.
- **Reliability**: Include necessary environment configurations, and consider health checks if applicable.
- **Maintainability**: Structure the Dockerfile logically, use clear comments for complex steps.

Include the following essential components:
1.  **Base Image Selection**: Choose a suitable, versioned base image (e.g., `node:lts-alpine`, `python:3.11-slim-bullseye`).
2.  **Working Directory**: Set a dedicated working directory.
3.  **Dependency Management**: Copy dependency files first to optimize layer caching, then install dependencies.
4.  **Source Code**: Copy application source code.
5.  **Build Process**: Include steps for compiling or building the application if necessary (e.g., `npm run build`, `dotnet publish`, `mvn package`, `cargo build --release`).
6.  **Runtime Configuration**: Set environment variables crucial for production.
7.  **User**: Define a non-root user for running the application in the final stage.
8.  **Port Exposure**: Expose the port(s) your application listens on.
9.  **Entry Point/Command**: Define how the application starts.

"""
    
    # Add language-specific context if available
    if language in LANGUAGE_CONTEXT:
        base_prompt += f"""
Specific considerations for {language} applications:
{LANGUAGE_CONTEXT[language]}
"""

    # Add user-provided specifications
    if specifications and specifications.strip():
        base_prompt += f"""
User's Additional Specifications:
- {specifications.strip().replace('\n', '\n- ')}
"""

    base_prompt += f"""
You are a senior developer. Generate ONLY the complete, executable Dockerfile content. DO NOT include any introductory or concluding remarks, explanations, or markdown formatting outside of the Dockerfile content itself. Ensure the Dockerfile is ready to be directly saved and built.
"""
    return base_prompt

EXPLANATION_PROMPT = """
Provide a comprehensive and professional explanation of the following Dockerfile, tailored for a senior developer.
The explanation should cover:

1.  **Architecture and Design Choices**:
    -   Detailed breakdown of each build stage (e.g., 'builder', 'sdk', 'final') and its specific purpose.
    -   Rationale behind the chosen base images (e.g., specific version, `alpine` variant, `slim` variant) including benefits (size, security).
    -   In-depth explanation of multi-stage build implementation, how it works, and why it's beneficial (e.g., reducing image size, separating build environment from runtime).

2.  **Security Best Practices**:
    -   How the Dockerfile implements security (e.g., using non-root users, minimizing attack surface by only copying necessary files, not including build tools in final image).
    -   Identification of any security-related environment variables or configurations.

3.  **Performance and Efficiency Optimizations**:
    -   Explanation of caching strategies (e.g., copying `package.json` first, using `npm ci`).
    -   Methods used to reduce the final image size (e.g., multi-stage builds, using minimal base images).
    -   Steps taken to optimize build time.

4.  **Production Readiness and Reliability**:
    -   Environment variable configuration (e.g., `NODE_ENV=production`, `PYTHONUNBUFFERED`).
    -   Considerations for logging and error handling within the container's setup.
    -   If applicable, suggestions for health checks or graceful shutdown.

5.  **General Dockerfile Best Practices**:
    -   Logical flow and structure of instructions.
    -   Usage of `WORKDIR`, `COPY`, `RUN`, `ENV`, `EXPOSE`, `CMD`/`ENTRYPOINT`.
    -   Any other advanced Dockerfile features or patterns employed.

Dockerfile:
```dockerfile
{dockerfile}
```
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
    return response['message']['content'].strip() # Ensure no extra whitespace/markdown

def generate_explanation(dockerfile: str) -> str:
    response = ollama.chat(model='llama3.2:3b', messages=[{'role': 'user', 'content': EXPLANATION_PROMPT.format(dockerfile=dockerfile)}])
    return response['message']['content'].strip() # Ensure no extra whitespace/markdown

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


# ========================================================================

# import ollama
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import Optional

# app = FastAPI()

# # Enable CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# def build_dockerfile_prompt(language: str, specifications: Optional[str] = None) -> str:
#     base = (
#         """
# ONLY Generate an ideal Dockerfile for {language} with best practices. DO NOT provide any descriptions.
# Include:
# - Base image
# - Installing dependencies
# - Setting working directory
# - Adding source code
# - Running the application
# """.format(language=language)
#     )
#     if specifications and specifications.strip():
#         base += f"\nIn addition, the Dockerfile should satisfy these user specifications: {specifications.strip()}"
#     return base

# EXPLANATION_PROMPT = """
# Please provide a comprehensive explanation of the following Dockerfile, including:
# 1. What each instruction does
# 2. Why certain choices were made
# 3. Best practices used
# 4. Potential optimizations

# Dockerfile:
# {dockerfile}
# """

# class LanguageRequest(BaseModel):
#     language: str
#     specifications: Optional[str] = None

# class DockerfileResponse(BaseModel):
#     dockerfile: str
#     explanation: Optional[str] = None

# def generate_dockerfile(language: str, specifications: Optional[str] = None) -> str:
#     prompt = build_dockerfile_prompt(language, specifications)
#     response = ollama.chat(model='llama3.2:3b', messages=[{'role': 'user', 'content': prompt}])
#     return response['message']['content']

# def generate_explanation(dockerfile: str) -> str:
#     response = ollama.chat(model='llama3.2:3b', messages=[{'role': 'user', 'content': EXPLANATION_PROMPT.format(dockerfile=dockerfile)}])
#     return response['message']['content']

# @app.post("/api/generate", response_model=DockerfileResponse)
# async def generate(request: LanguageRequest):
#     dockerfile = generate_dockerfile(request.language, request.specifications)
#     return DockerfileResponse(dockerfile=dockerfile)

# @app.post("/api/explain", response_model=DockerfileResponse)
# async def explain(request: LanguageRequest):
#     dockerfile = generate_dockerfile(request.language, request.specifications)
#     explanation = generate_explanation(dockerfile)
#     return DockerfileResponse(dockerfile=dockerfile, explanation=explanation)

# if __name__ == '__main__':
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)