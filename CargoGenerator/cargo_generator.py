import logging
import json
import os
import time
import random
import azure.functions as func
from openai import AzureOpenAI
from datetime import datetime
import requests

def cargo_generator(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Cargo Generator function processed a request.')

    # Get parameters from the request
    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            "Please pass a valid JSON body with 'imo', 'portToVisit', and 'prevPort' fields",
            status_code=400
        )

    imo = req_body.get('imo')
    port_to_visit = req_body.get('portToVisit')
    prev_port = req_body.get('prevPort')
    berth_code = req_body.get('berthCode')

    if not imo:
        return func.HttpResponse(
            "Please provide a valid IMO number in the request body",
            status_code=400
        )

    if not port_to_visit:
        return func.HttpResponse(
            "Please provide a valid port of arrival in the request body",
            status_code=400
        )

    try:
        # Set up the OpenAI client for Azure OpenAI
        client = AzureOpenAI(
            api_key=os.environ["OPENAI_API_KEY"],
            api_version=os.environ.get("OPENAI_API_VERSION", "2023-05-15"),
            azure_endpoint=os.environ["OPENAI_ENDPOINT"],
            # Disable default retry behavior since we'll handle it manually
            max_retries=0
        )

        # Use the deployment name directly from environment variables
        deployment_name = os.environ["OPENAI_DEPLOYMENT_NAME"]
        logging.info(f"Using model deployment: {deployment_name}")

        # Generate cargo declaration using OpenAI with custom retry logic
        max_retries = 3
        retry_delay = 5  # Start with 5 seconds
        attempt = 0

        while attempt < max_retries:
            try:
                cargo_data = generate_cargo_data(imo, port_to_visit, prev_port, berth_code, client, deployment_name)

                return func.HttpResponse(
                    json.dumps(cargo_data),
                    mimetype="application/json"
                )
            except Exception as retry_error:
                attempt += 1
                if "429" in str(retry_error) and attempt < max_retries:
                    # Rate limit hit, exponential backoff
                    retry_delay_with_jitter = retry_delay * (2 ** (attempt - 1)) * (0.8 + 0.4 * random.random())
                    logging.warning(f"Rate limit hit. Retrying in {retry_delay_with_jitter:.2f} seconds. Attempt {attempt} of {max_retries}")
                    time.sleep(retry_delay_with_jitter)
                else:
                    # Last attempt or different error
                    if attempt >= max_retries:
                        logging.error(f"Max retries reached. Last error: {str(retry_error)}")
                    raise retry_error

    except Exception as e:
        logging.error(f"Error generating cargo data: {str(e)}")

        if "429" in str(e):
            return func.HttpResponse(
                "Azure OpenAI service is currently rate limited. Please try again later.",
                status_code=429
            )

        return func.HttpResponse(
            f"Error generating cargo data: {str(e)}",
            status_code=500
        )

def get_vessel_details(imo):
    """
    Call the vessel-details function to get vessel information
    """
    try:
        # Get the base URL for the function app
        function_app_url = os.environ.get("FUNCTION_APP_URL")
        vessel_details_url = f"{function_app_url}/api/vessel-details"
        function_key = os.environ.get("VESSEL_DETAILS_FUNCTION_KEY", "")

        # Prepare headers
        headers = {"Content-Type": "application/json"}
        if function_key:
            headers["x-functions-key"] = function_key

        # Make the request
        response = requests.post(
            vessel_details_url,
            headers=headers,
            json={"imo": imo}
        )

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            logging.warning(f"No vessel details found for IMO {imo}")
            return None
        else:
            logging.error(f"Error from vessel-details function: {response.status_code}, {response.text}")
            return None

    except Exception as e:
        logging.error(f"Error calling vessel-details function: {str(e)}")
        return None

