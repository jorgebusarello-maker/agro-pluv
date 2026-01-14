
import React, { useState } from 'react';
import { Gauge } from '../types';
import { Plus, MapPin, Trash2, Crosshair, AlertCircle } from 'lucide-react';

interface GaugeListProps {
  gauges: Gauge[];
  onAdd: (gauge: Omit<Gauge, 'id'>) => void;
  onDelete: (id: string) => void;
}

const GaugeList: React.FC<GaugeListProps> = ({ gauges, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gauges.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <MapPin size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Nenhum pluviômetro cadastrado.</p>
          </div>
        ) : (
          gauges.map(gauge => (
            <div key={gauge.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all relative">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <MapPin size={24} />
                </div>
                
                {deletingId === gauge.id ? (
                  <div className="flex gap-2 animate-in fade-in zoom-in duration-200">
                    <button 
                      onClick={() => {
                        onDelete(gauge.id);
                        setDeletingId(null);
                      }}
                      className="bg-red-500 text-white p-2 rounded-lg text-xs font-bold"
                    >
                      EXCLUIR
                    </button>
                    <button 
                      onClick={() => setDeletingId(null)}
                      className="bg-slate-100 text-slate-600 p-2 rounded-lg text-xs font-bold"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setDeletingId(gauge.id)}
                    className="border border-slate-800 p-2 rounded-lg hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={18} className={deletingId === gauge.id ? 'text-red-500' : 'text-red-400'} />
                  </button>
                )}
              </div>

              <div className="space-y-1 mb-8">
                <h4 className="font-bold text-slate-900 text-xl tracking-tight">{gauge.name}</h4>
                <p className="text-sm text-slate-400 font-medium">
                  {gauge.lat.toFixed(4)}, {gauge.lng.toFixed(4)}
                </p>
              </div>

              <div className="pt-5 border-t border-slate-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Coordenadas GPS</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GaugeList;
