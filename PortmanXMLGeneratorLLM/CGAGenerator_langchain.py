import requests
import yaml
from src.prompt_engineering.prompt_manager import PromptManager
from src.RAG.query_rag import query_rag
from utils import str_presenter, save_json_and_llm_xml

query=input("Enter your query: ")
collection_name = "port_calls"

context = query_rag(query, collection_name)
response = PromptManager().run_prompt( context=context, method="cga_xml", llm="hf")
yaml_path = f"results/CGA_answers/CGA_answers_{i}.yaml"
save_json_and_llm_xml(user_input, response, yaml_path)
print(f"Data saved to {yaml_path}")

