from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.db import get_db, get_factory_db
from app.models.factory import Mentor
from pydantic import BaseModel
from typing import Optional
import datetime
from jose import JWTError, jwt
import bcrypt
from app.core.config import settings
from fastapi.security import OAuth2PasswordBearer
from app.core.firebase_config import verify_token, init_firebase
from firebase_admin import auth

# Initialize Firebase on router load
init_firebase()

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

class LoginRequest(BaseModel):
    mentor: str
    key: str

class GoogleLoginRequest(BaseModel):
    credential: str

class RegisterRequest(BaseModel):
    credential: str
    mentor_id: str

class MentorRegister(BaseModel):
    mentor_id: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def get_password_hash(password: str):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    if not hashed_password:
        return False
    # If it's a BCrypt hash (starts with $2b$ or $2a$)
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
        try:
            password_byte_enc = plain_password.encode('utf-8')
            hashed_password_byte_enc = hashed_password.encode('utf-8')
            return bcrypt.checkpw(password_byte_enc, hashed_password_byte_enc)
        except Exception:
            return False
    # Otherwise, check for plaintext (legacy initial accounts like 'toby')
    return plain_password == hashed_password

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_factory_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        mentor_id: str = payload.get("sub")
        if mentor_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(Mentor).filter(Mentor.mentor_id == mentor_id).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register")
async def register_mentor(mentor_in: MentorRegister, db: Session = Depends(get_db)):
    db_mentor = db.query(Mentor).filter(Mentor.mentor_id == mentor_in.mentor_id).first()
    if db_mentor:
        raise HTTPException(status_code=400, detail="Mentor ID already registered")
    
    new_mentor = Mentor(
        mentor_id=mentor_in.mentor_id,
        email=mentor_in.email,
        password_hash=get_password_hash(mentor_in.password),
        role="mentor",
        status="active"
    )
    db.add(new_mentor)
    db.commit()
    db.refresh(new_mentor)
    return {"message": "Mentor registered", "mentor_id": new_mentor.mentor_id}

@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_factory_db)):
    db_mentor = db.query(Mentor).filter(Mentor.mentor_id == req.mentor).first()
    
    if not db_mentor:
        raise HTTPException(status_code=401, detail="Invalid mentor ID")

    # verify password (BCrypt or Plaintext for legacy)
    is_valid = False
    try:
        if db_mentor.password_hash.startswith("$2") or db_mentor.password_hash.startswith("$argon2"):
            is_valid = bcrypt.checkpw(req.key.encode('utf-8'), db_mentor.password_hash.encode('utf-8'))
        else:
            is_valid = (db_mentor.password_hash == req.key)
    except:
        is_valid = (db_mentor.password_hash == req.key)

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid password")
    
    access_token = create_access_token(data={"sub": db_mentor.mentor_id, "role": db_mentor.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google-login")
async def google_login(req: GoogleLoginRequest, db: Session = Depends(get_factory_db)):
    try:
        decoded_token = auth.verify_id_token(req.credential)
        email = decoded_token.get("email")
        
        if not email:
            raise HTTPException(status_code=400, detail="Invalid token: no email")
            
        # Check/Create mentor in global factory database by email
        db_mentor = db.query(Mentor).filter(Mentor.email == email).first()
        
        # 🛑 Enforcement: toby and guest can ONLY use password login
        if db_mentor and (db_mentor.mentor_id == "toby" or "guest" in db_mentor.mentor_id):
            raise HTTPException(
                status_code=403, 
                detail=f"Account '{db_mentor.mentor_id}' is restricted to Security Key login only."
            )
    
        if not db_mentor:
            # Auto-provision if it's the owner email
            if email == "toydogcat@gmail.com":
                db_mentor = Mentor(
                    mentor_id="toydog", 
                    email=email,
                    status="active"
                )
                db.add(db_mentor)
                db.commit()
                db.refresh(db_mentor)
            else:
                raise HTTPException(status_code=401, detail="Google account not authorized")
        
        db_mentor.last_active_at = datetime.datetime.utcnow()
        db.commit()
        
        access_token = create_access_token(data={"sub": db_mentor.mentor_id, "role": db_mentor.role})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"Firebase Login Error: {str(e)}")

@router.get("/me")
async def read_users_me(current_user: Mentor = Depends(get_current_user)):
    return {
        "mentor_id": current_user.mentor_id, 
        "role": current_user.role, 
        "email": current_user.email, 
        "points": current_user.points or 0
    }

@router.get("/mentors")
async def get_mentors(db: Session = Depends(get_factory_db), current_user: Mentor = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    mentors = db.query(Mentor).all()
    return [
        {
            "mentor_id": m.mentor_id, 
            "email": m.email, 
            "status": m.status, 
            "role": m.role, 
            "points": m.points or 0
        } for m in mentors
    ]
