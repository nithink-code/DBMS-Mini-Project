from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from authlib.integrations.starlette_client import OAuth
import os
import logging
import aiofiles
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
# Use MONGO_ATLAS_URL if available, otherwise fall back to local MONGO_URL
mongo_url = os.environ.get('MONGO_ATLAS_URL') or os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'podcast_network')]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080  # 7 days

security = HTTPBearer()

# OAuth Setup
oauth = OAuth()
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/auth/google/callback')

if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name='google',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile',
            'redirect_uri': GOOGLE_REDIRECT_URI
        }
    )

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "hosts").mkdir(exist_ok=True)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    password_hash: Optional[str] = None
    auth_provider: str = "local"  # local or google
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Host(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    bio: str
    email: EmailStr
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: str

class HostCreate(BaseModel):
    name: str
    bio: str
    email: EmailStr
    image_url: Optional[str] = None

class Show(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    host_id: str
    category: str
    cover_image_url: Optional[str] = None
    status: str = "active"  # active, paused, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: str

class ShowCreate(BaseModel):
    title: str
    description: str
    host_id: str
    category: str
    cover_image_url: Optional[str] = None
    status: str = "active"

class Episode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    show_id: str
    title: str
    description: str
    duration_minutes: int
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    episode_number: int
    published_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "draft"  # draft, published, archived
    user_id: str

class EpisodeCreate(BaseModel):
    show_id: str
    title: str
    description: str
    duration_minutes: int
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    episode_number: int
    status: str = "draft"

class Advertiser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    contact_person: str
    email: EmailStr
    phone: str
    budget: float
    status: str = "active"  # active, inactive
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: str

class AdvertiserCreate(BaseModel):
    company_name: str
    contact_person: str
    email: EmailStr
    phone: str
    budget: float
    status: str = "active"

# ==================== AUTH HELPERS ====================

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=get_password_hash(user_data.password),
        auth_provider="local"
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    access_token = create_access_token({"sub": user.id, "email": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user.id, "email": user.email, "name": user.name}}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not user.get('password_hash'):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token({"sub": user['id'], "email": user['email']})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user['id'], "email": user['email'], "name": user['name']}}

@api_router.get("/auth/google")
async def google_login(request: Request):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=400, detail="Google OAuth not configured")
    return await oauth.google.authorize_redirect(request, GOOGLE_REDIRECT_URI)

@api_router.get("/auth/google/callback")
async def google_callback(request: Request):
    from starlette.responses import RedirectResponse
    import urllib.parse
    
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        if not user_info:
            # Redirect to frontend with error
            return RedirectResponse(url=f"{frontend_url}/?error=no_user_info")
        
        # Check if user exists
        user = await db.users.find_one({"email": user_info['email']}, {"_id": 0})
        if not user:
            new_user = User(
                email=user_info['email'],
                name=user_info.get('name', user_info['email']),
                auth_provider="google"
            )
            doc = new_user.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.users.insert_one(doc)
            user = doc
        
        access_token = create_access_token({"sub": user['id'], "email": user['email']})
        
        # Redirect to frontend with token and user info
        user_json = urllib.parse.quote(f'{{"id":"{user["id"]}","email":"{user["email"]}","name":"{user["name"]}"}}')
        return RedirectResponse(url=f"{frontend_url}/?token={access_token}&user={user_json}")
    except Exception as e:
        # Redirect to frontend with error
        error_message = urllib.parse.quote(str(e))
        return RedirectResponse(url=f"{frontend_url}/?error={error_message}")

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"user": {"id": current_user['id'], "email": current_user['email'], "name": current_user['name']}}

# ==================== UPLOAD ROUTES ====================

@api_router.post("/upload/host-image")
async def upload_host_image(
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Validate file type
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate file size (5MB limit)
    if image.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    # Generate unique filename
    file_extension = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / "hosts" / unique_filename
    
    try:
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Return the URL path
        return {"url": f"/uploads/hosts/{unique_filename}"}
    
    except Exception as e:
        # Clean up the file if something went wrong
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail="Failed to upload image")

# ==================== HOST ROUTES ====================

@api_router.post("/hosts", response_model=Host)
async def create_host(host_data: HostCreate, current_user: dict = Depends(get_current_user)):
    host = Host(**host_data.model_dump(), user_id=current_user['id'])
    doc = host.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.hosts.insert_one(doc)
    return host

