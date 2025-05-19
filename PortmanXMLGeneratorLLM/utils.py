import re
import yaml
import json 

def str_presenter(dumper, data):
    """Custom YAML presenter for strings to handle multiline strings."""
    if '\n' in data:  # multiline
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)

def clean_llm_response(llm_xml_string):
    """Extract and clean the XML string from the LLM response."""
    match = re.search(r"```xml\s*(.*?)\s*```", llm_xml_string, re.DOTALL)
    raw_xml = match.group(1) if match else llm_xml_string
    cleaned_xml = raw_xml.encode('utf-8').decode('unicode_escape')
    return cleaned_xml.strip()

def save_json_and_llm_xml(json_data, llm_xml_string, output_filename):
    """ Save JSON data and cleaned LLM XML response to a YAML file."""
    json_str = json.dumps(json_data, indent=2)
    cleaned_xml = clean_llm_response(llm_xml_string)

    data = {
        'json': json_str,
        'xml': cleaned_xml
    }

    with open(output_filename, 'w') as f:
        yaml.dump(data, f, sort_keys=False, default_flow_style=False, allow_unicode=True)