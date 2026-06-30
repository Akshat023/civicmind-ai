import google.generativeai as genai
import base64
import json
import os
from database.issue_state import IssueState

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"))

VISION_PROMPT = """
You are an expert civic issue analyst. Analyze the uploaded image and return a JSON response with the following fields:

{
  "category": one of ["Pothole", "Water Leakage", "Garbage", "Broken Streetlight", "Damaged Road", "Sewage", "Encroachment", "Flooding", "Other"],
  "severity": one of ["Low", "Medium", "High", "Critical"],
  "confidence": a float between 0.0 and 1.0 indicating how confident you are,
  "description": a 1-2 sentence description of the issue visible in the image,
  "near_sensitive_location": true/false — is this near a school, hospital, or busy road based on visible context?
}

SEVERITY GUIDE:
- Critical: Immediate danger to life/traffic (e.g. massive pothole, sewage overflow on main road)
- High: Significant disruption (e.g. large pothole, major water leakage)
- Medium: Moderate issue (e.g. small pothole, minor leakage)
- Low: Minor inconvenience (e.g. small garbage pile, dim streetlight)

Respond ONLY with the JSON. No preamble, no explanation.
"""


class VisionAgent:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def run(self, state: IssueState) -> IssueState:
        print(f"[VisionAgent] Processing issue {state.issue_id}")
        state.pipeline_stage = "vision"

        try:
            if not state.image_base64:
                raise ValueError("No image provided to Vision Agent")

            # Decode base64 image
            image_data = base64.b64decode(state.image_base64)

            # Call Gemini Vision
            response = self.model.generate_content([
                VISION_PROMPT,
                {
                    "mime_type": "image/jpeg",
                    "data": image_data
                }
            ])

            # Parse JSON response
            raw = response.text.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            result = json.loads(raw.strip())

            state.category = result.get("category", "Other")
            state.severity = result.get("severity", "Medium")
            state.confidence = float(result.get("confidence", 0.5))
            state.vision_description = result.get("description", "")

            # Confidence gate — if low confidence, flag for community validation
            if state.confidence < 0.70:
                state.needs_community_validation = True
                print(f"[VisionAgent] Low confidence ({state.confidence:.2f}) — flagging for community validation")
            else:
                state.needs_community_validation = False

            print(f"[VisionAgent] Category: {state.category}, Severity: {state.severity}, Confidence: {state.confidence:.2f}")

        except Exception as e:
            state.error = f"VisionAgent error: {str(e)}"
            state.category = "Other"
            state.severity = "Medium"
            state.confidence = 0.0
            state.needs_community_validation = True
            print(f"[VisionAgent] ERROR: {str(e)}")

        return state
