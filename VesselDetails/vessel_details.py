import logging
import json
import azure.functions as func
import requests

def vessel_details(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Vessel Details function processed a request.')

    # Get parameters from the request
    try:
        req_body = req.get_json()
        imo = req_body.get('imo')
    except ValueError:
        # If there's no JSON body, check for query parameters
        imo = req.params.get('imo')
    
    if not imo:
        return func.HttpResponse(
            "Please provide a valid IMO number in the request body or query parameters",
            status_code=400
        )

    try:
        # Try to get vessel details
        vessel_data = fetch_vessel_details(imo)
        
        if vessel_data:
            logging.info(f"Retrieved vessel details for IMO {imo}: {vessel_data}")
            return func.HttpResponse(
                json.dumps(vessel_data),
                mimetype="application/json"
            )
        else:
            return func.HttpResponse(
                json.dumps({"error": f"No vessel details found for IMO {imo}"}),
                mimetype="application/json",
                status_code=404
            )
    
    except Exception as e:
        logging.error(f"Error fetching vessel details: {str(e)}")
        return func.HttpResponse(
            f"Error fetching vessel details: {str(e)}",
            status_code=500
        )

def fetch_vessel_details(imo):
    """
    Fetch vessel details from Digitraffic Port Call API.
    Returns None if details can't be retrieved.
    """
    try:
        # Digitraffic Port Call API endpoint
        url = f"https://meri.digitraffic.fi/api/port-call/v1/vessel-details?imo={imo}"
        response = requests.get(url)
        
        if response.status_code == 200:
            vessels = response.json()
            if vessels and len(vessels) > 0:
                vessel = vessels[0]  # Take the first vessel from the response
                
                # Extract vessel construction details
                vessel_construction = vessel.get("vesselConstruction", {})
                vessel_dimensions = vessel.get("vesselDimensions", {})
                vessel_registration = vessel.get("vesselRegistration", {})
                
                # Map the API response to our standard format with more detailed information
                return {
                    "name": vessel.get("name"),
                    "namePrefix": vessel.get("namePrefix"),
                    "callSign": vessel.get("radioCallSign"),
                    "flagState": vessel_registration.get("nationality"),
                    "vesselType": vessel_construction.get("vesselTypeName"),
                    "vesselTypeCode": vessel_construction.get("vesselTypeCode"),
                    "iceClass": vessel_construction.get("iceClassCode"),
                    "grossTonnage": vessel_dimensions.get("grossTonnage"),
                    "netTonnage": vessel_dimensions.get("netTonnage"),
                    "deadWeight": vessel_dimensions.get("deathWeight"),
                    "mmsi": vessel.get("mmsi"),
                    "length": vessel_dimensions.get("length"),
                    "overallLength": vessel_dimensions.get("overallLength"),
                    "breadth": vessel_dimensions.get("breadth"),
                    "draught": vessel_dimensions.get("draught"),
                    "portOfRegistry": vessel_registration.get("portOfRegistry"),
                    "dataSource": vessel.get("dataSource"),
                    "updateTimestamp": vessel.get("updateTimestamp")
                }
            # No vessel found with the given IMO
            logging.warning(f"No vessel found with IMO {imo} in Digitraffic Port Call API")
        else:
            logging.error(f"Failed to fetch vessel data from Digitraffic Port Call API: {response.status_code}, {response.text}")
            
    except Exception as e:
        logging.error(f"Error fetching vessel details: {str(e)}")
    
    return None
