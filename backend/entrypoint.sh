#!/bin/bash

# Make sure data directory exists and has correct permissions
mkdir -p /app/data
chmod 777 /app/data

# Start the FastAPI application
exec uvicorn main:app --host 0.0.0.0 --port 8000 