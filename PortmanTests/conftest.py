# test that conf is loading

import pytest
import pg8000
import os
from datetime import datetime, timedelta, UTC

@pytest.fixture(scope="session")
def test_db_connection():
    """Create test database connection."""
    conn = pg8000.connect(
        user="postgres",
        password="postgres",
        host="localhost",
        port=5432,
        database="portman"
    )
    yield conn
    conn.close()

@pytest.fixture(scope="function")
def test_db_cursor(test_db_connection):
    """Create test database cursor."""
    cursor = test_db_connection.cursor()
    yield cursor
    cursor.close()

@pytest.fixture(scope="function")
def setup_test_tables(test_db_cursor):
    """Create test tables."""
    # Create voyages table
    test_db_cursor.execute("""
        CREATE TABLE IF NOT EXISTS voyages (
            portCallId INTEGER PRIMARY KEY,
            imoLloyds INTEGER,
            mmsi INTEGER,
            vesselTypeCode TEXT,
            vesselName TEXT,
            prevPort TEXT,
            portToVisit TEXT,
            nextPort TEXT,
            agentName TEXT,
            shippingCompany TEXT,
            eta TIMESTAMP NULL,
            ata TIMESTAMP NULL,
            portAreaCode TEXT,
            portAreaName TEXT,
            berthCode TEXT,
            berthName TEXT,
            etd TIMESTAMP NULL,
            atd TIMESTAMP NULL,
            passengersOnArrival INTEGER DEFAULT 0,
            passengersOnDeparture INTEGER DEFAULT 0,
            crewOnArrival INTEGER DEFAULT 0,
            crewOnDeparture INTEGER DEFAULT 0,
            noa_xml_url TEXT,
            ata_xml_url TEXT,
            vid_xml_url TEXT,
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create arrivals table
    test_db_cursor.execute("""
        CREATE TABLE IF NOT EXISTS arrivals (
            id SERIAL PRIMARY KEY,
            portCallId INTEGER,
            eta TIMESTAMP NULL,
            old_ata TIMESTAMP NULL,
            ata TIMESTAMP NOT NULL,
            vesselName TEXT,
            portAreaName TEXT,
            berthName TEXT,
            ata_xml_url TEXT,
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    yield

    # Clean up tables after tests
    test_db_cursor.execute("DROP TABLE IF EXISTS voyages")
    test_db_cursor.execute("DROP TABLE IF EXISTS arrivals")

@pytest.fixture
def sample_port_call_data():
    """Sample port call data for testing."""
    now = datetime.now(UTC)
    return {
        "portCallId": 3190880,
        "imoLloyds": 9606900,
        "mmsi": 257800000,
        "vesselTypeCode": "20",
        "vesselName": "Viking Grace",
        "prevPort": "FIMHQ",
        "portToVisit": "FITKU",
        "nextPort": "FILAN",
        "agentInfo": [
            {"role": 1, "name": "Viking Line Abp / Helsinki"},
            {"role": 2, "name": "Viking Line Abp"}
        ],
        "imoInformation": [
            {
                "imoGeneralDeclaration": "Arrival",
                "numberOfPassangers": 235,
                "numberOfCrew": 1849
            },
            {
                "imoGeneralDeclaration": "Departure",
                "numberOfPassangers": 188,
                "numberOfCrew": 1346
            }
        ],
        "portAreaDetails": [{
            "eta": (now + timedelta(hours=-1)).strftime("%Y-%m-%dT%H:%M:%S.%f+00:00"),
            "ata": (now).strftime("%Y-%m-%dT%H:%M:%S.%f+00:00"),
            "portAreaCode": "PASSE",
            "portAreaName": "Matkustajasatama",
            "berthCode": "v1",
            "berthName": "viking1",
            "etd": (now + timedelta(hours=48)).strftime("%Y-%m-%dT%H:%M:%S.%f+00:00"),
            "atd": None
        }]
    } 