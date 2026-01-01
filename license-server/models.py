from sqlalchemy import Column, String
from database import Base

class License(Base):
    __tablename__ = "licenses"

    instance_id = Column(String, primary_key=True)
    company_name = Column(String, nullable=False)
