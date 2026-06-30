from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Body
from fastapi.responses import JSONResponse
from typing import Optional
import base64
import json

from database.issue_state import IssueState
from agents.orchestrator import Orchestrator
from agents.chat_agent import ChatAgent

router = APIRouter()
orchestrator = Orchestrator()
chat_agent = ChatAgent()

# In-memory issue store (swap for Firestore in production)
issues_db: dict[str, dict] = {}


# ─── ISSUE REPORTING ─────────────────────────────────────────────────────────

@router.post("/report")
async def report_issue(
    image: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    user_description: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
):
    """
    Main endpoint — citizen uploads image, pipeline runs, returns full analysis.
    """
    try:
        # Read and encode image
        image_bytes = await image.read()
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        # Initialize issue state
        state = IssueState(
            image_base64=image_b64,
            latitude=latitude,
            longitude=longitude,
            user_description=user_description,
            user_id=user_id or "anonymous",
        )

        # Run the agent pipeline
        result = orchestrator.process(state)

        # Save to in-memory DB (replace with Firestore)
        issues_db[result.issue_id] = result.to_dict()

        # Return result (don't send image_base64 back — too large)
        response = result.to_dict()
        response.pop("image_base64", None)

        return JSONResponse(content={"success": True, "issue": response})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── GET ISSUE ────────────────────────────────────────────────────────────────

@router.get("/issues/{issue_id}")
def get_issue(issue_id: str):
    issue = issues_db.get(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return {"success": True, "issue": issue}


# ─── GET ALL ISSUES ───────────────────────────────────────────────────────────

@router.get("/issues")
def get_all_issues(status: Optional[str] = None, category: Optional[str] = None):
    all_issues = list(issues_db.values())

    if status:
        all_issues = [i for i in all_issues if i.get("status") == status]
    if category:
        all_issues = [i for i in all_issues if i.get("category") == category]

    return {"success": True, "issues": all_issues, "total": len(all_issues)}


# ─── UPDATE STATUS ────────────────────────────────────────────────────────────

@router.put("/issues/{issue_id}/status")
def update_status(issue_id: str, body: dict = Body(...)):
    issue = issues_db.get(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue["status"] = body.get("status", issue["status"])
    issues_db[issue_id] = issue
    return {"success": True, "issue": issue}


# ─── COMMUNITY VOTE ───────────────────────────────────────────────────────────

@router.post("/issues/{issue_id}/vote")
def vote_on_issue(issue_id: str):
    """Citizen upvotes/confirms an issue — used for community validation."""
    issue = issues_db.get(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue["community_votes"] = issue.get("community_votes", 0) + 1

    # If in validation state and votes hit threshold, resume pipeline
    if issue.get("status") == "Awaiting Validation":
        threshold = issue.get("validation_threshold", 3)
        if issue["community_votes"] >= threshold:
            state = IssueState(**{k: v for k, v in issue.items() if k in IssueState.__dataclass_fields__})
            state.community_votes = issue["community_votes"]
            result = orchestrator.resume_after_validation(state)
            issues_db[issue_id] = result.to_dict()
            return {"success": True, "message": "Validation threshold reached — pipeline resumed", "issue": result.to_dict()}

    issues_db[issue_id] = issue
    return {"success": True, "votes": issue["community_votes"]}


# ─── CITIZEN CHAT ─────────────────────────────────────────────────────────────

@router.post("/chat")
def citizen_chat(body: dict = Body(...)):
    message = body.get("message", "")
    issue_id = body.get("issue_id")

    issue_context = issues_db.get(issue_id) if issue_id else None
    response = chat_agent.answer(message, issue_context)

    return {"success": True, "response": response}


# ─── MAYOR DASHBOARD — NATURAL LANGUAGE QUERY ────────────────────────────────

@router.post("/mayor/query")
def mayor_query(body: dict = Body(...)):
    query = body.get("query", "")
    all_issues = list(issues_db.values())
    response = chat_agent.mayor_query(query, all_issues)
    return {"success": True, "response": response}


# ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

@router.get("/dashboard/stats")
def dashboard_stats():
    all_issues = list(issues_db.values())

    stats = {
        "total": len(all_issues),
        "by_status": {},
        "by_category": {},
        "by_priority": {},
        "critical_count": 0,
    }

    for issue in all_issues:
        # Status breakdown
        s = issue.get("status", "Unknown")
        stats["by_status"][s] = stats["by_status"].get(s, 0) + 1

        # Category breakdown
        c = issue.get("category", "Other")
        stats["by_category"][c] = stats["by_category"].get(c, 0) + 1

        # Priority breakdown
        p = issue.get("priority_label", "Unknown")
        stats["by_priority"][p] = stats["by_priority"].get(p, 0) + 1

        # Critical count
        if issue.get("priority_label") == "Critical":
            stats["critical_count"] += 1

    return {"success": True, "stats": stats, "issues": all_issues}
