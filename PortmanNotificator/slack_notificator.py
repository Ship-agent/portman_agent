import logging
import os
import json
import requests
import azure.functions as func
from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas
from datetime import datetime, timedelta, UTC
import xml.etree.ElementTree as ET
import time
import random
import threading
from collections import deque

# Global rate limiting mechanism
class SlackRateLimiter:
    def __init__(self, max_calls_per_minute=50):
        self.max_calls_per_minute = max_calls_per_minute
        self.lock = threading.Lock()
        self.call_timestamps = deque()
        self.retry_after = 0
        self.last_rate_limit_time = 0

    def wait_if_needed(self):
        """Wait if we've hit our rate limit or if Slack told us to wait"""
        current_time = time.time()
        
        # First check if Slack told us to wait
        if current_time < self.last_rate_limit_time + self.retry_after:
            wait_time = (self.last_rate_limit_time + self.retry_after) - current_time
            logging.info(f"Waiting {wait_time:.2f}s due to previous rate limit from Slack")
            time.sleep(wait_time)
        
        with self.lock:
            # Remove timestamps older than 1 minute
            current_time = time.time()
            while self.call_timestamps and self.call_timestamps[0] < current_time - 60:
                self.call_timestamps.popleft()
            
            # If we've reached our limit, wait until we can make another call
            if len(self.call_timestamps) >= self.max_calls_per_minute:
                # Calculate how long to wait
                oldest_timestamp = self.call_timestamps[0]
                wait_time = oldest_timestamp + 60 - current_time
                if wait_time > 0:
                    logging.info(f"Rate limiting ourselves: waiting {wait_time:.2f}s before sending to Slack")
                    time.sleep(wait_time)
                    # Recalculate current time after waiting
                    current_time = time.time()
            
            # Record this call
            self.call_timestamps.append(current_time)
    
    def update_retry_after(self, retry_seconds):
        """Update the retry_after value based on Slack's response"""
        with self.lock:
            self.retry_after = max(self.retry_after, retry_seconds)
            self.last_rate_limit_time = time.time()

# Create the rate limiter instance (one per function app instance)
# Slack's rate limit is typically around 1 message per second,
# so setting our limit to a bit below that to be safe
slack_rate_limiter = SlackRateLimiter(max_calls_per_minute=60)

# Import the shared blob utility function
try:
    from PortmanTrigger.blob_utils import generate_blob_storage_link
except ImportError:
    try:
        # Try alternative import path
        from blob_utils import generate_blob_storage_link
    except ImportError:
        # If import fails, keep the local implementation
        def generate_blob_storage_link(blob_name, connection_string=None):
            """Generate a URL with SAS token to access the blob directly."""
            try:
                # Get storage account connection string if not provided
                if not connection_string:
                    connection_string = os.environ.get("AzureWebJobsStorage")
                
                if not connection_string:
                    logging.warning("AzureWebJobsStorage not set, cannot generate direct link")
                    return ""

                container_name = blob_name.split('/')[0]
                blob_path = '/'.join(blob_name.split('/')[1:])

                # Create the BlobServiceClient
                blob_service_client = BlobServiceClient.from_connection_string(connection_string)

                # Get account name from connection string
                account_name = blob_service_client.account_name

                # Get account key (needed for SAS token generation)
                account_key = connection_string.split('AccountKey=')[1].split(';')[0]

                # Generate SAS token with read permission that expires in 7 days
                sas_token = generate_blob_sas(
                    account_name=account_name,
                    container_name=container_name,
                    blob_name=blob_path,
                    account_key=account_key,
                    permission=BlobSasPermissions(read=True),
                    expiry=datetime.now(UTC) + timedelta(days=7),
                    content_type="application/xml",
                    content_disposition=f"attachment; filename={os.path.basename(blob_path)}"
                )

                # Create the URL with SAS token
                blob_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_path}?{sas_token}"

                return blob_url
            except Exception as e:
                logging.error(f"Error generating blob storage link: {e}")
                return ""

