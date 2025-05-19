from sqlalchemy import Column, Integer, String, Float, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String(255))
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    music_preferences = relationship("MusicPreference", back_populates="user")

class MusicPreference(Base):
    __tablename__ = "music_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    track_name = Column(String(100))
    artist_name = Column(String(100))
    genre = Column(String(100))
    spotify_id = Column(String(255), nullable=True)
    file_path = Column(String(512), nullable=True)
    
    user = relationship("User", back_populates="music_preferences") 