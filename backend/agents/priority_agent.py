from database.issue_state import IssueState

# Department routing table
DEPARTMENT_MAP = {
    "Pothole": {"name": "Public Works Department (PWD)", "email": "pwd@city.gov.in"},
    "Damaged Road": {"name": "Public Works Department (PWD)", "email": "pwd@city.gov.in"},
    "Water Leakage": {"name": "Water Supply Department", "email": "water@city.gov.in"},
    "Sewage": {"name": "Sewage & Sanitation Board", "email": "sanitation@city.gov.in"},
    "Garbage": {"name": "Municipal Corporation", "email": "municipal@city.gov.in"},
    "Broken Streetlight": {"name": "Electricity Department", "email": "electricity@city.gov.in"},
    "Flooding": {"name": "Disaster Management Cell", "email": "disaster@city.gov.in"},
    "Encroachment": {"name": "Revenue & Land Department", "email": "revenue@city.gov.in"},
    "Other": {"name": "Municipal Corporation", "email": "municipal@city.gov.in"},
}


class PriorityAgent:
    """
    Calculates a 0-100 priority score based on multiple weighted factors.
    Much more impressive than a simple High/Medium/Low.
    """

    SEVERITY_SCORES = {
        "Critical": 40,
        "High": 30,
        "Medium": 20,
        "Low": 10,
    }

    def run(self, state: IssueState) -> IssueState:
        print(f"[PriorityAgent] Scoring issue {state.issue_id}")
        state.pipeline_stage = "priority"

        try:
            score = 0
            breakdown = {}

            # 1. Image Severity (40%)
            severity_score = self.SEVERITY_SCORES.get(state.severity, 20)
            score += severity_score
            breakdown["severity"] = severity_score

            # 2. Category urgency bonus (15%)
            category_bonus = self._category_urgency(state.category)
            score += category_bonus
            breakdown["category_urgency"] = category_bonus

            # 3. Community reports / votes (10%)
            vote_score = min(state.community_votes * 2, 10)
            score += vote_score
            breakdown["community_votes"] = vote_score

            # 4. Location sensitivity (15%) — near hospital/school
            location_score = self._location_sensitivity(state)
            score += location_score
            breakdown["location_sensitivity"] = location_score

            # 5. Confidence penalty — reduce priority if uncertain (up to -20)
            confidence = state.confidence or 0.5
            confidence_adjustment = int((confidence - 0.5) * 20)  # -10 to +10
            score += confidence_adjustment
            breakdown["confidence_adjustment"] = confidence_adjustment

            # Clamp to 0-100
            final_score = max(0, min(100, score))

            state.priority_score = final_score
            state.priority_breakdown = breakdown
            state.priority_label = self._score_to_label(final_score)

            print(f"[PriorityAgent] Score: {final_score} ({state.priority_label})")
            print(f"[PriorityAgent] Breakdown: {breakdown}")

        except Exception as e:
            state.error = f"PriorityAgent error: {str(e)}"
            state.priority_score = 50
            state.priority_label = "Medium"
            print(f"[PriorityAgent] ERROR: {str(e)}")

        return state

    def _category_urgency(self, category: str) -> int:
        urgency_map = {
            "Flooding": 15,
            "Sewage": 12,
            "Pothole": 10,
            "Water Leakage": 10,
            "Damaged Road": 8,
            "Garbage": 6,
            "Broken Streetlight": 5,
            "Encroachment": 4,
            "Other": 3,
        }
        return urgency_map.get(category, 5)

    def _location_sensitivity(self, state: IssueState) -> int:
        # In production: use Google Maps Places API to check nearby hospitals/schools
        # For now: return a moderate score; this can be enhanced with Maps API
        return 10  # placeholder — enhance with real Maps API call

    def _score_to_label(self, score: float) -> str:
        if score >= 80:
            return "Critical"
        elif score >= 60:
            return "High"
        elif score >= 40:
            return "Medium"
        else:
            return "Low"
