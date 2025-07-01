import requests
from config import CONFIDENTIAL_MIND_CONFIG

def confidential_mind_api_inference(prompt):
    # Configuration from ConfidentialMind portal
    confidential_mind_api_baseurl = CONFIDENTIAL_MIND_CONFIG["function_url"]
    confidential_mind_api_key = CONFIDENTIAL_MIND_CONFIG["function_key"]

    # Headers with authorization
    headers = {
        "Authorization": f"Bearer {confidential_mind_api_key}",
        "Content-Type": "application/json"
    }

    # Make the API call to Confidential Mind
    response = requests.post(
        f"{confidential_mind_api_baseurl}/v1/chat/completions",
        headers=headers,
        json={
            "model": "cm-llm",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7
        }
    )
    

    return (response.json()["choices"][0]["message"]["content"])