def get_port_details(port_code, berth_code=None):
    """
    Get information about the port and berth
    """
    try:
        # Get the base URL for the function app
        function_app_url = os.environ.get("FUNCTION_APP_URL")
        port_details_url = f"{function_app_url}/api/port-details"  # Assuming this endpoint exists
        function_key = os.environ.get("PORT_DETAILS_FUNCTION_KEY", "")

        # Prepare headers
        headers = {"Content-Type": "application/json"}
        if function_key:
            headers["x-functions-key"] = function_key

        request_data = {"portCode": port_code}
        if berth_code:
            request_data["berthCode"] = berth_code

        # Make the request
        response = requests.post(
            port_details_url,
            headers=headers,
            json=request_data
        )

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            logging.warning(f"No port details found for port {port_code} and berth {berth_code}")
            return None
        else:
            logging.error(f"Error from port-details function: {response.status_code}, {response.text}")
            return None

    except Exception as e:
        logging.error(f"Error calling port-details function: {str(e)}")
        return {
            "portName": "Unknown port",
            "country": "Unknown",
            "facilities": ["general cargo"],
            "cargoTypes": ["general cargo", "containers", "bulk"]
        }  # Fallback default values

def get_historical_cargo_data(imo=None, port_code=None, berth_code=None):
    """
    Get historical cargo data for the vessel and/or port/berth
    """
    try:
        # Get the base URL for the function app
        function_app_url = os.environ.get("FUNCTION_APP_URL")
        historical_data_url = f"{function_app_url}/api/historical-cargo"  # Assuming this endpoint exists
        function_key = os.environ.get("HISTORICAL_CARGO_FUNCTION_KEY", "")

        # Prepare headers
        headers = {"Content-Type": "application/json"}
        if function_key:
            headers["x-functions-key"] = function_key

        request_data = {}
        if imo:
            request_data["imo"] = imo
        if port_code:
            request_data["portCode"] = port_code
        if berth_code:
            request_data["berthCode"] = berth_code

        # Make the request
        response = requests.post(
            historical_data_url,
            headers=headers,
            json=request_data
        )

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            logging.warning(f"No historical cargo data found for IMO {imo}, port {port_code}, berth {berth_code}")
            return None
        else:
            logging.error(f"Error from historical-cargo function: {response.status_code}, {response.text}")
            return None

    except Exception as e:
        logging.error(f"Error calling historical-cargo function: {str(e)}")
        return None

