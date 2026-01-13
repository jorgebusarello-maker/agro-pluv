
import React, { useEffect, useRef } from 'react';
import { Gauge, Measurement } from '../types';
import { MapPin, Info } from 'lucide-react';
import L from 'leaflet';

interface RainMapProps {
  gauges: Gauge[];
  measurements: Measurement[];
}

const RainMap: React.FC<RainMapProps> = ({ gauges, measurements }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const getIntensityColor = (amount: number) => {
    if (amount === 0) return '#e2e8f0'; // slate-200
    if (amount < 20) return '#bfdbfe';  // blue-200
    if (amount < 50) return '#60a5fa';  // blue-400
    if (amount < 100) return '#2563eb'; // blue-600
    return '#1e40af';                   // blue-800
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Inicializa o mapa se ainda não existir
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([-15.7801, -47.9292], 4); // Centro do Brasil

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);
      
      // Tenta focar nos pluviômetros se existirem
      if (gauges.length > 0) {
        const bounds = L.latLngBounds(gauges.map(g => [g.lat, g.lng]));
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    // Limpa camadas anteriores (exceto o tileLayer)
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        mapInstance.current?.removeLayer(layer);
      }
    });

    // Adiciona os marcadores de pluviômetros
    gauges.forEach(gauge => {
      const total = measurements
        .filter(m => m.gaugeId === gauge.id)
        .reduce((sum, m) => sum + m.amount, 0);

      const marker = L.circleMarker([gauge.lat, gauge.lng], {
        radius: 12 + Math.min(total / 10, 20), // Tamanho dinâmico baseado na chuva
        fillColor: getIntensityColor(total),
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(mapInstance.current!);

      marker.bindPopup(`
        <div style="font-family: sans-serif;">
          <strong style="display: block; font-size: 14px; margin-bottom: 4px;">${gauge.name}</strong>
          <span style="color: #2563eb; font-weight: bold; font-size: 16px;">${total.toFixed(1)} mm</span>
          <br/><span style="color: #64748b; font-size: 11px;">Acumulado Geral</span>
        </div>
      `);
    });

    // Ajusta o zoom se novos pluviômetros forem adicionados
    if (gauges.length > 0 && mapInstance.current) {
        const bounds = L.latLngBounds(gauges.map(g => [g.lat, g.lng]));
        mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

    return () => {
      // Opcional: destruir o mapa ao desmontar
      // mapInstance.current?.remove();
      // mapInstance.current = null;
    };
  }, [gauges, measurements]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Mapa de Intensidade</h3>
          <p className="text-sm text-slate-500">Visualização geográfica real da sua fazenda</p>
        </div>
        <div className="flex gap-2 text-[10px] md:text-xs">
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded"></span> &lt;20mm</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded"></span> 20-50mm</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-800 rounded"></span> &gt;100mm</div>
        </div>
      </div>

      <div className="relative aspect-video w-full bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden shadow-inner">
        <div ref={mapRef} className="w-full h-full" />
        
        {gauges.length === 0 && (
          <div className="absolute inset-0 z-[1000] bg-slate-50/80 backdrop-blur-sm flex items-center justify-center text-center p-8">
            <div className="max-w-xs">
              <MapPin size={48} className="mx-auto text-slate-300 mb-4 animate-bounce" />
              <p className="text-slate-500 font-medium">Cadastre pluviômetros com latitude e longitude para visualizar o mapa de calor.</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 items-start">
        <Info size={20} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Dica de Utilização:</p>
          <p>Os círculos no mapa aumentam de tamanho e mudam de cor conforme o volume de chuva acumulado. Clique em um marcador para ver detalhes.</p>
        </div>
      </div>
    </div>
  );
};

export default RainMap;
