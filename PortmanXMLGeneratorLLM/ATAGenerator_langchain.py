import requests
import yaml
from src.prompt_engineering.prompt_manager import PromptManager
from src.confidential_mind_api import confidential_mind_api_inference
from utils import str_presenter, save_json_and_llm_xml

# URL to fetch data
url = "https://meri.digitraffic.fi/api/port-call/v1/port-calls"
response = requests.get(url)


if response.status_code == 200:
    data = response.json()
    # Extract 'portCalls' list
    port_calls = data.get('portCalls', [])
    top_port_calls = port_calls[:10]

else:
    print(f"Failed to fetch data. Status code: {response.status_code}")

# Register the custom presenter
yaml.add_representer(str, str_presenter)

# Save LLM response and json data to yaml file
for i in range (0,len(top_port_calls)):
    user_input = top_port_calls[i]
    response = PromptManager().run_prompt( user_input=user_input, method="convert_json_to_xml", llm="hf")
    yaml_path = f"results/ata_answers/ATA_answers_{i}.yaml"
    save_json_and_llm_xml(user_input, response, yaml_path)
    print(f"Data saved to {yaml_path}")

