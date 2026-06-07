import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
from backend.app.models.base import Base
from backend.app.core.database import get_db

from sqlalchemy.pool import StaticPool

# Configure in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override database dependency
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    # Setup tables
    Base.metadata.create_all(bind=engine)
    yield
    # Tear down tables
    Base.metadata.drop_all(bind=engine)

def test_tenant_registration_and_login():
    # Register tenant
    register_payload = {
        "tenant_name": "Test Orion Org",
        "domain": "testorion.com",
        "admin_email": "admin@testorion.com",
        "admin_password": "supersecretpassword123",
        "admin_name": "Orion Administrator"
    }
    
    response = client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 200
    assert "tenant_id" in response.json()
    assert "admin_id" in response.json()

    # Attempt registration with duplicate domain
    dup_response = client.post("/api/v1/auth/register", json=register_payload)
    assert dup_response.status_code == 400

    # Log in
    login_payload = {
        "username": "admin@testorion.com",
        "password": "supersecretpassword123"
    }
    login_response = client.post("/api/v1/auth/login", data=login_payload)
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()
    assert login_response.json()["token_type"] == "bearer"
