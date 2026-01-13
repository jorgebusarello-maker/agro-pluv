
import React, { useState } from 'react';
import { Gauge } from '../types';
import { Plus, MapPin, Trash2, Crosshair } from 'lucide-react';

interface GaugeListProps {
  gauges: Gauge[];
  onAdd: (gauge: Omit<Gauge, 'id'>) => void;
}

const GaugeList: React.FC<GaugeListProps> = ({ gauges, onAdd }) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ name, lat: parseFloat(lat), lng: parseFloat(lng) });
    setName('');
    setLat('');
    setLng('');
    setShowForm(false);
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude.toFixed(6));
      setLng(pos.coords.longitude.toFixed(6));
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Seus Pluviômetros</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all font-medium"
        >
          <Plus size={18} />
          Novo Pluviômetro
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-md animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Identificação</label>
              <input 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Talhão 04 / Sede"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Latitude</label>
              <input 
                required
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Longitude</label>
              <div className="flex gap-2">
                <input 
                  required
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button 
                  type="button"
                  onClick={getCurrentLocation}
                  className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"
                  title="Pegar localização atual"
                >
                  <Crosshair size={20} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm"
            >
              Salvar Pluviômetro
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gauges.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <MapPin size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Nenhum pluviômetro cadastrado.</p>
          </div>
        ) : (
          gauges.map(gauge => (
            <div key={gauge.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <MapPin size={24} />
                </div>
                <button className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-1">{gauge.name}</h4>
              <p className="text-sm text-slate-400 font-mono mb-4">
                {gauge.lat.toFixed(4)}, {gauge.lng.toFixed(4)}
              </p>
              <div className="pt-4 border-t border-slate-50">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Coordenadas GPS</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GaugeList;