def generate_cargo_data(imo, port_to_visit, prev_port, berth_code, client, deployment_name):
    """Generate cargo declaration data using Azure OpenAI including vessel, port, and historical cargo details in the prompt"""

    system_prompt = """
    You are a cargo data generator for maritime vessels. You will be given a vessel's IMO number, previous port of call, port to visit, 
    and berth information, along with historical cargo data. Generate realistic cargo declaration data following the European Maritime 
    Single Window environment (EMSWe) specification for Cargo Declaration at Arrival (CGA).
    
    For the cargo details:
    1. Generate realistic cargo details based on typical operations for the vessel with this IMO
    2. Ensure the cargo aligns with both the vessel type and the port/berth's typical cargo handling capabilities
    3. Include container details if applicable to typical vessels on this route
    4. Include hazardous cargo information when applicable (with proper UN codes)
    5. Use appropriate weights and descriptions that make sense for the route and vessel type
    
    Format the response as a JSON object that can be used directly in a cargo declaration system.
    """

    # Get vessel details to include in the prompt
    vessel_details = get_vessel_details(imo)
    vessel_details_text = ""

    if vessel_details:
        vessel_details_text = "Vessel details:\n"
        for key, value in vessel_details.items():
            if value is not None:
                vessel_details_text += f"- {key}: {value}\n"
    else:
        vessel_details_text = "Vessel details are not available."

    # Get port and berth details
    port_details = get_port_details(port_to_visit, berth_code)
    port_details_text = ""

    if port_details:
        port_details_text = "\nPort and berth details:\n"
        for key, value in port_details.items():
            if value is not None:
                if isinstance(value, list):
                    port_details_text += f"- {key}: {', '.join(value)}\n"
                else:
                    port_details_text += f"- {key}: {value}\n"
    else:
        port_details_text = "\nPort and berth details are not available."

    # Get historical cargo data for the vessel
    vessel_cargo_history = get_historical_cargo_data(imo=imo)
    vessel_cargo_text = ""

    if vessel_cargo_history and "cargoHistory" in vessel_cargo_history:
        vessel_cargo_text = "\nVessel's typical cargo:\n"
        for cargo_item in vessel_cargo_history["cargoHistory"]:
            vessel_cargo_text += f"- {cargo_item.get('description', 'Unknown cargo')}: {cargo_item.get('frequency', '0')}%\n"
    else:
        vessel_cargo_text = "\nNo historical cargo data available for this vessel."

    # Get historical cargo data for the port/berth
    port_cargo_history = get_historical_cargo_data(port_code=port_to_visit, berth_code=berth_code)
    port_cargo_text = ""

    if port_cargo_history and "cargoHistory" in port_cargo_history:
        port_cargo_text = "\nPort/berth's typical cargo handling:\n"
        for cargo_item in port_cargo_history["cargoHistory"]:
            port_cargo_text += f"- {cargo_item.get('description', 'Unknown cargo')}: {cargo_item.get('frequency', '0')}%\n"
    else:
        port_cargo_text = "\nNo historical cargo data available for this port/berth."

    # Prepare prompt with additional information
    berth_text = f"and berth {berth_code}" if berth_code else ""
    prev_port_text = f"coming from previous port {prev_port}" if prev_port else "with unspecified previous port"
    user_prompt = f"""
    Generate a complete cargo declaration for vessel with IMO number {imo} {prev_port_text} and arriving at port {port_to_visit} {berth_text}.
    
    {vessel_details_text}
    {port_details_text}
    {vessel_cargo_text}
    {port_cargo_text}
    
    Generate a realistic cargo manifest based on:
    1. Transport Movement details (previous port: {prev_port if prev_port else 'unknown'}, port to visit: {port_to_visit}, berth: {berth_code if berth_code else 'unspecified'})
    2. 1-10 cargo items with appropriate weights and descriptions depending on vessel type
    3. Ensure cargo types match what this vessel typically carries AND what the port/berth typically handles
    4. No unrealistic items for vessel type, for example oil tanker should not have containers
    5. Container details if applicable
    6. Hazardous cargo details if applicable
    7. All required identifiers and codes according to EMSWe CGA specification
    8. Do not add vessel details to the response, they are already provided above
    
    Current date: {datetime.now().strftime('%Y-%m-%d')}
    """

    # Log the prompts
    if os.environ.get("LOG_PROMPTS", "false").lower() == "true":
        logging.info(f"System prompt: {system_prompt}")
        logging.info(f"User prompt: {user_prompt}")

    # Use the API format for openai v1.71.0
    response = client.chat.completions.create(
        model=deployment_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=4096,
        response_format={"type": "json_object"}
    )

    # Log the raw response if detailed logging is enabled
    if os.environ.get("LOG_RESPONSES", "false").lower() == "true":
        logging.info(f"Raw OpenAI response: {response}")

    # Parse the response
    try:
        if hasattr(response.choices[0].message, 'content'):
            content = response.choices[0].message.content
            if content:
                cargo_data = json.loads(content)

                # Also add vessel details to the response for completeness
                if vessel_details and isinstance(cargo_data, dict):
                    # Only add vessel details if they don't already exist in the response
                    if not has_vessel_info(cargo_data):
                        cargo_data["vesselDetails"] = {}
                        # Update the vesselDetails with the fetched data
                        for key, value in vessel_details.items():
                            if value is not None:
                                cargo_data["vesselDetails"][key] = value

                # Add port and berth details if available
                if port_details and isinstance(cargo_data, dict):
                    cargo_data["portDetails"] = port_details

                return cargo_data
            else:
                return {"error": "Empty response from OpenAI"}
        else:
            return {"error": "Unexpected response format from OpenAI"}
    except json.JSONDecodeError as e:
        logging.error(f"Failed to parse JSON response: {e}")
        # If the response isn't valid JSON, return it as a text field
        return {
            "generated_text": response.choices[0].message.content if hasattr(response.choices[0].message, 'content') else "No content",
            "note": "Response could not be parsed as JSON. Please format the text into proper JSON structure."
        }

    # Check recursively if vesselDetails or vesselInformation exists in cargo_data
def has_vessel_info(data):
    if not isinstance(data, dict):
        return False
    if "vesselDetails" in data or "vesselInformation" in data:
        return True
    for value in data.values():
        if isinstance(value, dict) and has_vessel_info(value):
            return True
    return False