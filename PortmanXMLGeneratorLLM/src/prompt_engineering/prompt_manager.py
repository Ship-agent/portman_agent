from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_community.llms import HuggingFaceHub, OpenAI
from dotenv import load_dotenv
from config import HUGGING_FACE_CONFIG
import os
import yaml

class PromptManager:
    def __init__(self, template_path="llm_config/prompts.yaml"):
        # Load environment variables
        load_dotenv()
        self.huggingface_api_key = HUGGING_FACE_CONFIG["function_key"]
        if not self.huggingface_api_key:
            raise EnvironmentError("HUGGINGFACE_API_KEY not found in environment variables.")

        # Initialize LLMs
        # self.openai_llm = OpenAI(
            # model_name="gpt-4o-mini",
            # temperature=0.7,
            # openai_api_key=self.openai_api_key
        # )

        self.hf_llm = HuggingFaceHub(
            repo_id="meta-llama/Llama-2-70b",
            model_kwargs={"max_new_tokens": 200},
            huggingfacehub_api_token=self.huggingface_api_key
        )

        # Load templates from YAML
        self.templates = self.load_templates(template_path)
        xml_path="llm_config/ATA_template.xml"
        with open(xml_path, 'r') as file:
            self.example_xml=  file.read()


    def load_templates(self, template_path):
        """Load prompt templates from YAML file."""
        try:
            with open(template_path, 'r') as file:
                return yaml.safe_load(file)
        except FileNotFoundError:
            raise FileNotFoundError(f"Prompt template file not found: {template_path}")
        except yaml.YAMLError as e:
            raise ValueError(f"Error parsing YAML file: {e}")

    def optimize_prompt(self, user_input, method="convert_json_to_xml"):
        """Format the prompt using the chosen template and input."""
        
        if method not in self.templates:
            raise KeyError(f"Template method '{method}' not found.")
        if method == "convert_json_to_xml":
            return self.templates[method].format(user_input=user_input, example_xml = self.example_xml )
        # Will add more methods here

        return self.templates[method].format(input=user_input)
    
    def get_prompt_chain(self, method="cot", llm="hf"):
        """Return a LangChain LLMChain using the specified prompt template and LLM."""
        if method not in self.templates:
            raise KeyError(f"No prompt template found for method '{method}'")

        prompt_template = PromptTemplate(
           input = ["user_input", "example_xml"], 
            template=self.templates[method]
        )

        selected_llm = self.openai_llm if llm == "openai" else self.hf_llm
        return LLMChain(prompt=prompt_template, llm=selected_llm)

    def run_prompt(self, method="cot", llm="openai", user_input=None):
        """Run a prompt through the specified LLM using a method key from templates."""
        chain = self.get_prompt_chain(method=method, llm=llm)
        response = chain.invoke({"example_xml": self.example_xml, "user_input": user_input})

        print("response", response["text"])
        
        return response["text"]


