import pytest
from fastapi.testclient import TestClient
from fastapi import status
import json
import random
import string
from unittest.mock import AsyncMock, patch
from hypothesis import given, settings, strategies as st
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app 
from models import Base
from database import engine, get_db
from sqlalchemy.orm import sessionmaker

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = engine
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

# Helper to create test user
def create_test_user(client):
    return client.post(
        "/users/",
        json={"username": "testuser", "password": "testpass"},
    )

# 1. Health check endpoint
def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 404

# 2. Successful user creation
def test_create_user_success(client):
    response = create_test_user(client)
    assert response.status_code == status.HTTP_200_OK
    assert "username" in response.json()

# 3. Duplicate user prevention
def test_duplicate_user(client):
    create_test_user(client)
    response = create_test_user(client)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

# 4. Successful authentication
def test_auth_success(client):
    create_test_user(client)
    response = client.post(
        "/token",
        data={"username": "testuser", "password": "testpass"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert "access_token" in response.json()

# 5. Failed authentication
def test_auth_failure(client):
    response = client.post(
        "/token",
        data={"username": "invalid", "password": "invalid"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

# 6. Protected endpoint access
def test_user_endpoint(client):
    create_test_user(client)
    auth = client.post(
        "/token",
        data={"username": "testuser", "password": "testpass"},
    ).json()
    
    response = client.get(
        "/users/me/",
        headers={"Authorization": f"Bearer {auth['access_token']}"}
    )
    assert response.status_code == status.HTTP_200_OK

def _fuzz_test_client():
    session = TestingSessionLocal()
    def override_get_db():
        try:
            yield session
        finally:
            session.rollback()
    
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)

# 7. Test protected endpoint with token
def test_protected_with_token(client):
    # Create user
    client.post("/users/", json={"username": "testuser", "password": "testpass"})
    
    # Get token
    login = client.post(
        "/token",
        data={"username": "testuser", "password": "testpass"},
    )
    token = login.json()["access_token"]
    
    # Access protected endpoint
    response = client.get(
        "/users/me/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["username"] == "testuser"

# 8. Test invalid user input
def test_invalid_user_input(client):
    response = client.post(
        "/users/",
        json={"username": "test", "password": "test"},
    )
    response2 = client.post(
        "/users/",
        json={"username": "test", "password": "test"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert response2.status_code == status.HTTP_400_BAD_REQUEST

# 9. Test invalid token
def test_invalid_token(client):
    response = client.get(
        "/users/me/",
        headers={"Authorization": "Bearer invalidtoken123"}
    )
    assert response.status_code in [401, 403]