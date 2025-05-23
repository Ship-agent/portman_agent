"""
Adapter module for converting Digitraffic port call data to the format expected by the EMSWe converter.
"""

import json
import logging
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger(__name__)


def adapt_digitraffic_to_portman(digitraffic_data: Dict[str, Any], xml_type=None) -> Dict[str, Any]:
    """
    Adapt Digitraffic port call data to the Portman format expected by the EMSWe converter.

    Args:
        digitraffic_data: Dictionary containing Digitraffic port call data
        xml_type: Type of XML formality (ATA, NOA, VID)

    Returns:
        Dictionary in Portman format suitable for EMSWe conversion
    """
    try:
        # Basic port call information
        port_call_id = digitraffic_data.get("portCallId", "unknown")
        vessel_name = digitraffic_data.get("vesselName", "unknown")
        imo_lloyds = digitraffic_data.get("imoLloyds", "unknown")
        mmsi = digitraffic_data.get("mmsi", "unknown")  # Extract MMSI
        
        # Check and handle IMO number 0 case - treat as not present for all XML types
        if imo_lloyds == "0" or imo_lloyds == 0 or imo_lloyds == "unknown":
            logger.info(f"IMO number is {imo_lloyds} for port call {port_call_id}. Setting to None for XML generation.")
            imo_lloyds = None
        
        # Log original values for debugging
        logger.info(f"Adapting data for port call {port_call_id} - Original vesselName: {vessel_name}, imoLloyds: {imo_lloyds}, mmsi: {mmsi}")

        # Arrival information
        eta = digitraffic_data.get("eta")
        ata = digitraffic_data.get("ata")
        etd = digitraffic_data.get("etd")

        # Log original eta value
        logger.info(f"Original ETA value: {eta}")
        logger.info(f"Original ETD value: {etd}")
        
        # Format ETA for XML usage if available
        formatted_eta = None
        if eta:
            try:
                # Handle different datetime formats
                if isinstance(eta, str):
                    # Try to standardize the format for ETA
                    if '+' in eta:
                        # Handle timezone offset format
                        dt_part = eta.split('+')[0]
                        if '.' in dt_part:
                            dt_obj = datetime.strptime(dt_part, "%Y-%m-%dT%H:%M:%S.%f")
                        else:
                            dt_obj = datetime.strptime(dt_part, "%Y-%m-%dT%H:%M:%S")
                        formatted_eta = dt_obj.strftime("%Y-%m-%dT%H:%M:%SZ")
                    elif 'Z' in eta:
                        # Already in UTC format but ensure no milliseconds
                        dt_part = eta.replace('Z', '')
                        if '.' in dt_part:
                            dt_obj = datetime.strptime(dt_part, "%Y-%m-%dT%H:%M:%S.%f")
                        else:
                            dt_obj = datetime.strptime(dt_part, "%Y-%m-%dT%H:%M:%S")
                        formatted_eta = dt_obj.strftime("%Y-%m-%dT%H:%M:%SZ")
                    else:
                        # No timezone, treat as UTC and add Z
                        if '.' in eta:
                            dt_obj = datetime.strptime(eta, "%Y-%m-%dT%H:%M:%S.%f")
                        else:
                            dt_obj = datetime.strptime(eta, "%Y-%m-%dT%H:%M:%S")
                        formatted_eta = dt_obj.strftime("%Y-%m-%dT%H:%M:%SZ")
                logger.info(f"Formatted ETA: {formatted_eta}")
            except Exception as e:
                logger.warning(f"Could not format ETA: {str(e)}, using original value")
                formatted_eta = eta
        
        # Format ETD for XML usage if available
        formatted_etd = None
        if etd:
            try:
                # Handle different datetime formats
                if isinstance(etd, str):
                    # Try to standardize the format for ETD
                    if '+' in etd:
                        # Handle timezone offset format
                        dt_part = etd.split('+')[0]
                        if '.' in dt_part:
                            dt_obj = datetime.strptime(dt_part, "%Y-%m-%dT%H:%M:%S.%f")
                        else:
                            dt_obj = datetime.strptime(dt_part, "%Y-%m-%dT%H:%M:%S")
                        formatted_etd = dt_obj.strftime("%Y-%m-%dT%H:%M:%SZ")
                    elif 'Z' in etd:
                        # Already in UTC format but ensure no milliseconds
                        dt_part = etd.replace('Z', '')
                        if '.' in dt_part:
                            dt_obj = datetime.strptime(dt_part, "%Y-%m-%dT%H:%M:%S.%f")
                        else:
                            dt_obj = datetime.strptime(dt_part, "%Y-%m-%dT%H:%M:%S")
                        formatted_etd = dt_obj.strftime("%Y-%m-%dT%H:%M:%SZ")
                    else:
                        # No timezone, treat as UTC and add Z
                        if '.' in etd:
                            dt_obj = datetime.strptime(etd, "%Y-%m-%dT%H:%M:%S.%f")
                        else:
                            dt_obj = datetime.strptime(etd, "%Y-%m-%dT%H:%M:%S")
                        formatted_etd = dt_obj.strftime("%Y-%m-%dT%H:%M:%SZ")
                logger.info(f"Formatted ETD: {formatted_etd}")
            except Exception as e:
                logger.warning(f"Could not format ETD: {str(e)}, using original value")
                formatted_etd = etd
        
        port_area_name = digitraffic_data.get("portAreaName", "")
        port_area_code = digitraffic_data.get("portAreaCode", "")
        berth_name = digitraffic_data.get("berthName", "")
        berth_code = digitraffic_data.get("berthCode", "")
        port_to_visit = digitraffic_data.get("portToVisit", "")
        
        # Passenger and crew information - ensure they're integers or None
        # We use None to indicate "not provided" rather than 0 (which means "zero passengers/crew")
        passengers_on_arrival = digitraffic_data.get("passengersOnArrival")
        crew_on_arrival = digitraffic_data.get("crewOnArrival")

        # Ensure we have valid integer values or None
        if passengers_on_arrival is not None:
            try:
                passengers_on_arrival = int(passengers_on_arrival)
            except (ValueError, TypeError):
                # If conversion fails, set to None to indicate missing data
                passengers_on_arrival = None
        
        if crew_on_arrival is not None:
            try:
                crew_on_arrival = int(crew_on_arrival)
            except (ValueError, TypeError):
                # If conversion fails, set to None to indicate missing data
                crew_on_arrival = None

        # Log passenger and crew counts for debugging
        logger.info(f"Adapting port call {port_call_id} with passengers: {passengers_on_arrival}, crew: {crew_on_arrival}")

        # Build destination string, excluding unknown or empty values
        destination_parts = [port_to_visit]
        if port_area_name.lower() not in ["unknown", "ei tiedossa", ""]:
            destination_parts.append(port_area_name)
        if berth_name.lower() not in ["unknown", "ei tiedossa", ""]:
            destination_parts.append(berth_name)
        destination = "/".join(destination_parts)

        # Agent information
        agent_name = digitraffic_data.get("agentName", "")
        shipping_company = digitraffic_data.get("shippingCompany", "")
        
        # Format remarks based on available IMO
        remarks_text = f"{vessel_name}"
        if imo_lloyds:
            remarks_text += f" (IMO: {imo_lloyds})"
        remarks_text += f" {'port arrival ->' if xml_type == 'ATA' else '->'} {destination}"

        # Create portman data structure with required fields for EMSWe conversion
        portman_data = {
            "document_id": f"MSGID-{port_call_id}",
            "declaration_id": f"DECL-PT-{port_call_id}",
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "call_id": str(port_call_id),
            "remarks": remarks_text,

            # Required fields for ArrivalTransportEvent
            "arrival_datetime": ata or formatted_eta or datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "location": port_to_visit,  # Use validated port code here

            # Required field for CallTransportEvent
            "call_datetime": ata or formatted_eta or datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "anchorage_indicator": "0",
            
            # Add original ETA and ETD for XML
            "eta": formatted_eta or eta,
            "etd": formatted_etd or etd,
            
            # Add standardized port and berth codes
            "portToVisit": port_to_visit,
            "portAreaCode": port_area_code,
            "portAreaName": port_area_name,
            "berthCode": berth_code,
            "berthName": berth_name,

            # Add vessel information directly - IMPORTANT for VID schema
            "vesselName": vessel_name,
            "mmsi": mmsi,
            
            # Pass radio call sign if available (for VID XML)
            "radioCallSign": digitraffic_data.get("radioCallSign", ""),
            
            # Required declarant information
            "declarant": {
                "id": f"FI{imo_lloyds}" if imo_lloyds else "FI123456789012",
                "name": agent_name or shipping_company or "Unknown Agent",
                "role_code": "AG",
                "contact": {
                    "name": agent_name or "Port Agent",
                    "phone": "+358-00-0000000",
                    "email": "contact@example.com"
                },
                "address": {
                    "postcode": "00000",
                    "street": "Port Street",
                    "city": "Port City",
                    "country": "FI",
                    "building": "1"
                }
            }
        }
        
        # Only add IMO if it's valid (not None)
        if imo_lloyds is not None:
            portman_data["imoLloyds"] = imo_lloyds
        
        # Add passenger and crew counts if available (only if they have actual values)
        if passengers_on_arrival is not None:
            portman_data["passengersOnArrival"] = passengers_on_arrival
            
        if crew_on_arrival is not None:
            portman_data["crewOnArrival"] = crew_on_arrival
                
        # Log the vessel info we're passing through
        logger.info(f"Adapted Portman data contains vesselName: {portman_data.get('vesselName')}, imoLloyds: {portman_data.get('imoLloyds')}, mmsi: {portman_data.get('mmsi')}, eta: {portman_data.get('eta')}")

        return portman_data

    except Exception as e:
        logger.error(f"Error adapting Digitraffic data: {str(e)}")
        # Return minimal valid structure
        return {
            "document_id": f"MSGID-{datetime.now().timestamp()}",
            "declaration_id": f"DECL-PT-{datetime.now().strftime('%y%m%d%H%M')}",
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "call_id": f"CALL-{datetime.now().strftime('%Y%m%d')}-001",
            "remarks": "Adapted from Digitraffic data",
            "arrival_datetime": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "location": "UNKNW",  # Ensure 5 characters
            "call_datetime": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "anchorage_indicator": "0",
            "eta": digitraffic_data.get("eta", datetime.now().strftime("%Y-%m-%dT%H:%M:%S.000Z")),
            "portToVisit": "PORTX",
            "portAreaCode": "",  # Allow empty value 
            "portAreaName": "Unknown Area",
            "berthCode": "",  # Allow empty value
            "berthName": "Unknown Berth",
            "vesselName": digitraffic_data.get("vesselName", "Unknown Vessel"),
            # Do not include default IMO value for fallback
            "mmsi": digitraffic_data.get("mmsi"),  # Include MMSI in fallback but no default
            "radioCallSign": digitraffic_data.get("radioCallSign", ""),  # Include radio call sign in fallback
            "declarant": {
                "id": "FI123456789012",
                "name": "Unknown Agent",
                "role_code": "AG",
                "contact": {
                    "name": "Port Agent",
                    "phone": "+358-00-0000000",
                    "email": "contact@example.com"
                },
                "address": {
                    "postcode": "00000",
                    "street": "Port Street",
                    "city": "Port City",
                    "country": "FI",
                    "building": "1"
                }
            }
        }