def blob_trigger(blob: func.InputStream):
    logging.info(f"Python blob trigger function processed blob: {blob.name}")

    # Check if blob name matches expected format (starts with ATA_, NOA_, or VID_)
    blob_basename = os.path.basename(blob.name)
    if not (blob_basename.startswith("ATA_") or blob_basename.startswith("NOA_") or blob_basename.startswith("VID_")):
        logging.info(f"Blob {blob.name} does not match expected naming pattern (ATA_*, NOA_*, or VID_*). Skipping notification.")
        return

    # Check if notifications are enabled
    if os.environ.get("SLACK_WEBHOOK_ENABLED", "false").lower() == "false":
        logging.info("Slack webhook is disabled, skipping notification")
        return
    
    webhook_url = os.environ["SLACK_WEBHOOK_URL"]
    channel = os.environ.get("SLACK_CHANNEL")
    username = "Portman Bot"
    try:
        # Read the blob content
        blob_content = blob.read().decode('utf-8')

        # Determine XML type based on blob name
        if blob_basename.startswith("NOA_"):
            xml_type = "NOA"
        elif blob_basename.startswith("VID_"):
            xml_type = "VID"
        else:
            xml_type = "ATA"
        
        # Parse the XML to extract information
        port_call_id, time_value, remarks, _, passengers_count, crew_count = extract_info_from_xml(blob_content, xml_type)

        # Generate a URL with SAS token to access the blob directly
        blob_url = generate_blob_storage_link(blob.name)

        # Send notification to Slack with XML content
        send_slack_notification(webhook_url, blob.name, port_call_id, time_value, remarks, blob_content, channel, username, blob_url, passengers_count, crew_count)

        logging.info(f"Successfully processed and notified about {xml_type} for {port_call_id}")

    except Exception as e:
        logging.error(f"Error processing blob {blob.name}: {str(e)}")
        # Send error notification to Slack
        send_slack_error(webhook_url, blob.name, str(e), channel, username)