@api_router.get("/hosts", response_model=List[Host])
async def get_hosts(current_user: dict = Depends(get_current_user)):
    hosts = await db.hosts.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    for host in hosts:
        if isinstance(host['created_at'], str):
            host['created_at'] = datetime.fromisoformat(host['created_at'])
    return hosts

@api_router.get("/hosts/{host_id}", response_model=Host)
async def get_host(host_id: str, current_user: dict = Depends(get_current_user)):
    host = await db.hosts.find_one({"id": host_id, "user_id": current_user['id']}, {"_id": 0})
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")
    if isinstance(host['created_at'], str):
        host['created_at'] = datetime.fromisoformat(host['created_at'])
    return host

@api_router.put("/hosts/{host_id}", response_model=Host)
async def update_host(host_id: str, host_data: HostCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.hosts.find_one({"id": host_id, "user_id": current_user['id']}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Host not found")
    
    update_data = host_data.model_dump()
    await db.hosts.update_one({"id": host_id}, {"$set": update_data})
    updated = await db.hosts.find_one({"id": host_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/hosts/{host_id}")
async def delete_host(host_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.hosts.delete_one({"id": host_id, "user_id": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Host not found")
    return {"message": "Host deleted successfully"}

@api_router.get("/hosts/popular/list", response_model=List[Host])
async def get_popular_hosts(current_user: dict = Depends(get_current_user)):
    """Get popular hosts - only Ranveer, Nikhil Kamath, and Raj Shamani"""
    featured_hosts = ["Ranveer Allahbadia", "Nikhil Kamath", "Raj Shamani"]
    hosts = await db.hosts.find(
        {"user_id": current_user['id'], "name": {"$in": featured_hosts}}, 
        {"_id": 0}
    ).to_list(3)
    for host in hosts:
        if isinstance(host['created_at'], str):
            host['created_at'] = datetime.fromisoformat(host['created_at'])
    return hosts

# ==================== SHOW ROUTES ====================

@api_router.post("/shows", response_model=Show)
async def create_show(show_data: ShowCreate, current_user: dict = Depends(get_current_user)):
    show = Show(**show_data.model_dump(), user_id=current_user['id'])
    doc = show.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.shows.insert_one(doc)
    return show

@api_router.get("/shows", response_model=List[Show])
async def get_shows(current_user: dict = Depends(get_current_user)):
    shows = await db.shows.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    for show in shows:
        if isinstance(show['created_at'], str):
            show['created_at'] = datetime.fromisoformat(show['created_at'])
    return shows

@api_router.get("/shows/{show_id}", response_model=Show)
async def get_show(show_id: str, current_user: dict = Depends(get_current_user)):
    show = await db.shows.find_one({"id": show_id, "user_id": current_user['id']}, {"_id": 0})
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    if isinstance(show['created_at'], str):
        show['created_at'] = datetime.fromisoformat(show['created_at'])
    return show

@api_router.put("/shows/{show_id}", response_model=Show)
async def update_show(show_id: str, show_data: ShowCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.shows.find_one({"id": show_id, "user_id": current_user['id']}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Show not found")
    
    update_data = show_data.model_dump()
    await db.shows.update_one({"id": show_id}, {"$set": update_data})
    updated = await db.shows.find_one({"id": show_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/shows/{show_id}")
async def delete_show(show_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.shows.delete_one({"id": show_id, "user_id": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Show not found")
    return {"message": "Show deleted successfully"}

@api_router.get("/shows/popular/list", response_model=List[Show])
async def get_popular_shows(current_user: dict = Depends(get_current_user)):
    """Get popular shows (most recent active shows)"""
    shows = await db.shows.find({"user_id": current_user['id'], "status": "active"}, {"_id": 0}).sort("created_at", -1).limit(6).to_list(6)
    for show in shows:
        if isinstance(show['created_at'], str):
            show['created_at'] = datetime.fromisoformat(show['created_at'])
    return shows

# ==================== EPISODE ROUTES ====================

@api_router.post("/episodes", response_model=Episode)
async def create_episode(episode_data: EpisodeCreate, current_user: dict = Depends(get_current_user)):
    episode = Episode(**episode_data.model_dump(), user_id=current_user['id'])
    doc = episode.model_dump()
    doc['published_at'] = doc['published_at'].isoformat()
    await db.episodes.insert_one(doc)
    return episode

@api_router.get("/episodes", response_model=List[Episode])
async def get_episodes(show_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user['id']}
    if show_id:
        query["show_id"] = show_id
    episodes = await db.episodes.find(query, {"_id": 0}).to_list(1000)
    for episode in episodes:
        if isinstance(episode['published_at'], str):
            episode['published_at'] = datetime.fromisoformat(episode['published_at'])
    return episodes

@api_router.get("/episodes/{episode_id}", response_model=Episode)
async def get_episode(episode_id: str, current_user: dict = Depends(get_current_user)):
    episode = await db.episodes.find_one({"id": episode_id, "user_id": current_user['id']}, {"_id": 0})
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    if isinstance(episode['published_at'], str):
        episode['published_at'] = datetime.fromisoformat(episode['published_at'])
    return episode

@api_router.put("/episodes/{episode_id}", response_model=Episode)
async def update_episode(episode_id: str, episode_data: EpisodeCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.episodes.find_one({"id": episode_id, "user_id": current_user['id']}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    update_data = episode_data.model_dump()
    await db.episodes.update_one({"id": episode_id}, {"$set": update_data})
    updated = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    if isinstance(updated['published_at'], str):
        updated['published_at'] = datetime.fromisoformat(updated['published_at'])
    return updated

@api_router.delete("/episodes/{episode_id}")
async def delete_episode(episode_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.episodes.delete_one({"id": episode_id, "user_id": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Episode not found")
    return {"message": "Episode deleted successfully"}

@api_router.get("/episodes/popular/list", response_model=List[Episode])
async def get_popular_episodes(current_user: dict = Depends(get_current_user)):
    """Get popular episodes (most recent published episodes)"""
    episodes = await db.episodes.find({"user_id": current_user['id'], "status": "published"}, {"_id": 0}).sort("published_at", -1).limit(6).to_list(6)
    for episode in episodes:
        if isinstance(episode['published_at'], str):
            episode['published_at'] = datetime.fromisoformat(episode['published_at'])
    return episodes

# ==================== ADVERTISER ROUTES ====================

@api_router.post("/advertisers", response_model=Advertiser)
async def create_advertiser(advertiser_data: AdvertiserCreate, current_user: dict = Depends(get_current_user)):
    advertiser = Advertiser(**advertiser_data.model_dump(), user_id=current_user['id'])
    doc = advertiser.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.advertisers.insert_one(doc)
    return advertiser

@api_router.get("/advertisers", response_model=List[Advertiser])
async def get_advertisers(current_user: dict = Depends(get_current_user)):
    advertisers = await db.advertisers.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    for advertiser in advertisers:
        if isinstance(advertiser['created_at'], str):
            advertiser['created_at'] = datetime.fromisoformat(advertiser['created_at'])
    return advertisers

@api_router.get("/advertisers/{advertiser_id}", response_model=Advertiser)
async def get_advertiser(advertiser_id: str, current_user: dict = Depends(get_current_user)):
    advertiser = await db.advertisers.find_one({"id": advertiser_id, "user_id": current_user['id']}, {"_id": 0})
    if not advertiser:
        raise HTTPException(status_code=404, detail="Advertiser not found")
    if isinstance(advertiser['created_at'], str):
        advertiser['created_at'] = datetime.fromisoformat(advertiser['created_at'])
    return advertiser

@api_router.put("/advertisers/{advertiser_id}", response_model=Advertiser)
async def update_advertiser(advertiser_id: str, advertiser_data: AdvertiserCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.advertisers.find_one({"id": advertiser_id, "user_id": current_user['id']}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Advertiser not found")
    
    update_data = advertiser_data.model_dump()
    await db.advertisers.update_one({"id": advertiser_id}, {"$set": update_data})
    updated = await db.advertisers.find_one({"id": advertiser_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/advertisers/{advertiser_id}")
async def delete_advertiser(advertiser_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.advertisers.delete_one({"id": advertiser_id, "user_id": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Advertiser not found")
    return {"message": "Advertiser deleted successfully"}

@api_router.get("/advertisers/popular/list", response_model=List[Advertiser])
async def get_popular_advertisers(current_user: dict = Depends(get_current_user)):
    """Get popular advertisers (highest budget for now)"""
    advertisers = await db.advertisers.find({"user_id": current_user['id']}, {"_id": 0}).sort("budget", -1).limit(5).to_list(5)
    for advertiser in advertisers:
        if isinstance(advertiser['created_at'], str):
            advertiser['created_at'] = datetime.fromisoformat(advertiser['created_at'])
    return advertisers

# ==================== CLEAR USER DATA ====================

@api_router.delete("/clear-all-data")
async def clear_all_user_data(current_user: dict = Depends(get_current_user)):
    """Clear all data for the current user"""
    user_id = current_user['id']
    
    # Delete all user data
    hosts_deleted = await db.hosts.delete_many({"user_id": user_id})
    shows_deleted = await db.shows.delete_many({"user_id": user_id})
    episodes_deleted = await db.episodes.delete_many({"user_id": user_id})
    advertisers_deleted = await db.advertisers.delete_many({"user_id": user_id})
    
    return {
        "message": "All data cleared successfully",
        "deleted": {
            "hosts": hosts_deleted.deleted_count,
            "shows": shows_deleted.deleted_count,
            "episodes": episodes_deleted.deleted_count,
            "advertisers": advertisers_deleted.deleted_count
        }
    }

# ==================== INITIALIZE DEFAULT DATA ====================

@api_router.post("/initialize-defaults")
async def initialize_default_data(current_user: dict = Depends(get_current_user), force: bool = False):
    """Initialize default popular hosts, shows, episodes, and advertisers for the user"""
    user_id = current_user['id']
    
    # Check if user already has data
    existing_hosts = await db.hosts.count_documents({"user_id": user_id})
    if existing_hosts > 0:
        if not force:
            return {"message": "User already has data. Use force=true to reinitialize.", "initialized": False}
        else:
            # Clear all existing data for this user
            await db.hosts.delete_many({"user_id": user_id})
            await db.shows.delete_many({"user_id": user_id})
            await db.episodes.delete_many({"user_id": user_id})
            await db.advertisers.delete_many({"user_id": user_id})
    
    # Create default hosts
    default_hosts = [
        Host(
            name="Ranveer Allahbadia",
            bio="Popular Indian YouTuber and podcast host known for BeerBiceps. Covers fitness, entrepreneurship, spirituality, and personal development with millions of followers.",
            email="ranveer@beerbiceps.com",
            image_url="https://media.licdn.com/dms/image/v2/D5603AQGlosHMDk-kwg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1730171107969?e=2147483647&v=beta&t=JjvBV0xZbnAT3K5dKeo-GaXQ7YG6lETvVgWDcIC-3mo",
            user_id=user_id
        ),
        Host(
            name="Nikhil Kamath",
            bio="Co-founder of Zerodha, India's largest stockbroker. Host of 'WTF is with Nikhil Kamath' featuring conversations with entrepreneurs, athletes, and thought leaders.",
            email="nikhil@wtfpodcast.in",
            image_url="https://isfm.co.in/wp-content/uploads/2025/02/exclusive-profile-shoot-of-nikhil-kamath-co-founder-zerodha-in-bangalore-on-september-22-2023-p-195120405-16x9_0.webp",
            user_id=user_id
        ),
        Host(
            name="Tanmay Bhat",
            bio="Co-founder of AIB and popular YouTuber. Known for gaming streams, comedy, and candid conversations about internet culture and content creation in India.",
            email="tanmay@tanmaybhat.com",
            image_url="https://cdn.starclinch.in/artist/tanmay-bhat/tanmay-bhat.jpg?width=3840&quality=100&format=webp&flop=false",
            user_id=user_id
        ),
        Host(
            name="Raj Shamani",
            bio="Young entrepreneur and host of 'Figuring Out' podcast. Interviews successful Indians about their journey, business strategies, and life lessons.",
            email="raj@rajshamani.com",
            image_url="https://i.scdn.co/image/ab6765630000ba8a271520bec0ac82d57d0c2689",
            user_id=user_id
        ),
      
        Host(
            name="Ishan Sharma",
            bio="Tech YouTuber and career coach for Indian youth. Discusses coding, tech careers, college life, and opportunities in the tech industry.",
            email="ishan@ishansharma.com",
            image_url="https://media.licdn.com/dms/image/v2/D5603AQGTvsgbw8iuQw/profile-displayphoto-scale_200_200/B56ZhrRUgHHQAc-/0/1754146361816?e=2147483647&v=beta&t=omLoI8fcs_qrBXQHZYGdgjJv0OyAlYENewd5r2e-oHM",
            user_id=user_id
        ),
        Host(
            name="Sushant Divgikar",
            bio="Drag artist, LGBTQ+ activist, and performer known as Rani Ko-HE-Nur. Advocate for diversity, inclusion, and queer rights in India.",
            email="sushant@raniko-he-nur.com",
            image_url="https://upload.wikimedia.org/wikipedia/commons/e/e9/Sushant_Divgikar.jpg",
            user_id=user_id
        ),
        Host(
            name="Cyrus Broacha",
            bio="Veteran comedian, TV host, and podcaster. Pioneer of Indian comedy shows and creator of India's longest-running podcast.",
            email="cyrus@cyrussays.com",
            image_url="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTukKUD6t1FC3H7L8XcY08ht98Afe52K-p7Pw&s",
            user_id=user_id
        ),
        Host(
            name="Sejal Kumar",
            bio="Fashion and lifestyle content creator. One of India's top fashion YouTubers sharing style tips, sustainable fashion, and beauty trends.",
            email="sejal@sejalstyle.com",
            image_url="https://en.wikiflux.org/wiki/images/3/3e/Sejal_kumar.jpg",
            user_id=user_id
        ),
        Host(
            name="Kushal Mehra",
            bio="Rationalist, podcaster, and social commentator. Known for thought-provoking debates on politics, religion, and free speech in India.",
            email="kushal@carvaka.in",
            image_url="https://www.hindustantimes.com/ht-img/img/2025/11/04/550x309/Kushal_Mehra_1762228639791_1762228639955.jpg",
            user_id=user_id
        ),
        Host(
            name="Masoom Minawala",
            bio="Global fashion influencer and entrepreneur. First Indian fashion blogger to walk international runways and collaborate with luxury brands.",
            email="masoom@masoomminawala.com",
            image_url="https://www.deccanchronicle.com/h-upload/2024/04/20/1086863-masoombook.webp",
            user_id=user_id
        ),
    ]
    
    # Insert hosts
    host_docs = []
    for host in default_hosts:
        doc = host.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        host_docs.append(doc)
    await db.hosts.insert_many(host_docs)
    
    # Create default shows
    default_shows = [
        Show(
            title="The Ranveer Show",
            description="Deep dive conversations with successful entrepreneurs, Bollywood celebrities, spiritual leaders, and change-makers. Uncensored, unfiltered discussions about life, business, and success in India.",
            host_id=default_hosts[0].id,
            category="Entrepreneurship & Self-Improvement",
            cover_image_url="https://media.licdn.com/dms/image/v2/D5603AQGlosHMDk-kwg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1730171107969?e=2147483647&v=beta&t=JjvBV0xZbnAT3K5dKeo-GaXQ7YG6lETvVgWDcIC-3mo",
            status="active",
            user_id=user_id
        ),
        Show(
            title="WTF is with Nikhil Kamath",
            description="India's top entrepreneurs, athletes, and thought leaders share their stories. From startup founders to Olympic champions, explore what made them successful.",
            host_id=default_hosts[1].id,
            category="Business & Finance",
            cover_image_url="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400",
            status="active",
            user_id=user_id
        ),
        Show(
            title="Honestly by Tanmay Bhat",
            description="Gaming, comedy, and unfiltered takes on internet culture. Tanmay chats with creators, comedians, and internet personalities about building online presence.",
            host_id=default_hosts[2].id,
            category="Gaming & Internet Culture",
            cover_image_url="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400",
            status="active",
            user_id=user_id
        ),
        Show(
            title="Figuring Out with Raj Shamani",
            description="Young entrepreneurs and professionals share their success stories, failures, and advice for building careers and businesses in India.",
            host_id=default_hosts[3].id,
            category="Business & Career",
            cover_image_url="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400",
            status="active",
            user_id=user_id
        ),
        Show(
            title="The Sushant Divgikar Podcast",
            description="Conversations about LGBTQ+ rights, art, performance, and identity. Creating safe spaces for diverse voices in India.",
            host_id=default_hosts[4].id,
            category="LGBTQ+ & Society",
            cover_image_url="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
            status="active",
            user_id=user_id
        ),
        Show(
            title="Cyrus Says",
            description="India's longest-running podcast by Cyrus Broacha. Comedy, current events, and conversations with celebrities, politicians, and interesting Indians.",
            host_id=default_hosts[5].id,
            category="Comedy & Current Affairs",
            cover_image_url="https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400",
            status="active",
            user_id=user_id
        ),
        Show(
            title="The Fashion Edit",
            description="Fashion trends, sustainable fashion, and beauty industry insights. Discussions with designers, influencers, and entrepreneurs in Indian fashion.",
            host_id=default_hosts[6].id,
            category="Fashion & Lifestyle",
            cover_image_url="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400",
            status="active",
            user_id=user_id
        ),
        Show(
            title="Tech Careers India",
            description="Coding tutorials, career advice, and tech industry insights for Indian students and professionals. From college to Silicon Valley.",
            host_id=default_hosts[7].id,
            category="Technology & Careers",
            cover_image_url="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400",
            status="active",
            user_id=user_id
        ),
        Show(
            title="The Carvaka Podcast",
            description="Rational discourse on politics, religion, free speech, and social issues. Challenging orthodoxy and promoting critical thinking in India.",
            host_id=default_hosts[8].id,
            category="Politics & Philosophy",
            cover_image_url="https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400",
            status="active",
            user_id=user_id
        ),
        Show(
            title="Style & Substance",
            description="Global fashion, entrepreneurship in fashion industry, and building a personal brand. Insights from India's top fashion influencer.",
            host_id=default_hosts[9].id,
            category="Fashion & Entrepreneurship",
            cover_image_url="https://images.unsplash.com/photo-1445205170230-053b83016050?w=400",
            status="active",
            user_id=user_id
        )
    ]
    
    # Insert shows
    show_docs = []
    for show in default_shows:
        doc = show.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        show_docs.append(doc)
    await db.shows.insert_many(show_docs)
    
    # Create default episodes
    default_episodes = [
        Episode(
            show_id=default_shows[0].id,
            title="Virat Kohli on Cricket, Fitness & Mental Strength",
            description="Indian cricket legend Virat Kohli shares his journey from Delhi boy to captain of Team India. Discusses mental health, fitness routines, and handling pressure at the highest level.",
            episode_number=1,
            duration_minutes=38,
            audio_url="https://example.com/audio/ranveer-virat.mp3",
            video_url="https://www.youtube.com/watch?v=RoHEZmHZxzM",
            thumbnail_url="https://www.livehindustan.com/lh-img/smart/img/2025/08/18/original/virat_kohli_Century_1755524314723_1755524344202.jpg",
            status="published",
            user_id=user_id
        ),
        Episode(
            show_id=default_shows[0].id,
            title="Sadhguru on Purpose of Life",
            description="Spiritual leader Sadhguru answers a question about the purpose of life and explains why having a  \"god-given\" purpose will only restrict life.",
            episode_number=2,
            duration_minutes=13,
            audio_url="https://example.com/audio/ranveer-sadhguru.mp3",
            video_url="https://www.youtube.com/watch?v=vQ7ZvPghdy8",
            thumbnail_url="https://upload.wikimedia.org/wikipedia/commons/2/21/Sadhguru-Jaggi-Vasudev.jpg",
            status="published",
            user_id=user_id
        ),
        Episode(
            show_id=default_shows[0].id,
            title="Karan Johar: Bollywood",
            description="Get a rare glimpse into Karan's entrepreneurial side as he shares the startup journey of @DharmaMovies and the budgeting challenges of producing hit movies (which, as it turns out, can sometimes still result in losses). Don't miss this opportunity to learn from the best in the business!",
            episode_number=3,
            duration_minutes=37,
            audio_url="https://example.com/audio/ranveer-karan.mp3",
            video_url="https://www.youtube.com/watch?v=zl8XHf0naqg",
            thumbnail_url="https://img.indiaforums.com/person/480x360/0/0688-karan-johar.webp?c=4bD211",
            status="published",
            user_id=user_id
        ),
        Episode(
            show_id=default_shows[1].id,
            title="Ritesh Agarwal: Building OYO from Scratch",
            description="OYO founder Ritesh Agarwal shares his entrepreneurial journey from teenage dropout to building India's largest hospitality chain. Lessons on scaling, fundraising, and surviving failures.",
            episode_number=1,
            duration_minutes=88,
            audio_url="https://example.com/audio/wtf-ritesh.mp3",
            video_url="https://www.youtube.com/watch?v=B9jZABnvq9A",
            thumbnail_url="https://images.financialexpressdigital.com/2019/09/Ritesh-Agarwal-s.jpg",
            status="published",
            user_id=user_id
        ),
        Episode(
            show_id=default_shows[1].id,
            title="PV Sindhu: Olympic Glory & Mental Toughness",
            description="Badminton champion PV Sindhu talks about winning Olympic medals, dealing with losses, and the discipline required to be a world champion.",
            episode_number=2,
            duration_minutes=81,
            audio_url="https://example.com/audio/wtf-sindhu.mp3",
            video_url="https://www.youtube.com/watch?v=jB5xn3aONW0",
            thumbnail_url="https://bsmedia.business-standard.com/_media/bs/img/article/2016-08/20/full/1471666470-0938.jpg?im=FeatureCrop,size=(826,465)",
            status="published",
            user_id=user_id
        )
    ]
    
    # Insert episodes
    episode_docs = []
    for episode in default_episodes:
        doc = episode.model_dump()
        doc['published_at'] = doc['published_at'].isoformat()
        episode_docs.append(doc)
    await db.episodes.insert_many(episode_docs)
    
    # Create default advertisers
    default_advertisers = [
        Advertiser(
            company_name="Boat Lifestyle",
            contact_person="Aman Gupta",
            email="aman@boat-lifestyle.com",
            phone="+91 98765 43210",
            budget=85000.00,
            status="active",
            user_id=user_id
        ),
        Advertiser(
            company_name="CRED",
            contact_person="Kunal Shah",
            email="partnerships@cred.club",
            phone="+91 98765 43211",
            budget=120000.00,
            status="active",
            user_id=user_id
        ),
        Advertiser(
            company_name="Zerodha",
            contact_person="Nithin Kamath",
            email="marketing@zerodha.com",
            phone="+91 98765 43212",
            budget=95000.00,
            status="active",
            user_id=user_id
        ),
        Advertiser(
            company_name="Razorpay",
            contact_person="Shashank Kumar",
            email="shashank@razorpay.com",
            phone="+91 98765 43213",
            budget=78000.00,
            status="active",
            user_id=user_id
        ),
        Advertiser(
            company_name="Nykaa",
            contact_person="Falguni Nayar",
            email="partnerships@nykaa.com",
            phone="+91 98765 43214",
            budget=92000.00,
            status="active",
            user_id=user_id
        ),
        Advertiser(
            company_name="Mamaearth",
            contact_person="Ghazal Alagh",
            email="ghazal@mamaearth.in",
            phone="+91 98765 43215",
            budget=68000.00,
            status="active",
            user_id=user_id
        ),
        Advertiser(
            company_name="PhonePe",
            contact_person="Sameer Nigam",
            email="marketing@phonepe.com",
            phone="+91 98765 43216",
            budget=105000.00,
            status="active",
            user_id=user_id
        ),
        Advertiser(
            company_name="Meesho",
            contact_person="Vidit Aatrey",
            email="vidit@meesho.com",
            phone="+91 98765 43217",
            budget=72000.00,
            status="active",
            user_id=user_id
        ),
        Advertiser(
            company_name="Groww",
            contact_person="Lalit Keshre",
            email="partnerships@groww.in",
            phone="+91 98765 43218",
            budget=88000.00,
            status="active",
            user_id=user_id
        ),
        Advertiser(
            company_name="Dream11",
            contact_person="Harsh Jain",
            email="harsh@dream11.com",
            phone="+91 98765 43219",
            budget=110000.00,
            status="active",
            user_id=user_id
        ),
        Advertiser(
            company_name="Zomato",
            contact_person="Deepinder Goyal",
            email="marketing@zomato.com",
            phone="+91 98765 43220",
            budget=98000.00,
            status="active",
            user_id=user_id
        ),
        Advertiser(
            company_name="Paytm",
            contact_person="Vijay Shekhar Sharma",
            email="partnerships@paytm.com",
            phone="+91 98765 43221",
            budget=102000.00,
            status="active",
            user_id=user_id
        )
    ]
    
    # Insert advertisers
    advertiser_docs = []
    for advertiser in default_advertisers:
        doc = advertiser.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        advertiser_docs.append(doc)
    await db.advertisers.insert_many(advertiser_docs)
    
    return {
        "message": "Indian podcast sample data initialized successfully",
        "initialized": True,
        "counts": {
            "hosts": len(default_hosts),
            "shows": len(default_shows),
            "episodes": len(default_episodes),
            "advertisers": len(default_advertisers)
        }
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()