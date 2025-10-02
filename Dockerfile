FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8080

# Environment variables
ENV FLASK_APP=server.py
ENV FLASK_ENV=production

# Start command
CMD gunicorn --bind 0.0.0.0:$PORT --workers 2 server:app
