
import React, { useMemo } from 'react';
import { AppState, Measurement } from '../types';
import { 
  Droplets, 
  TrendingUp, 
  Calendar, 
  CalendarDays, 
  BarChart3,
  CalendarRange
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  state: AppState;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const { measurements, gauges } = state;

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const weeklyTotal = measurements
      .filter(m => isWithinInterval(parseISO(m.date), { start: weekStart, end: weekEnd }))
      .reduce((sum, m) => sum + m.amount, 0);

    const monthlyTotal = measurements
      .filter(m => isWithinInterval(parseISO(m.date), { start: monthStart, end: monthEnd }))
      .reduce((sum, m) => sum + m.amount, 0);

    const seasonTotal = measurements
      .reduce((sum, m) => sum + m.amount, 0);

    const maxRain = measurements.length > 0 
      ? Math.max(...measurements.map(m => m.amount)) 
      : 0;

    const dailyAvg = measurements.length > 0 
      ? (seasonTotal / 30).toFixed(1) // Simplified average over last month or active days
      : 0;

    return {
      weeklyTotal,
      monthlyTotal,
      seasonTotal,
      maxRain,
      dailyAvg
    };
  }, [measurements]);

  // Chart data for last 7 days
  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dailySum = measurements
        .filter(m => m.date === dateStr)
        .reduce((sum, m) => sum + m.amount, 0);
      
      const avg = gauges.length > 0 ? dailySum / gauges.length : 0;
      
      return {
        name: format(d, 'EEE', { locale: ptBR }),
        amount: parseFloat(avg.toFixed(1))
      };
    });
    return days;
  }, [measurements, gauges]);

  return (
    <div className="space-y-6">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Droplets className="text-blue-500" />} 
          label="Média Diária" 
          value={`${stats.dailyAvg} mm`} 
          subtext="Últimos 30 dias"
        />
        <StatCard 
          icon={<TrendingUp className="text-emerald-500" />} 
          label="Máxima Registrada" 
          value={`${stats.maxRain} mm`} 
          subtext="Entre pluviômetros"
        />
        <StatCard 
          icon={<CalendarDays className="text-amber-500" />} 
          label="Total Semanal" 
          value={`${stats.weeklyTotal.toFixed(1)} mm`} 
          subtext="Semana atual"
        />
        <StatCard 
          icon={<CalendarRange className="text-indigo-500" />} 
          label="Total Mensal" 
          value={`${stats.monthlyTotal.toFixed(1)} mm`} 
          subtext="Mês vigente"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 size={20} className="text-slate-400" />
              Volume Médio Diário (Última Semana)
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  unit=" mm"
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#10b981' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Season Summary */}
        <div className="bg-emerald-700 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="font-medium text-emerald-100 flex items-center gap-2 mb-8">
              <Calendar size={20} />
              Total Geral da Safra
            </h3>
            <div className="mb-2">
              <span className="text-5xl font-bold">{stats.seasonTotal.toFixed(1)}</span>
              <span className="ml-2 text-xl font-medium text-emerald-200">mm</span>
            </div>
            <p className="text-emerald-100 text-sm opacity-80">
              Acumulado desde {format(parseISO(state.selectedSeasonStart), 'dd/MM/yyyy')}
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-emerald-600/50">
            <div className="flex justify-between items-center text-sm">
              <span>Status da Safra</span>
              <span className="bg-emerald-500/30 px-2 py-1 rounded-lg">Regular</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, subtext: string }> = ({ icon, label, value, subtext }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-hover hover:border-emerald-200">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    </div>
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-slate-500 uppercase tracking-tight">{label}</h4>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400">{subtext}</p>
    </div>
  </div>
);

export default Dashboard;
