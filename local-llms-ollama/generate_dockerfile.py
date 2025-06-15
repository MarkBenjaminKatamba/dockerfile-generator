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

# Define language-specific best practices and common patterns (Context for LLM)
# These will be embedded into the prompt's Context or Notes sections.
LANGUAGE_SPECIFIC_CONTEXT = {
    "Node.js": """
- Multi-stage builds: 'builder' stage for `npm install` and `npm run build`, 'production' stage for compiled output and production deps.
- Base image: `node:<version>-alpine` (e.g., `node:22-alpine` or `node:lts-alpine`).
- Dependency management: Copy `package.json` and `package-lock.json` first for build cache. Use `npm ci --production` in final stage.
- Non-root user: Run application as a non-root user (e.g., `node` user).
- Environment: Set `NODE_ENV=production`.
- Entry point: Typically `CMD ["node", "dist/index.js"]` or `CMD ["npm", "start"]`.
- Port: Expose relevant application port (e.g., 3000, 8080).
""",
    "Python": """
- Multi-stage builds: 'builder' stage for `pip install`, 'production' stage for installed packages and application code.
- Base image: `python:<version>-slim-bullseye` (e.g., `python:3.11-slim-bullseye`), or `python:<version>-alpine` for minimalism.
- Dependency management: Copy `requirements.txt` first. Use `pip install --no-cache-dir -r requirements.txt`.
- Environment: Set `PYTHONUNBUFFERED=1` for immediate log output.
- Non-root user: Run as a non-root user.
- Entry point: `CMD ["gunicorn", ...]`, `CMD ["python", "app.py"]`, or specific web server commands.
- Port: Expose relevant application port (e.g., 8000 for FastAPI/Django).
""",
    "Java": """
- Multi-stage builds: 'builder' stage for Maven/Gradle build, 'runner' stage for JRE and final JAR/WAR.
- Base image: `eclipse-temurin:<version>-jdk-focal` (builder) and `eclipse-temurin:<version>-jre-focal` (runner), or `alpine` variants.
- Application packaging: Copy the compiled JAR/WAR.
- Memory: Set `JAVA_TOOL_OPTIONS` for JVM memory tuning (e.g., `-Xmx256m`).
- Entry point: `ENTRYPOINT ["java", "-jar", "app.jar"]`.
- Port: Expose relevant application port (e.g., 8080).
""",
    "Go": """
- Multi-stage builds: 'builder' stage for compilation (`golang:<version>-alpine`), 'final' stage for statically linked executable (`scratch` or `alpine`).
- Static compilation: Ensure `CGO_ENABLED=0` and `GOOS=linux` during build.
- Minimal final image: Copy only the compiled binary to the final stage.
- Entry point: `CMD ["./app-name"]`.
- Port: Expose relevant application port.
""",
    "Ruby": """
- Multi-stage builds: 'builder' stage for `bundle install` and asset precompilation, 'production' stage for application and vendored gems.
- Base image: `ruby:<version>-alpine` or `ruby:<version>-slim`.
- Dependency management: Use `BUNDLE_PATH` for vendored gems.
- Non-root user: Run as a non-root user.
- Entry point: `CMD ["bundle", "exec", "rails", "s", "-b", "0.0.0.0", "-p", "3000"]` for Rails, or specific Rack server commands.
- Port: Expose relevant application port (e.g., 3000).
""",
    "PHP": """
- Multi-stage builds: 'composer' stage for `composer install`, 'final' stage with PHP-FPM or Apache/Nginx.
- Base image: `php:<version>-fpm-alpine` (for FPM) or `php:<version>-apache` (for Apache).
- Web server setup: Include Nginx or Apache configuration if serving web content.
- Permissions: Set proper permissions for web server and application directories.
- Entry point: `CMD ["php-fpm"]` or `CMD ["apache2-foreground"]`.
- Port: Expose relevant application port (e.g., 80, 8080).
""",
    "Rust": """
- Multi-stage builds: 'builder' stage (`rust:<version>-slim-buster` or `rust:<version>-alpine`) for compiling, 'final' stage (`scratch` or `alpine`).
- Compilation: Use `cargo build --release`.
- Minimal final image: Copy only the compiled release binary to the final stage.
- Entry point: `CMD ["./target/release/app-name"]`.
- Port: Expose relevant application port.
""",
    "C#": """
- Multi-stage builds: 'sdk' stage (`mcr.microsoft.com/dotnet/sdk:<version>`) for build/publish, 'aspnet' stage (`mcr.microsoft.com/dotnet/aspnet:<version>`) for runtime.
- Build process: `dotnet restore`, `dotnet build`, `dotnet publish`.
- Entry point: `ENTRYPOINT ["dotnet", "App.dll"]`.
- Port: Expose relevant application port (e.g., 8080).
""",
    "C++": """
- Multi-stage builds: 'builder' stage (`gcc:latest`, `ubuntu:latest` with `build-essential`) for compilation, 'final' stage (`alpine`, `debian:slim`).
- Compilation: Use appropriate `g++` or `clang++` commands. Link static libraries where possible.
- Minimal final image: Copy only the compiled executable to the final stage.
- Entry point: `CMD ["./app-name"]`.
- Port: Expose relevant application port if it's a networked application.
""",
    "TypeScript": """
- Follow Node.js best practices with emphasis on compilation.
- Multi-stage builds: 'builder' stage for `npm install` and `npm run build` (invokes `tsc`).
- Base image: `node:<version>-alpine`.
- Build output: Ensure `dist` or `build` folder with compiled JavaScript is copied to final stage.
- Entry point: `CMD ["node", "dist/index.js"]`.
"""
}

