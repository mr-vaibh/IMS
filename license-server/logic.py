from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import License

def validate_license(db: Session, license_key: str, instance_id: str):
    lic = db.query(License).filter(
        License.license_key == license_key
    ).first()

    if not lic:
        return False, "not_found", None

    if not lic.is_active:
        return False, "revoked", None

    now = datetime.now(timezone.utc)
    if lic.expires_at.replace(tzinfo=timezone.utc) < now:
        return False, "expired", None

    if lic.bound_instance_id:
        if lic.bound_instance_id != instance_id:
            return False, "instance_mismatch", None
    else:
        lic.bound_instance_id = instance_id
        db.commit()

    return True, None, lic
