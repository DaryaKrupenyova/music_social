from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
import uvicorn
import os
import shutil
from pathlib import Path
import uuid
import mimetypes

from database import get_db, engine
import models, schemas, crud
from auth import get_current_user, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

app = FastAPI(title="Music Social Network API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/music")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Create database tables if they don't exist
models.Base.metadata.create_all(bind=engine)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me/", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/users/nearby/", response_model=List[schemas.User])
def get_nearby_users(
    latitude: float,
    longitude: float,
    radius_km: float = 10.0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_nearby_users(db, latitude, longitude, radius_km)

@app.post("/users/music/", response_model=schemas.MusicPreference)
def add_music_preference(
    music: schemas.MusicPreferenceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.create_music_preference(db=db, music=music, user_id=current_user.id)

@app.get("/users/music/", response_model=List[schemas.MusicPreference])
def get_user_music(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_user_music_preferences(db, current_user.id)

@app.post("/users/music/upload/", response_model=schemas.MusicPreference)
async def upload_music(
    file: UploadFile = File(...),
    track_name: str = Form(None),
    artist_name: str = Form(None),
    genre: str = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validate file is an audio file
    content_type = file.content_type
    if not content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail="File is not an audio file"
        )
    
    # Generate a unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join("uploads/music", unique_filename)
    abs_file_path = os.path.join(file_path)
    
    # Save the file
    with open(abs_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Try to extract track info from the file if not provided
    final_track_name = track_name or os.path.splitext(file.filename)[0]
    final_artist_name = artist_name or "Unknown Artist"
    final_genre = genre or "Unknown Genre"
    
    # Create music preference entry
    music_data = schemas.MusicPreferenceCreate(
        track_name=final_track_name,
        artist_name=final_artist_name,
        genre=final_genre,
        file_path=file_path
    )
    
    return crud.create_music_preference(db=db, music=music_data, user_id=current_user.id)

# API endpoint to update user location
@app.put("/users/location/", response_model=schemas.User)
def update_location(
    latitude: float,
    longitude: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.update_user_location(db, current_user.id, latitude, longitude)

@app.delete("/users/music/{music_id}", response_model=schemas.MusicPreference)
async def delete_music(
    music_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Get the music preference first
    music_pref = crud.get_music_preference_by_id(db, music_id)
    if not music_pref:
        raise HTTPException(status_code=404, detail="Music not found")
    
    # Check if the user owns this music preference
    if music_pref.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this music")
    
    # Delete the file if it exists
    if music_pref.file_path:
        file_path = music_pref.file_path
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            # Log the error but continue with database deletion
            print(f"Error deleting file: {e}")
    
    # Delete from database
    return crud.delete_music_preference(db, music_id)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 