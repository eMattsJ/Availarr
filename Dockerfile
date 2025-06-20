FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy all project files into container
COPY . /app
COPY app/static /app/static

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade setuptools

# Set PYTHONPATH (optional but helpful)
ENV PYTHONPATH=/app

# Expose FastAPI port
EXPOSE 8686

# Run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8686"]
