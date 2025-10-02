FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc curl && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port (Railway will override this)
EXPOSE 8080

# Environment variables
ENV FLASK_APP=server.py
ENV FLASK_ENV=production

# Health check disabled for now

# Make startup script executable
RUN chmod +x start.sh

# Start command
CMD ["./start.sh"]