def extract_info_from_xml(xml_content, xml_type="ATA"):
    """Extract information from the XML based on type (ATA, NOA, or VID)."""
    try:
        # Register namespaces - include ATA, NOA, and VID namespaces
        namespaces = {
            'mai': 'urn:un:unece:uncefact:data:standard:MAI:MMTPlus',
            'ata': 'urn:un:unece:uncefact:data:standard:ATA:MMTPlus',
            'noa': 'urn:un:unece:uncefact:data:standard:NOA:MMTPlus',
            'vid': 'urn:un:unece:uncefact:data:standard:VID:MMTPlus',
            'ram': 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:30',
            'qdt': 'urn:un:unece:uncefact:data:Standard:QualifiedDataType:30'
        }
        
        root = ET.fromstring(xml_content)
        
        # Extract port call ID from MAI part - common for both ATA and NOA, not in VID
        port_call_id = "N/A"
        if xml_type != "VID":
            port_call_id_element = root.find('.//mai:SpecifiedLogisticsTransportMovement/ram:CallTransportEvent/ram:ID', namespaces)
            port_call_id = port_call_id_element.text if port_call_id_element is not None else "Unknown"
        
        # Initialize passenger and crew counts
        passengers_count = "N/A"
        crew_count = "N/A"
        
        # Extract time, remarks, and counts based on XML type
        if xml_type == "ATA":
            # For ATA XML, extract ATA (actual time of arrival)
            ata_element = root.find('.//ata:SpecifiedLogisticsTransportMovement' +
                                    '/ram:CallTransportEvent' +
                                    '/ram:ActualArrivalRelatedDateTime' +
                                    '/qdt:DateTimeString', namespaces)
            time_value = ata_element.text if ata_element is not None else "Unknown"
            
            # Extract remarks from the ATA part
            remarks_element = root.find('.//ata:ExchangedDocument/ram:Remarks', namespaces)
            remarks = remarks_element.text if remarks_element is not None else "Unknown"
            
        elif xml_type == "NOA":
            # For NOA XML, extract ETA (estimated time of arrival)
            eta_element = root.find('.//noa:SpecifiedLogisticsTransportMovement' +
                                    '/ram:CallTransportEvent' +
                                    '/ram:EstimatedTransportMeansArrivalOccurrenceDateTime' +
                                    '/qdt:DateTimeString', namespaces)
            time_value = eta_element.text if eta_element is not None else "Unknown"
            
            # Extract remarks from the NOA part
            remarks_element = root.find('.//noa:ExchangedDocument/ram:Remarks', namespaces)
            remarks = remarks_element.text if remarks_element is not None else "Unknown"
            
            # Extract passenger and crew counts for NOA XML
            try:
                # Look for passenger count
                passenger_element = root.find('.//noa:SpecifiedLogisticsTransportMovement/ram:PassengerQuantity', namespaces)
                if passenger_element is not None:
                    passengers_count = passenger_element.text
                
                # Look for crew count
                crew_element = root.find('.//noa:SpecifiedLogisticsTransportMovement/ram:CrewQuantity', namespaces)
                if crew_element is not None:
                    crew_count = crew_element.text
                
                # Look for total person count as a fallback
                if passengers_count == "N/A" and crew_count == "N/A":
                    total_element = root.find('.//noa:SpecifiedLogisticsTransportMovement/ram:TotalOnboardPersonQuantity', namespaces)
                    if total_element is not None:
                        total_count = total_element.text
                        logging.info(f"Only total person count found in NOA XML: {total_count}")
            except Exception as e:
                logging.warning(f"Error extracting passenger/crew counts from NOA XML: {str(e)}")
        
        else:  # VID type
            # For VID XML, extract vessel name and IMO/MMSI
            vessel_name_element = root.find('.//vid:SpecifiedLogisticsTransportMovement/ram:UsedLogisticsTransportMeans/ram:Name', namespaces)
            vessel_name = vessel_name_element.text if vessel_name_element is not None else "Unknown Vessel"
            
            imo_element = root.find('.//vid:SpecifiedLogisticsTransportMovement/ram:UsedLogisticsTransportMeans/ram:IMOID', namespaces)
            imo = imo_element.text if imo_element is not None else "N/A"
            
            mmsi_element = root.find('.//vid:SpecifiedLogisticsTransportMovement/ram:UsedLogisticsTransportMeans/ram:MMSIID', namespaces)
            mmsi = mmsi_element.text if mmsi_element is not None else "N/A"
            
            # Extract ETA
            eta_element = root.find('.//vid:SpecifiedLogisticsTransportMovement/ram:CallTransportEvent/ram:EstimatedTransportMeansArrivalOccurrenceDateTime/qdt:DateTimeString', namespaces)
            time_value = eta_element.text if eta_element is not None else "Unknown"
            
            # Extract port location
            port_element = root.find('.//vid:SpecifiedLogisticsTransportMovement/ram:CallTransportEvent/ram:OccurrenceLogisticsLocation/ram:ID', namespaces)
            port = port_element.text if port_element is not None else "Unknown"
            
            # Look for document ID from MAI part for VID
            doc_id_element = root.find('.//mai:ExchangedDocument/ram:ID', namespaces)
            doc_id = doc_id_element.text if doc_id_element is not None else "Unknown"
            
            # For VID, port_call_id will be used to store the ID for display
            port_call_id = doc_id
            
            # Create a custom remarks string for VID with vessel info
            remarks = f"Vessel: {vessel_name}\nIMO: {imo}\nMMSI: {mmsi}\nDestination: {port}"
        
        return port_call_id, time_value, remarks, xml_type, passengers_count, crew_count
    
    except Exception as e:
        logging.error(f"Error parsing {xml_type} XML: {str(e)}")
        return "Unknown", "Unknown", "Unknown", xml_type, "Unknown", "Unknown"

