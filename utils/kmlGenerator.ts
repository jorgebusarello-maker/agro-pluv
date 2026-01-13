
import { Gauge, Measurement } from '../types';

export const generateKML = (gauges: Gauge[], measurements: Measurement[]) => {
  const placemarks = gauges.map(gauge => {
    const totalRain = measurements
      .filter(m => m.gaugeId === gauge.id)
      .reduce((sum, m) => sum + m.amount, 0);

    return `
    <Placemark>
      <name>${gauge.name}</name>
      <description>Chuva Total Acumulada: ${totalRain.toFixed(1)} mm</description>
      <Point>
        <coordinates>${gauge.lng},${gauge.lat},0</coordinates>
      </Point>
    </Placemark>`;
  }).join('');

  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Mapa de Chuva - AgroRain</name>
    <description>Monitoramento Pluviométrico da Safra</description>
    ${placemarks}
  </Document>
</kml>`;

  const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Mapa_Chuva_${new Date().toISOString().split('T')[0]}.kml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
