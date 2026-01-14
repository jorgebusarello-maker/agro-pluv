
import React, { useState, useEffect } from 'react';
import { 
  CloudRain, 
  Map as MapIcon, 
  Plus, 
  History, 
  LayoutDashboard, 
  Thermometer, 
  Waves,
  Download,
  CloudSun,
  Loader2
} from 'lucide-react';
import { Gauge, Measurement, AppState } from './types';
import Dashboard from './components/Dashboard';
import GaugeList from './components/GaugeList';
import MeasurementLog from './components/MeasurementLog';
import RainMap from './components/RainMap';
import WeatherForecast from './components/WeatherForecast';
import { generateKML } from './utils/kmlGenerator';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gauges' | 'history' | 'map' | 'weather'>('dashboard');
  const [localTemp, setLocalTemp] = useState<number | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('agrorain_state');
    return saved ? JSON.parse(saved) : {
      gauges: [],
      measurements: [],
      selectedSeasonStart: '2023-10-01',
      selectedSeasonEnd: '2024-05-31'
    };
  });

  useEffect(() => {
    localStorage.setItem('agrorain_state', JSON.stringify(state));
  }, [state]);

  // Efeito para buscar temperatura real
  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      setWeatherLoading(true);
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await response.json();
        setLocalTemp(data.current_weather.temperature);
      } catch (error) {
        console.error("Erro ao buscar clima:", error);
      } finally {
        setWeatherLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
        () => {
          console.warn("Geolocalização negada. Usando Brasília como padrão.");
          fetchWeather(-15.78, -47.92);
        }
      );
    }
  }, []);

  const addGauge = (newGauge: Omit<Gauge, 'id'>) => {
    const gauge: Gauge = { ...newGauge, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, gauges: [...prev.gauges, gauge] }));
  };

  const deleteGauge = (id: string) => {
    // Exclui diretamente, o componente GaugeList já lida com a confirmação visual
    setState(prev => ({
      ...prev,
      gauges: prev.gauges.filter(g => g.id !== id)
    }));
  };

  const addMeasurement = (m: Omit<Measurement, 'id'>) => {
    const measurement: Measurement = { ...m, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, measurements: [...prev.measurements, measurement] }));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-emerald-600 rounded-lg text-white">
            <CloudRain size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">AgroRain</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Waves size={20} />} label="Pluviômetros" active={activeTab === 'gauges'} onClick={() => setActiveTab('gauges')} />
          <NavItem icon={<History size={20} />} label="Lançamentos" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <NavItem icon={<MapIcon size={20} />} label="Mapa de Chuva" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
          <NavItem icon={<CloudSun size={20} />} label="Clima Real" active={activeTab === 'weather'} onClick={() => setActiveTab('weather')} />
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <button 
            onClick={() => generateKML(state.gauges, state.measurements)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-all shadow-sm"
          >
            <Download size={18} />
            Exportar KML
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 capitalize">
              {activeTab === 'weather' ? 'Clima em Tempo Real' : activeTab.replace('gauges', 'Pluviômetros').replace('history', 'Lançamentos').replace('map', 'Mapa de Chuva')}
            </h2>
            <p className="text-sm text-slate-500">
              {activeTab === 'weather' ? 'Satélite e Radar Meteorológico' : 'Monitoramento em tempo real'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100 min-w-[80px] justify-center">
              {weatherLoading ? (
                <Loader2 size={16} className="animate-spin text-amber-500" />
              ) : (
                <>
                  <Thermometer size={16} />
                  <span className="text-sm font-semibold">{localTemp !== null ? `${localTemp.toFixed(1)}°C` : '--°C'}</span>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard state={state} />}
          {activeTab === 'gauges' && <GaugeList gauges={state.gauges} onAdd={addGauge} onDelete={deleteGauge} />}
          {activeTab === 'history' && <MeasurementLog state={state} onAdd={addMeasurement} />}
          {activeTab === 'map' && <RainMap gauges={state.gauges} measurements={state.measurements} />}
          {activeTab === 'weather' && <WeatherForecast gauges={state.gauges} />}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
        <MobileNavItem icon={<LayoutDashboard size={24} />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <MobileNavItem icon={<Waves size={24} />} active={activeTab === 'gauges'} onClick={() => setActiveTab('gauges')} />
        <MobileNavItem icon={<CloudSun size={24} />} active={activeTab === 'weather'} onClick={() => setActiveTab('weather')} />
        <MobileNavItem icon={<MapIcon size={24} />} active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
      </nav>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      active 
      ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    {icon}
    {label}
  </button>
);

const MobileNavItem: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void }> = ({ icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-2 rounded-xl transition-all ${
      active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'
    }`}
  >
    {icon}
  </button>
);

export default App;
