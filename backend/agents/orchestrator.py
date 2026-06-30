from database.issue_state import IssueState
from agents.vision_agent import VisionAgent
from agents.duplicate_agent import DuplicateAgent
from agents.priority_agent import PriorityAgent
from agents.routing_agent import RoutingAgent


class Orchestrator:
    """
    The heart of CivicMind AI.
    Pipelines agents in sequence, passing the shared IssueState through each.

    Flow:
    Upload → VisionAgent → [Confidence Gate] → DuplicateAgent → PriorityAgent → RoutingAgent → Save
    """

    def __init__(self):
        self.vision = VisionAgent()
        self.duplicate = DuplicateAgent()
        self.priority = PriorityAgent()
        self.routing = RoutingAgent()

    def process(self, state: IssueState) -> IssueState:
        print(f"\n{'='*50}")
        print(f"[Orchestrator] Starting pipeline for issue {state.issue_id}")
        print(f"{'='*50}")

        # Stage 1: Vision Analysis
        state = self.vision.run(state)
        if state.error:
            print(f"[Orchestrator] Pipeline halted at VisionAgent: {state.error}")
            # Continue anyway with defaults — don't break the UX

        # Stage 2: Confidence Gate
        if state.needs_community_validation:
            print(f"[Orchestrator] Issue flagged for community validation (confidence: {state.confidence:.2f})")
            state.status = "Awaiting Validation"
            state.pipeline_stage = "community_validation"
            # Return early — pipeline resumes when votes reach threshold
            return state

        # Stage 3: Duplicate Detection
        state = self.duplicate.run(state)
        if state.is_duplicate:
            print(f"[Orchestrator] Duplicate detected — merging with {state.duplicate_of}")
            state.status = "Duplicate"
            state.pipeline_stage = "complete"
            return state

        # Stage 4: Priority Scoring
        state = self.priority.run(state)

        # Stage 5: Department Routing
        state = self.routing.run(state)

        # Stage 6: Register in store (so future duplicates can find it)
        DuplicateAgent.register_issue(state)

        state.pipeline_stage = "complete"
        print(f"\n[Orchestrator] Pipeline complete ✅")
        print(f"  Category:   {state.category}")
        print(f"  Priority:   {state.priority_label} ({state.priority_score}/100)")
        print(f"  Department: {state.department}")
        print(f"  Status:     {state.status}")
        print(f"{'='*50}\n")

        return state

    def resume_after_validation(self, state: IssueState) -> IssueState:
        """Called when community votes hit the threshold."""
        print(f"[Orchestrator] Resuming pipeline after community validation for {state.issue_id}")
        state.needs_community_validation = False

        state = self.duplicate.run(state)
        if state.is_duplicate:
            state.status = "Duplicate"
            return state

        state = self.priority.run(state)
        state = self.routing.run(state)
        DuplicateAgent.register_issue(state)

        state.pipeline_stage = "complete"
        return state
