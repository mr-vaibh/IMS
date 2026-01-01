from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

class LicenseCreate(BaseModel):
    license_key: str
    company_name: str
    expires_at: datetime
    is_active: bool = True
    max_users: Optional[int] = None
    features: Dict[str, bool]

class LicenseValidateRequest(BaseModel):
    license_key: str
    instance_id: str
