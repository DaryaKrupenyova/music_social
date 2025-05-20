# Music Social Network

A social network application for music lovers to connect based on their location and music preferences.

## Live Demo

The application is live at: [http://51.250.84.238:81/](http://51.250.84.238:81/)

## Features

- User registration and authentication
- Share music preferences (tracks, artists, genres)
- Geolocation-based user discovery
- Interactive map showing nearby users
- Music preference management

## Tech Stack

### Backend

- FastAPI
- SQLite
- SQLAlchemy
- JWT Authentication
- Geopy for location calculations

### Frontend

- React with TypeScript
- Material-UI
- Leaflet for maps
- Axios for API calls

## Setup

### Using Docker (Recommended)

1. Make sure you have Docker and Docker Compose installed
2. Clone the repository
3. Run the application:

```bash
docker-compose up --build
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Manual Setup

#### Backend

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the backend server:

```bash
cd backend
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

#### Frontend

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Run the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173

## API Documentation

Once the backend server is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

### Docker Environment

The Docker environment variables are configured in the `docker-compose.yml` file.

### Manual Setup

Create a `.env` file in the backend directory with the following variables:

```
SECRET_KEY=your-secret-key-here
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
