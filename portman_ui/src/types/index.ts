export interface Vessel {
  imoLloyds: number;
  vesselName: string;
  vesselTypeCode: string;
  mmsi?: string;
}

export interface Port {
  locode: string;
  name: string;
  country?: string;
}

export interface Berth {
  berthCode: string;
  berthName: string;
  portAreaCode: string;
  portAreaName: string;
}

export interface PortCall {
  // Basic information
  portcallid: number;
  imolloyds: number;
  vesselname: string;
  vesseltypecode: string;
  
  // Port information
  porttovisit: string;
  portareacode: string;
  portareaname: string;
  berthcode: string;
  berthname: string;
  prevport: string;
  nextport: string;
  
  // Timestamps
  eta: string;
  etd: string;
  ata?: string;
  atd?: string;
  
  // Passenger and crew counts
  passengersonarrival?: number;
  passengersondeparture?: number;
  crewonarrival?: number;
  crewondeparture?: number;
  
  // Company information
  agentname?: string;
  shippingcompany?: string;
  
  // XML data
  noa_xml_url?: string;
  ata_xml_url?: string;
  
  // Metadata
  created: string;
  modified: string;
}

export interface ArrivalUpdate {
  id: number;
  portCallId: number;
  eta: string;
  oldEta: string;
  ata: string;
  vesselName: string;
  portAreaName: string;
  berthName: string;
  created: string;
}

export interface Arrival {
  id: number;
  portcallid: number;
  eta: string;
  old_ata: string | null;
  ata: string;
  vesselname: string;
  portareaname: string;
  berthname: string;
  created: string;
  ata_xml_url?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
}

export interface AppSettings {
  trackedVessels: number[]; // IMO numbers
  refreshInterval: number; // in seconds
  defaultView: 'map' | 'list' | 'timeline';
}

// Types for Digitraffic AIS API
export interface AISFeature {
  mmsi: number;
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    mmsi: number;
    sog: number;
    cog: number;
    navStat: number;
    rot: number;
    posAcc: boolean;
    raim: boolean;
    heading: number;
    timestamp: number;
    timestampExternal: number;
  };
}

export interface AISResponse {
  type: string;
  dataUpdatedTime: string;
  features: AISFeature[];
}
