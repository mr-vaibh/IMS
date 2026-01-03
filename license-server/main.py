from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import Base, engine, SessionLocal
from models import License

from admin import router as admin_router
from fastapi.staticfiles import StaticFiles



from pydantic import BaseModel

class AllowRequest(BaseModel):
    instance_id: str
    company: str


class ValidateRequest(BaseModel):
    instance_id: str

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Admin Panel
app.include_router(admin_router)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/validate")
def validate(req: ValidateRequest, db: Session = Depends(get_db)):
    lic = db.query(License).filter(
        License.instance_id == req.instance_id
    ).first()

    print("VALIDATING INSTANCE:", req.instance_id)
    print("DB ROW:", lic)

    if not lic:
        return {"valid": False}

    return {"valid": True}

@app.post("/allow")
def allow(req: AllowRequest, db: Session = Depends(get_db)):
    lic = db.query(License).filter(
        License.instance_id == req.instance_id
    ).first()

    if lic:
        lic.company_name = req.company
        db.commit()
        return {"ok": True, "updated": True}

    lic = License(
        instance_id=req.instance_id,
        company_name=req.company
    )
    db.add(lic)
    db.commit()
    return {"ok": True, "created": True}

app.mount("/ui", StaticFiles(directory="static", html=True), name="ui")
