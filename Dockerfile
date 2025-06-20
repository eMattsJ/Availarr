FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Copy all project files into container
COPY . /app
COPY app/static /app/static

# Update system packages and install dependencies
RUN apt-get update && apt-get upgrade -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Upgrade pip and setuptools to latest secure versions
RUN pip install --no-cache-dir --upgrade pip setuptools

# Install Python dependencies from requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Set PYTHONPATH
ENV PYTHONPATH=/app

# Expose FastAPI port
EXPOSE 8686

# Run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8686"]
