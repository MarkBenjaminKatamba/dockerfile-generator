# Backend Dockerfile
FROM python:3.11-slim as base

WORKDIR /app

# Install system dependencies (if any needed for ollama)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Run the FastAPI app
CMD ["uvicorn", "generate_dockerfile:app", "--host", "0.0.0.0", "--port", "8000"] 