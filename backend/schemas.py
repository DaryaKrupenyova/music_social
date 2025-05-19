from pydantic import BaseModel
from typing import Optional, List

class MusicPreferenceBase(BaseModel):
    track_name: str
    artist_name: str
    genre: str
    spotify_id: Optional[str] = None
    file_path: Optional[str] = None

class MusicPreferenceCreate(MusicPreferenceBase):
    pass

class MusicPreference(MusicPreferenceBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    music_preferences: List[MusicPreference] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None 