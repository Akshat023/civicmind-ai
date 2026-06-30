from database.issue_state import IssueState
import math

# In production this queries Firestore. 
# For local dev, we use an in-memory store that mimics the same interface.
_in_memory_issues = []  # swap for Firestore in prod


def haversine_distance(lat1, lon1, lat2, lon2) -> float:
    """Returns distance in meters between two GPS coordinates."""
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class DuplicateAgent:
    DUPLICATE_RADIUS_METERS = 100  # within 100m = potential duplicate
    SAME_CATEGORY_REQUIRED = True

    def run(self, state: IssueState) -> IssueState:
        print(f"[DuplicateAgent] Checking duplicates for issue {state.issue_id}")
        state.pipeline_stage = "duplicate_check"

        try:
            if state.latitude is None or state.longitude is None:
                print("[DuplicateAgent] No location data — skipping duplicate check")
                state.is_duplicate = False
                return state

            # Check against existing issues
            for existing in _in_memory_issues:
                if existing.get("status") == "Resolved":
                    continue  # resolved issues don't count

                if self.SAME_CATEGORY_REQUIRED and existing.get("category") != state.category:
                    continue

                dist = haversine_distance(
                    state.latitude, state.longitude,
                    existing["latitude"], existing["longitude"]
                )

                if dist <= self.DUPLICATE_RADIUS_METERS:
                    state.is_duplicate = True
                    state.duplicate_of = existing["issue_id"]
                    print(f"[DuplicateAgent] DUPLICATE found — matches issue {state.duplicate_of} ({dist:.1f}m away)")
                    return state

            state.is_duplicate = False
            print("[DuplicateAgent] No duplicate found")

        except Exception as e:
            state.error = f"DuplicateAgent error: {str(e)}"
            state.is_duplicate = False
            print(f"[DuplicateAgent] ERROR: {str(e)}")

        return state

    @staticmethod
    def register_issue(state: IssueState):
        """Call this after a new issue is saved to Firestore."""
        _in_memory_issues.append({
            "issue_id": state.issue_id,
            "category": state.category,
            "latitude": state.latitude,
            "longitude": state.longitude,
            "status": state.status,
        })
