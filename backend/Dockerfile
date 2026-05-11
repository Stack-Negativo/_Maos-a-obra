# Use a Python 3.12 base image
FROM python:3.12-slim-bookworm

# Set working directory in the container
WORKDIR /app

# Install dependencies
# Copy only requirements.txt to leverage Docker cache
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables for FastAPI
ENV PYTHONUNBUFFERED=1

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to run the application
# Use gunicorn with uvicorn workers for production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
