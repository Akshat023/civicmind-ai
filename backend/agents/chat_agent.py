import google.generativeai as genai
import os
import json
from database.issue_state import IssueState

genai.configure(api_key=os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"))


class ChatAgent:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def answer(self, user_message: str, issue_state: dict = None) -> str:
        """Answer citizen queries about their complaint status."""

        context = ""
        if issue_state:
            context = f"""
Current issue context:
- Issue ID: {issue_state.get('issue_id')}
- Category: {issue_state.get('category')}
- Status: {issue_state.get('status')}
- Priority: {issue_state.get('priority_label')} (Score: {issue_state.get('priority_score')})
- Assigned to: {issue_state.get('department')}
- Reported at: {issue_state.get('created_at')}
- Description: {issue_state.get('vision_description')}
"""

        system_prompt = f"""
You are CivicMind AI, a helpful civic assistant for citizens reporting and tracking local infrastructure issues.
You are friendly, concise, and informative. You help citizens understand:
- The status of their complaints
- Why an issue was prioritized a certain way
- Which department is responsible
- Estimated resolution timelines (based on priority)
- How to escalate if needed

{context}

Guidelines:
- Be empathetic and professional
- Keep answers under 3 sentences unless more detail is needed
- If you don't know something, say so honestly
- Never make up specific timelines — give ranges instead (e.g. "typically 2-5 days for High priority issues")
"""

        try:
            response = self.model.generate_content([
                {"role": "user", "parts": [system_prompt + "\n\nCitizen: " + user_message]}
            ])
            return response.text.strip()
        except Exception as e:
            return f"I'm sorry, I couldn't process your query right now. Please try again. (Error: {str(e)})"

    def mayor_query(self, natural_language_query: str, all_issues: list) -> str:
        """Answer Mayor Dashboard natural language queries about city-wide data."""

        summary = json.dumps(all_issues[:50], indent=2, default=str)  # limit context

        prompt = f"""
You are the CivicMind City Intelligence AI. You answer questions from city officials about civic issue data.
Be concise, data-driven, and actionable.

Current issue data (up to 50 most recent):
{summary}

Official's question: {natural_language_query}

Answer the question based strictly on the data above. If data is insufficient, say so.
"""

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            return f"Unable to process query: {str(e)}"
