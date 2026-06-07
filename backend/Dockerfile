FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for document parsing and libraries compilation if any
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code (keeping the 'backend' namespace intact)
COPY . /app/backend

# Create uploads and data directories inside container
RUN mkdir -p /app/backend/data/uploads /app/backend/data/tenants

# Set Python path
ENV PYTHONPATH=/app

EXPOSE 8000

# Run FastAPI app
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
