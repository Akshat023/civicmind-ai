from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime
import uuid


@dataclass
class IssueState:
    """
    Shared state object passed through the entire agent pipeline.
    Every agent reads from and writes to this object.
    """
    # Identity
    issue_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    # Raw input
    image_base64: Optional[str] = None
    image_url: Optional[str] = None        # After Cloud Storage upload
    user_id: Optional[str] = None
    user_description: Optional[str] = None

    # Location (filled by Geo Agent or user)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    ward: Optional[str] = None
    district: Optional[str] = None

    # Vision Agent output
    category: Optional[str] = None         # e.g. "Pothole", "Water Leakage"
    severity: Optional[str] = None         # "Low" | "Medium" | "High" | "Critical"
    confidence: Optional[float] = None     # 0.0 - 1.0
    vision_description: Optional[str] = None

    # Confidence gate
    needs_community_validation: bool = False
    community_votes: int = 0
    validation_threshold: int = 3          # votes needed to proceed

    # Duplicate Agent output
    is_duplicate: bool = False
    duplicate_of: Optional[str] = None     # issue_id of existing report

    # Priority Agent output
    priority_score: Optional[float] = None  # 0-100
    priority_label: Optional[str] = None   # "Low" | "Medium" | "High" | "Critical"
    priority_breakdown: Optional[dict] = None

    # Routing Agent output
    department: Optional[str] = None
    department_email: Optional[str] = None
    assigned_officer: Optional[str] = None

    # Status
    status: str = "Pending"               # Pending | Validated | Assigned | In Progress | Resolved
    pipeline_stage: str = "vision"        # tracks where we are in the pipeline

    # Error handling
    error: Optional[str] = None

    def to_dict(self) -> dict:
        return {k: v for k, v in self.__dict__.items()}
