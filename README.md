# Dockerfile Generator

## Table of Contents

1. [Overview](#overview)
2. [Running This Project Locally](#local)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Directory Structure](#directory-structure)
6. [Backend (FastAPI + Ollama)](#backend)
    - [Requirements](#backend-requirements)
    - [Setup & Development](#backend-setup)
    - [API Endpoints](#backend-api)
    - [Dockerization](#backend-docker)
7. [Frontend (React + Vite + MUI)](#frontend)
    - [Requirements](#frontend-requirements)
    - [Setup & Development](#frontend-setup)
    - [Build & Dockerization](#frontend-docker)
8. [CI/CD with GitHub Actions & GHCR](#cicd)
9. [Usage Guide](#usage)
10. [Customization & Extensibility](#customization)
11. [Troubleshooting](#troubleshooting)
12. [Prompt Engineering Note](#prompt)
13. [Disclaimer & Attribution](#disclaimer)
14. [License](#license)
15. [Credits](#credits)

---

## 1. Overview <a name="overview"></a>

**Dockerfile Generator** is a web application that allows users to generate best-practice Dockerfiles for various programming languages, optionally including custom specifications. It leverages a local LLM (Large Language Model) for intelligent Dockerfile generation and provides explanations for each generated Dockerfile. 

- The LLM is served via [Ollama](https://ollama.com/), which acts as a local LLM repository and runner (similar to how DockerHub is an image repository). 
- The specific LLM used in this project is **llama3.2:3b**.

---

## 2. Running This Project Locally <a name="local"></a>

This project is designed to run on your local machine. Follow these steps:

### 1. Install [Ollama](https://ollama.com/) and Pull the LLM
- Download and install Ollama from [https://ollama.com/download](https://ollama.com/download).
- Ollama acts as your local LLM repository and runner. You will use it to pull and serve the actual LLM model.
- Pull the required LLM (llama3.2:3b):
  ```bash
  ollama pull llama3.2:3b
  ```
- Start Ollama (if not already running).

### 2. Set up the backend (Python, FastAPI, Ollama integration)
- Create and activate a Python virtual environment:
  ```bash
  cd local-llms-ollama
  python -m venv myenv
  # On Windows:
  myenv\Scripts\activate
  # On Mac/Linux:
  source myenv/bin/activate
  ```
- Install dependencies:
  ```bash
  pip install -r requirements.txt
  ```
- Start the backend server:
  ```bash
  python generate_dockerfile.py
  ```
- The backend will be available at `http://localhost:8000`.

### 3. Set up the frontend (React, Vite, MUI)
- In a new terminal, run:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- The frontend will be available at `http://localhost:3000`.

### 4. Usage
- Open your browser and go to `http://localhost:3000`.
- Select a programming language, optionally add specifications, and generate your Dockerfile!

---

## 3. Architecture <a name="architecture"></a>

- **Frontend:** React (TypeScript), Vite, Material-UI, served via Nginx in production.
- **Backend:** FastAPI (Python), Ollama for LLM-powered Dockerfile generation (using llama3.2:3b).
- **CI/CD:** GitHub Actions for building and pushing Docker images to GitHub Container Registry (GHCR).
- **Deployment:** Each service (frontend, backend) is containerized and can be deployed independently.

---

## 4. Features <a name="features"></a>

- Select a programming language from a dropdown.
- Optionally provide additional Dockerfile specifications (e.g., image version, multi-stage build).
- Generate a Dockerfile with best practices and user specifications.
- Copy Dockerfile to clipboard.
- Request a comprehensive explanation of the generated Dockerfile.
- Responsive, modern UI.
- Loading indicators for async operations.
- Error handling and user feedback.
- CI/CD pipeline for automated Docker image builds and pushes.

---

## 5. Directory Structure <a name="directory-structure"></a>

```
dockerfile-generator/
├── local-llms-ollama/         # Backend (FastAPI + Ollama)
│   ├── generate_dockerfile.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                  # Frontend (React + Vite + MUI)
│   ├── src/
│   │   └── App.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── .github/
│   └── workflows/
│       └── docker-build.yml
└── README.md
```

---

## 6. Backend (FastAPI + Ollama) <a name="backend"></a>

### Requirements <a name="backend-requirements"></a>

- Python 3.11+
- [Ollama](https://ollama.com/) (local LLM repository/runner)
- LLM model: **llama3.2:3b** (must be pulled via Ollama)
- FastAPI, Uvicorn, Pydantic

#### Install dependencies:
```bash
cd local-llms-ollama
python -m venv myenv
source myenv/bin/activate  # or myenv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Setup & Development <a name="backend-setup"></a>

1. **Start Ollama** (ensure the LLM model is available, e.g., `llama3.2:3b`).
2. **Run the backend:**
   ```bash
   python generate_dockerfile.py
   ```
   The API will be available at `http://localhost:8000`.

### API Endpoints <a name="backend-api"></a>

#### `POST /api/generate`
- **Request Body:**
  ```json
  {
    "language": "Python",
    "specifications": "multi-stage build"
  }
  ```
- **Response:**
  ```json
  {
    "dockerfile": "..."
  }
  ```

#### `POST /api/explain`
- **Request Body:**
  ```json
  {
    "language": "Python",
    "specifications": "multi-stage build"
  }
  ```
- **Response:**
  ```json
  {
    "dockerfile": "...",
    "explanation": "..."
  }
  ```

### Dockerization <a name="backend-docker"></a>

**Dockerfile:**
```dockerfile
FROM python:3.11-slim as base
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "generate_dockerfile:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Build & Run:**
```bash
docker build -t dockerfile-generator-backend ./local-llms-ollama
docker run -p 8000:8000 dockerfile-generator-backend
```

---

## 7. Frontend (React + Vite + MUI) <a name="frontend"></a>

### Requirements <a name="frontend-requirements"></a>

- Node.js 18+ (20+ recommended)
- npm

### Setup & Development <a name="frontend-setup"></a>

```bash
cd frontend
npm install
npm run dev
```
- The app will be available at `http://localhost:3000`.

### Build & Dockerization <a name="frontend-docker"></a>

**Dockerfile:**
```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
RUN npm install -g typescript
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;

  location / {
    try_files $uri /index.html;
  }
}
```

**.dockerignore:**
```
node_modules
dist
.git
```

**Build & Run:**
```bash
docker build -t dockerfile-generator-frontend ./frontend
docker run -p 80:80 dockerfile-generator-frontend
```

---

## 8. CI/CD with GitHub Actions & GHCR <a name="cicd"></a>

- **Workflow:** `.github/workflows/docker-build.yml`
- **Triggers:** On push to `main` (or tags, if enabled)
- **Builds and pushes:**  
  - `ghcr.io/<username>/dockerfile-generator-backend:<tag or branch>`
  - `ghcr.io/<username>/dockerfile-generator-frontend:<tag or branch>`

**Example workflow snippet:**
```yaml
on:
  push:
    branches:
      - main

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: ./local-llms-ollama
          file: ./local-llms-ollama/Dockerfile
          push: true
          tags: ghcr.io/<username>/dockerfile-generator-backend:${{ github.ref_name }}
      - uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          tags: ghcr.io/<username>/dockerfile-generator-frontend:${{ github.ref_name }}
```

---

## 9. Usage Guide <a name="usage"></a>

1. **Open the app in your browser** (`http://localhost:3000` or deployed URL).
2. **Select a programming language** from the dropdown.
3. **(Optional) Enter additional specifications** (e.g., "multi-stage build", "use Python 3.11").
4. **Click "Generate Dockerfile"** to generate a Dockerfile.
5. **Copy the Dockerfile** using the copy button.
6. **Click "Explain"** to get a detailed explanation of the Dockerfile.
7. **If you change the language,** the Dockerfile and explanation areas are cleared.

---

## 10. Customization & Extensibility <a name="customization"></a>

- **Add more languages:** Update the `languages` array in `frontend/src/App.tsx`.
- **Change LLM model:** Update the model name in `generate_dockerfile.py` and pull it via Ollama.
- **Add more backend endpoints:** Extend FastAPI as needed.
- **UI customization:** Use Material-UI theming and components for further UI/UX improvements.
- **Deployment:** Use Docker Compose, Kubernetes, or your preferred orchestrator for multi-container deployment.

---

## 11. Troubleshooting <a name="troubleshooting"></a>

- **Backend not starting:** Ensure Ollama is running and the required LLM model (llama3.2:3b) is available.
- **Frontend build errors:** Make sure you're not copying `node_modules` into the Docker image; use `.dockerignore`.
- **GHCR images not updating:** Check your workflow triggers and image tags.
- **CORS issues:** The backend enables CORS for all origins by default.
- **LLM not respecting specifications:** Ensure the backend prompt is up-to-date and clear.

---

## 12. Prompt Engineering Note <a name="prompt"></a>

> **Prompt Engineering:**  
> This project leverages prompt engineering techniques learned from Abhishek Veeramalla's AI Assisted DevOps course. The backend dynamically constructs prompts for the LLM to ensure user specifications are respected, and the Dockerfiles generated are both best-practice and tailored to user needs.

---

## 13. Disclaimer & Attribution <a name="disclaimer"></a>

This project was inspired by the Dockerfile generator concept presented in the **AI Assisted DevOps** course on YouTube by [Abhishek Veeramalla](https://www.youtube.com/@AbhishekVeeramalla).

The frontend design, user experience, and all enhancements—including the full-stack integration, additional features, and improvements—were conceived, implemented, and refined by me using **vibe coding** in the **Cursor IDE**.

> **Disclaimer:**  
> This project is an independent implementation and extension of the ideas demonstrated in the referenced course. It is not affiliated with or endorsed by Abhishek Veeramalla. All frontend design, UX, and additional backend logic are original work.

---

## 14. License <a name="license"></a>

Specify your license here (e.g., MIT, Apache 2.0, etc.).

---

## 15. Credits <a name="credits"></a>

- [Ollama](https://ollama.com/)
- [Llama 3](https://ollama.com/library/llama3)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Material-UI](https://mui.com/)
- [Vite](https://vitejs.dev/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [GHCR](https://github.com/features/packages)

---

**For further questions, feature requests, or contributions, please open an issue or pull request on the repository!**
