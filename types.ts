
export interface Gauge {
  id: string;
  name: string;
  lat: number;
  lng: number;
  areaId?: string;
}

export interface Measurement {
  id: string;
  gaugeId: string;
  date: string;
  amount: number; // in mm
  notes?: string; // Campo para anotações
}

export interface AppState {
  gauges: Gauge[];
  measurements: Measurement[];
  selectedSeasonStart: string;
  selectedSeasonEnd: string;
}