def build_dockerfile_prompt(
    language: str,
    specifications: Optional[str] = None,
    repo_info: Optional[dict] = None,
    include_comments: Optional[bool] = None
) -> str:
    # Initialize prompt sections
    role = "You are a world-class DevOps engineer and a Dockerfile expert."
    objective = f"Generate a PRODUCTION-READY Dockerfile for a {language} application."
    context_sections = [
        "The user needs a Dockerfile that adheres to Docker best practices for security, efficiency, reliability, and maintainability.",
        "Essential components to include: Base Image Selection, Working Directory, Dependency Management, Source Code, Build Process (if applicable), Runtime Configuration, User (non-root), Port Exposure, and Entry Point/Command.",
    ]
    instructions_sections = [
        "Generate ONLY the complete, executable Dockerfile content.",
        "DO NOT include any introductory or concluding remarks, explanations, or markdown formatting outside of the Dockerfile content itself.",
        "Ensure the Dockerfile is ready to be directly saved and built.",
    ]
    if include_comments:
        instructions_sections.append("Include relevant comments for each step in the Dockerfile to enhance readability and explain the purpose of each instruction.")

    notes_sections = []

    # Add language-specific context if available
    if language in LANGUAGE_SPECIFIC_CONTEXT:
        context_sections.append(f"Specific considerations for {language} applications:\n{LANGUAGE_SPECIFIC_CONTEXT[language]}")

    # Add user-provided specifications
    if specifications and specifications.strip():
        instructions_sections.append(f"The Dockerfile MUST satisfy these user specifications:\n- {specifications.strip().replace('\n', '\n- ')}")
        notes_sections.append("User specifications are paramount and must be reflected in the generated Dockerfile.")

    # Add GitHub Repository information (CONCEPTUAL - needs backend implementation to populate repo_info)
    if repo_info:
        context_sections.append(
            "The user has provided a GitHub repository URL. You must analyze the provided repository information to infer project details like dependencies, build commands, and entry points.\n" \
            f"Repository Detected Language: {repo_info.get('language', 'N/A')}\n" \
            f"Repository Dependencies: {repo_info.get('dependencies', 'N/A')}\n" \
            f"Repository Structure (relevant files/folders): {repo_info.get('structure', 'N/A')}\n" \
            f"Potential Entry Point: {repo_info.get('entry_point', 'N/A')}\n" \
            f"Potential Build Command: {repo_info.get('build_command', 'N/A')}"
        )
        instructions_sections.append("Use the repository information to generate the MOST appropriate and precise Dockerfile tailored to this specific project. Overwrite general assumptions if repository details contradict them.")
        notes_sections.append("The quality of the Dockerfile is directly tied to the accuracy of repository analysis provided. Prioritize project-specific details.")

    # Assemble the final prompt using the markdown structure
    prompt_parts = []
    prompt_parts.append(f"#**Role:** {role}")
    prompt_parts.append(f"#**Objective:** {objective}")
    prompt_parts.append(f"#**Context:**")
    for ctx in context_sections:
        prompt_parts.append(f"- {ctx}")
    prompt_parts.append(f"#**Instructions:**")
    for i, instr in enumerate(instructions_sections):
        prompt_parts.append(f"##**Instruction {i+1}:** {instr}")
    if notes_sections:
        prompt_parts.append(f"#**Notes:**")
        for note in notes_sections:
            prompt_parts.append(f"- {note}")

    return "\n\n".join(prompt_parts)

