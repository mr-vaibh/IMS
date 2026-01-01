from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import SessionLocal
from models import License

router = APIRouter(prefix="/admin")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/licenses")
def list_licenses(request: Request, db: Session = Depends(get_db)):
    return db.query(License).all()

@router.post("/allow")
def allow_instance(instance_id: str, company: str, request: Request, db: Session = Depends(get_db)):
    if db.query(License).filter_by(instance_id=instance_id).first():
        return {"status": "already_allowed"}

    lic = License(instance_id=instance_id, company_name=company)
    db.add(lic)
    db.commit()
    return {"status": "allowed"}

@router.post("/revoke")
def revoke_instance(instance_id: str, request: Request, db: Session = Depends(get_db)):
    lic = db.query(License).filter_by(instance_id=instance_id).first()
    if not lic:
        return {"status": "not_found"}

    db.delete(lic)
    db.commit()
    return {"status": "revoked"}
