import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.app.core.database import Base, engine
from backend.app.core.exceptions import register_exception_handlers

# Import routers
from backend.app.routers import auth, tenants, knowledge, meetings, actions, workflows, analytics, jira, privacy

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize DB tables for MVP SQLite
logger.info("Initializing SQLite tables on startup...")
try:
    from backend.app.models.base import Base
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
    
    # Seed default tenant and administrator for demo environment
    from backend.app.core.database import SessionLocal
    from backend.app.models.tenant import Tenant
    from backend.app.models.user import User
    from backend.app.core.security import get_password_hash
    
    db = SessionLocal()
    try:
        default_domain = "insightorion.com"
        tenant = db.query(Tenant).filter(Tenant.domain == default_domain).first()
        if not tenant:
            logger.info("Seeding default demo tenant: insightorion.com")
            tenant = Tenant(
                name="InsightOrion Demo Org",
                domain=default_domain,
                subscription_plan="ENTERPRISE"
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            
        default_email = "admin@insightorion.com"
        user = db.query(User).filter(User.email == default_email).first()
        if not user:
            logger.info("Seeding default demo admin user: admin@insightorion.com")
            user = User(
                tenant_id=tenant.id,
                email=default_email,
                password_hash=get_password_hash("password123"),
                full_name="Orion Admin",
                role="ORG_ADMIN",
                is_active=True
            )
            db.add(user)
            db.commit()
            logger.info("Seeded default credentials successfully: admin@insightorion.com / password123")
    except Exception as seed_err:
        logger.error(f"Failed to seed demo records: {seed_err}")
    finally:
        db.close()
        
except Exception as e:
    logger.error(f"Failed to initialize database tables: {e}")

# Initialize app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Config CORS (Next.js client development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers
register_exception_handlers(app)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(tenants.router, prefix=settings.API_V1_STR)
app.include_router(knowledge.router, prefix=settings.API_V1_STR)
app.include_router(meetings.router, prefix=settings.API_V1_STR)
app.include_router(actions.router, prefix=settings.API_V1_STR)
app.include_router(workflows.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(jira.router, prefix=settings.API_V1_STR)
app.include_router(privacy.router, prefix=settings.API_V1_STR)

@app.get("/")
def home():
    return {
        "status": "online",
        "message": "Welcome to InsightOrion Core Platform V1 API.",
        "documentation": "/docs"
    }