def send_slack_notification(webhook_url, blob_name, port_call_id, time_value, remarks, xml_content, channel, username, blob_url, passengers_count="N/A", crew_count="N/A"):
    """Send a notification to Slack about the new arrival, notification of arrival, or request for visit ID XML."""
    # Determine the XML type
    if "NOA_" in blob_name:
        xml_type = "NOA"
        emoji = "📢"
        title = "Notice of pre arrival"
        time_label = "ETA"
    elif "VID_" in blob_name:
        xml_type = "VID"
        emoji = "🆔"
        title = "Request for Visit ID received"
        time_label = "ETA"
    else:
        xml_type = "ATA"
        emoji = "🚢"
        title = "New port arrival detected"
        time_label = "ATA"
    
    logging.info(f"Preparing Slack notification for {blob_name} with port_call_id {port_call_id} and {time_label} {time_value}")

    # Create the message text based on XML type
    if xml_type == "VID":
        # For VID, the remarks already contain formatted vessel info and we don't include Document ID
        message_text = f"*{time_label}:* {time_value}\n\n{remarks}"
    else:
        message_text = f"*Visit ID:* {port_call_id}\n*{time_label}:* {time_value}\n\n{remarks}"
    
    # Add passenger and crew counts for NOA messages
    if xml_type == "NOA":
        # Add passenger count if available
        if passengers_count != "N/A":
            message_text += f"\n\n*Passengers:* {passengers_count}"
        
        # Add crew count if available
        if crew_count != "N/A":
            message_text += f"\n*Crew:* {crew_count}"
        
        # If we have both counts, show the total
        if passengers_count != "N/A" and crew_count != "N/A":
            try:
                total = int(passengers_count) + int(crew_count)
                message_text += f"\n*Total persons:* {total}"
            except ValueError:
                # Skip adding total if conversion fails
                pass

    # Create a message for Slack with XML content
    message = {
        "channel": channel,
        "username": username,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"{emoji} *{title}* {emoji}"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": message_text
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"File: `{blob_name}`" + (f" | <{blob_url}| Download>" if blob_url else "")
                    }
                ]
            }
        ]
    }

    # Only add channel if it was provided
    if channel:
        message["channel"] = channel
    
    # Use the rate limiter to control our sending rate
    slack_rate_limiter.wait_if_needed()
    
    # Send the message to Slack
    response = requests.post(
        webhook_url,
        data=json.dumps(message),
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        logging.info(f"Successfully sent Slack notification for {blob_name}")
    elif response.status_code == 429:
        # Extract retry_after if available in response
        retry_after = 1  # Default to 1 second
        try:
            response_data = response.json()
            if "retry_after" in response_data:
                retry_after = float(response_data["retry_after"])
                # Update the global rate limiter with this information
                slack_rate_limiter.update_retry_after(retry_after)
        except (ValueError, KeyError, json.JSONDecodeError):
            pass
        
        logging.error(f"Rate limited by Slack: {response.status_code}, {response.text}")
    else:
        logging.error(f"Error sending to Slack: {response.status_code}, {response.text}")

def format_xml_for_display(xml_content, max_length=2500):
    """Format XML content for better display in Slack message and limit to max_length."""
    try:
        # Try to pretty-print the XML
        from xml.dom import minidom
        parsed_xml = minidom.parseString(xml_content)
        pretty_xml = parsed_xml.toprettyxml(indent="  ")
        
        # Remove empty lines that minidom sometimes adds
        pretty_xml = "\n".join([line for line in pretty_xml.split("\n") if line.strip()])
        
        # If XML is too long, truncate it
        if len(pretty_xml) > max_length:
            return pretty_xml[:max_length] + "\n... (truncated)"
        return pretty_xml
    except Exception as e:
        logging.warning(f"Couldn't pretty-print XML: {e}")
        # If pretty printing fails, just truncate the raw XML
        if len(xml_content) > max_length:
            return xml_content[:max_length] + "\n... (truncated)"
        return xml_content

def send_slack_error(webhook_url, blob_name, error_message, channel, username):
    """Send an error notification to Slack."""

    # Generate a blob link even for errors
    blob_url = generate_blob_storage_link(blob_name)

    message = {
        "username": username,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"⚠️ *Error processing arrival XML file: `{blob_name}`*\n" + (f" | <{blob_url}| Download>" if blob_url else "") + "\n\nError message:\n```{error_message}```"
                }
            }
        ]
    }

    # Only add channel if it was provided
    if channel:
        message["channel"] = channel
    
    # Use the rate limiter to control our sending rate
    slack_rate_limiter.wait_if_needed()
    
    # Send the error message to Slack
    response = requests.post(
        webhook_url,
        data=json.dumps(message),
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        logging.info(f"Successfully sent Slack error notification for {blob_name}")
    elif response.status_code == 429:
        # Extract retry_after if available in response
        retry_after = 1  # Default to 1 second
        try:
            response_data = response.json()
            if "retry_after" in response_data:
                retry_after = float(response_data["retry_after"])
                # Update the global rate limiter with this information
                slack_rate_limiter.update_retry_after(retry_after)
        except (ValueError, KeyError, json.JSONDecodeError):
            pass
        
        logging.error(f"Rate limited by Slack for error notification: {response.status_code}, {response.text}")
    else:
        logging.error(f"Error sending error notification to Slack: {response.status_code}, {response.text}")