EXPLANATION_PROMPT_STRUCTURE = """
#**Role:** You are a senior DevOps expert and Docker architect.

#**Objective:** Provide a comprehensive and professional explanation of the provided Dockerfile.

#**Context:** The explanation is for a senior developer audience who needs to understand the intricate details and rationale behind the Dockerfile construction.

#**Instructions:**
##**Instruction 1:** Explain the Architecture and Design Choices:
- Detail each build stage (e.g., 'builder', 'sdk', 'final') and its specific purpose.
- Rationale behind the chosen base images (e.g., specific version, `alpine` variant, `slim` variant) including benefits (size, security).
- In-depth explanation of multi-stage build implementation, how it works, and why it's beneficial (e.g., reducing image size, separating build environment from runtime).

##**Instruction 2:** Explain Security Best Practices:
- How the Dockerfile implements security (e.g., using non-root users, minimizing attack surface by only copying necessary files, not including build tools in final image).
- Identification of any security-related environment variables or configurations.

##**Instruction 3:** Explain Performance and Efficiency Optimizations:
- Explanation of caching strategies (e.g., copying `package.json` first, using `npm ci`).
- Methods used to reduce the final image size (e.g., multi-stage builds, using minimal base images).
- Steps taken to optimize build time.

##**Instruction 4:** Explain Production Readiness and Reliability:
- Environment variable configuration (e.g., `NODE_ENV=production`, `PYTHONUNBUFFERED`).
- Considerations for logging and error handling within the container's setup.
- If applicable, suggestions for health checks or graceful shutdown.

##**Instruction 5:** Explain General Dockerfile Best Practices:
- Logical flow and structure of instructions.
- Usage of `WORKDIR`, `COPY`, `RUN`, `ENV`, `EXPOSE`, `CMD`/`ENTRYPOINT`.
- Any other advanced Dockerfile features or patterns employed.

#**Notes:**
- The explanation should be highly detailed and technical.
- Do NOT provide the Dockerfile content itself in the explanation; only refer to its instructions.
- The explanation should be structured clearly with headings for each section.

Dockerfile to explain:
```dockerfile
{dockerfile}
"""

class LanguageRequest(BaseModel):
    language: str
    specifications: Optional[str] = None
    repo_url: Optional[str] = None # Added for GitHub repo URL
    include_comments: Optional[bool] = None # New field for optional comments

class DockerfileResponse(BaseModel):
    dockerfile: str
    explanation: Optional[str] = None

def generate_dockerfile(language: str, specifications: Optional[str] = None, repo_url: Optional[str] = None) -> str:
    # Placeholder for GitHub repo analysis (User to implement)
    repo_info = None
    # if repo_url: 
    #    repo_info = your_function_to_analyze_github_repo(repo_url)
    
    prompt = build_dockerfile_prompt(language, specifications, repo_info, include_comments)
    response = ollama.chat(model='llama3.2:3b', messages=[{'role': 'user', 'content': prompt}])
    return response['message']['content']

def generate_explanation(dockerfile: str) -> str:
    # For explanation, we don't need language or specifications as the Dockerfile itself is the source.
    # However, if you want the explanation to be context-aware of the original request, you could pass them.
    # For now, it's strictly about the Dockerfile content.
    response = ollama.chat(model='llama3.2:3b', messages=[{'role': 'user', 'content': EXPLANATION_PROMPT_STRUCTURE.format(dockerfile=dockerfile)}])
    return response['message']['content'].strip() # Ensure no extra whitespace/markdown

@app.post("/api/generate", response_model=DockerfileResponse)
async def generate(request: LanguageRequest):
    dockerfile = generate_dockerfile(request.language, request.specifications, request.repo_url, request.include_comments)
    return DockerfileResponse(dockerfile=dockerfile)

@app.post("/api/explain", response_model=DockerfileResponse)
async def explain(request: LanguageRequest):
    # The explanation prompt only needs the Dockerfile string.
    # The generate_dockerfile function is called here to ensure we have a Dockerfile to explain,
    # which also implies that repo_url and specifications are implicitly used to *generate* that Dockerfile.
    dockerfile = generate_dockerfile(request.language, request.specifications, request.repo_url, request.include_comments)
    explanation = generate_explanation(dockerfile)
    return DockerfileResponse(dockerfile=dockerfile, explanation=explanation)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)