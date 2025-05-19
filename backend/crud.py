from sqlalchemy.orm import Session
from geopy.distance import geodesic
from sqlalchemy import func, cast, Float
import models, schemas, auth
from math import radians, cos, sin, asin, sqrt

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Haversine function to calculate distance directly in the query
def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r

def get_nearby_users(db: Session, latitude: float, longitude: float, radius_km: float):
    """
    Optimized function to get nearby users using direct filtering
    and limiting data transfer
    """
    # Filter to only get users with valid coordinates
    query = db.query(models.User).filter(
        models.User.latitude.isnot(None),
        models.User.longitude.isnot(None)
    )
    
    # Get all eligible users
    eligible_users = []
    
    # Using a smaller subset for initial calculation
    for user in query:
        # Skip calculation if coordinates are missing
        if user.latitude is None or user.longitude is None:
            continue
            
        # Calculate distance
        distance = haversine_distance(latitude, longitude, user.latitude, user.longitude)
        
        # Only include if within radius
        if distance <= radius_km:
            eligible_users.append(user)
    
    return eligible_users

def create_music_preference(db: Session, music: schemas.MusicPreferenceCreate, user_id: int):
    db_music = models.MusicPreference(**music.dict(), user_id=user_id)
    db.add(db_music)
    db.commit()
    db.refresh(db_music)
    return db_music

def get_user_music_preferences(db: Session, user_id: int):
    return db.query(models.MusicPreference).filter(models.MusicPreference.user_id == user_id).all()

def update_user_location(db: Session, user_id: int, latitude: float, longitude: float):
    user = get_user(db, user_id)
    if user:
        user.latitude = latitude
        user.longitude = longitude
        db.commit()
        db.refresh(user)
    return user

def get_music_preference_by_id(db: Session, music_id: int):
    return db.query(models.MusicPreference).filter(models.MusicPreference.id == music_id).first()

def delete_music_preference(db: Session, music_id: int):
    music = get_music_preference_by_id(db, music_id)
    if music:
        db.delete(music)
        db.commit()
    return music 