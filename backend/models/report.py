from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(50), nullable=False)  # 'user_activity', 'cost_analysis', etc.
    title = Column(String(200), nullable=False)
    description = Column(Text)
    data = Column(JSON)  # Report data
    parameters = Column(JSON)  # Report parameters (date range, filters, etc.)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Multi-tenant field - reports belong to an organization
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    generated_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="reports")