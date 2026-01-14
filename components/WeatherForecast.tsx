
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Gauge } from '../types';
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  Layers, 
  Play, 
  Pause, 
  ChevronRight, 
  Navigation,
  CloudLightning,
  Droplets,
  Sun
} from 'lucide-react';

interface WeatherForecastProps {
  gauges: Gauge[];
}

interface ForecastData {
  temp: number;
  humidity: number;
  windSpeed: number;
  rainProb: number;
  condition: string;
}

const WeatherForecast: React.FC<WeatherForecastProps> = ({ gauges }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [activeLayer, setActiveLayer] = useState<'radar' | 'temp' | 'wind'>('radar');
  const [baseMap, setBaseMap] = useState<'dark' | 'satellite' | 'terrain'>('satellite');
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Radar Animation States
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const radarLayersRef = useRef<{ [key: number]: L.TileLayer }>({});
  const animationIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([-15.7801, -47.9292], 4);
      
      L.control.zoom({ position: 'bottomleft' }).addTo(mapInstance.current);

      if (gauges.length > 0) {
        const bounds = L.latLngBounds(gauges.map(g => [g.lat, g.lng]));
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    updateBaseMap();
    fetchRadarTimestamps();
    fetchLocalForecast();

    // Adiciona marcadores dos pluviômetros
    gauges.forEach(gauge => {
      L.marker([gauge.lat, gauge.lng], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-lg pulse-animation"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(mapInstance.current!).bindPopup(`<b>${gauge.name}</b>`);
    });

    return () => {
      if (animationIntervalRef.current) window.clearInterval(animationIntervalRef.current);
    };
  }, [gauges]);

  const updateBaseMap = () => {
    if (!mapInstance.current) return;
    
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer && !(layer as any).isWeatherLayer) {
        mapInstance.current?.removeLayer(layer);
      }
    });

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    if (baseMap === 'satellite') url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    if (baseMap === 'terrain') url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';

    L.tileLayer(url, { maxZoom: 19 }).addTo(mapInstance.current);
  };

  const fetchRadarTimestamps = async () => {
    try {
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await response.json();
      const pastMaps = data.radar.past.map((m: any) => m.time);
      setTimestamps(pastMaps);
      setCurrentIndex(pastMaps.length - 1);
    } catch (e) {
      console.error("Erro ao buscar timestamps do radar", e);
    }
  };

  const fetchLocalForecast = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&hourly=precipitation_probability`);
        const data = await res.json();
        setForecast({
          temp: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          rainProb: data.hourly.precipitation_probability[0],
          condition: data.current.precipitation > 0 ? 'Chuva' : 'Céu Limpo'
        });
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    });
  };

  // Radar Animation Loop
  useEffect(() => {
    if (timestamps.length === 0 || !mapInstance.current || activeLayer !== 'radar') return;

    // Clear old radar layers
    Object.values(radarLayersRef.current).forEach(layer => mapInstance.current?.removeLayer(layer));
    radarLayersRef.current = {};

    // Pre-load current frame
    const time = timestamps[currentIndex];
    const layer = L.tileLayer(`https://tilecache.rainviewer.com/v2/radar/${time}/256/{z}/{x}/{y}/2/1_1.png`, {
      opacity: 0.7,
      zIndex: 200
    });
    (layer as any).isWeatherLayer = true;
    layer.addTo(mapInstance.current);
    radarLayersRef.current[time] = layer;

    if (isPlaying) {
      animationIntervalRef.current = window.setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % timestamps.length);
      }, 800);
    } else {
      if (animationIntervalRef.current) window.clearInterval(animationIntervalRef.current);
    }

    return () => {
      if (animationIntervalRef.current) window.clearInterval(animationIntervalRef.current);
    };
  }, [currentIndex, isPlaying, timestamps, activeLayer]);

  useEffect(() => {
    updateBaseMap();
  }, [baseMap]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="px-3 py-2 border-r border-slate-100 flex items-center gap-2 shrink-0">
            <Layers size={18} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Monitoramento</span>
          </div>
          <div className="flex p-1 gap-1">
            {[
              { id: 'radar', icon: <CloudRain size={16} />, label: 'Radar Ao Vivo' },
              { id: 'temp', icon: <Thermometer size={16} />, label: 'Temperatura' },
              { id: 'wind', icon: <Wind size={16} />, label: 'Ventos' }
            ].map(btn => (
              <button 
                key={btn.id}
                onClick={() => setActiveLayer(btn.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeLayer === btn.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1">
          <button onClick={() => setBaseMap('satellite')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${baseMap === 'satellite' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Satélite</button>
          <button onClick={() => setBaseMap('terrain')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${baseMap === 'terrain' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Terreno</button>
          <button onClick={() => setBaseMap('dark')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${baseMap === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Contraste</button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative aspect-[21/9] min-h-[400px] w-full bg-slate-900 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden group">
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Radar Player Controls */}
        {activeLayer === 'radar' && timestamps.length > 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-2xl hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Há 2 horas</span>
                <span className="text-blue-600">Agora</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden relative">
                <div 
                  className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-300" 
                  style={{ width: `${(currentIndex / (timestamps.length - 1)) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs font-black text-slate-800 tabular-nums">
                {new Date(timestamps[currentIndex] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[10px] font-bold text-blue-500">RADAR</div>
            </div>
          </div>
        )}

        {/* Floating Legends */}
        <div className="absolute top-6 right-6 z-[1000] space-y-3 pointer-events-none">
          <div className="bg-white/90 backdrop-blur px-4 py-3 rounded-2xl shadow-xl border border-white/50 w-40">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Legenda Chuva</h4>
            <div className="space-y-1.5">
              {[
                { c: 'bg-blue-400', l: 'Leve' },
                { c: 'bg-yellow-400', l: 'Moderada' },
                { c: 'bg-red-500', l: 'Forte/Granizo' }
              ].map(item => (
                <div key={item.l} className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                  <div className={`w-2.5 h-2.5 ${item.c} rounded-full`}></div> {item.l}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-6 left-6 z-[1000]">
          <div className="bg-slate-900/90 backdrop-blur text-white px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-2xl">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Radar 10min</span>
          </div>
        </div>
      </div>

      {/* Local Forecast Card - Precise Data */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
          {isLoading ? (
            <div className="w-full h-24 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : forecast ? (
            <>
              <div className="flex items-center gap-6">
                <div className="p-6 bg-blue-50 rounded-[2rem] text-blue-600">
                  {forecast.rainProb > 50 ? <CloudLightning size={48} /> : <Sun size={48} className="text-amber-500" />}
                </div>
                <div>
                  <h3 className="text-4xl font-black text-slate-900">{forecast.temp.toFixed(1)}°C</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{forecast.condition}</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-3 gap-4 w-full">
                <div className="text-center p-4 rounded-3xl bg-slate-50">
                  <Droplets size={20} className="mx-auto mb-2 text-blue-500" />
                  <div className="text-lg font-black text-slate-800">{forecast.humidity}%</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Umidade</div>
                </div>
                <div className="text-center p-4 rounded-3xl bg-slate-50">
                  <Wind size={20} className="mx-auto mb-2 text-emerald-500" />
                  <div className="text-lg font-black text-slate-800">{forecast.windSpeed} <span className="text-xs">km/h</span></div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Vento</div>
                </div>
                <div className="text-center p-4 rounded-3xl bg-slate-50">
                  <CloudRain size={20} className="mx-auto mb-2 text-indigo-500" />
                  <div className="text-lg font-black text-slate-800">{forecast.rainProb}%</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Prob. Chuva</div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="bg-emerald-600 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <Navigation size={24} className="animate-bounce" />
            <span className="text-xs font-black uppercase tracking-widest">Sua Localização</span>
          </div>
          <p className="text-sm font-medium leading-relaxed opacity-90">
            A precisão dos dados é baseada na geolocalização do seu dispositivo em tempo real.
          </p>
        </div>
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .pulse-animation {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .custom-div-icon { background: transparent; border: none; }
      `}</style>
    </div>
  );
};

export default WeatherForecast;
