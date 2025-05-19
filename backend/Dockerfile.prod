FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY ./requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Make sure the application has permission to write to its directory
RUN mkdir -p /app/data && chmod 777 /app /app/data

# Create uploads directory
RUN mkdir -p uploads/music && chmod 777 uploads/music

# Set the database path environment variable
ENV DATABASE_URL=sqlite:///./data/music_social.db

# Use entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"] 