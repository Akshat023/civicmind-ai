from database.issue_state import IssueState

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


class RoutingAgent:
    def run(self, state: IssueState) -> IssueState:
        print(f"[RoutingAgent] Routing issue {state.issue_id}")
        state.pipeline_stage = "routing"

        try:
            dept = DEPARTMENT_MAP.get(state.category, DEPARTMENT_MAP["Other"])
            state.department = dept["name"]
            state.department_email = dept["email"]
            state.status = "Assigned"

            print(f"[RoutingAgent] Assigned to: {state.department}")

        except Exception as e:
            state.error = f"RoutingAgent error: {str(e)}"
            state.department = "Municipal Corporation"
            print(f"[RoutingAgent] ERROR: {str(e)}")

        return state
