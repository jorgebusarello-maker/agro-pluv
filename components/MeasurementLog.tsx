
import React, { useState } from 'react';
import { AppState, Measurement } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, Pencil, Calendar, MessageSquare, X, AlertTriangle } from 'lucide-react';

interface MeasurementLogProps {
  state: AppState;
  onAdd: (m: Omit<Measurement, 'id'>) => void;
  onEdit: (m: Measurement) => void;
  onDelete: (id: string) => void;
}

const MeasurementLog: React.FC<MeasurementLogProps> = ({ state, onAdd, onEdit, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [gaugeId, setGaugeId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const sortedMeasurements = [...state.measurements].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const resetForm = () => {
    setGaugeId('');
    setAmount('');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (m: Measurement) => {
    setEditingId(m.id);
    setGaugeId(m.gaugeId);
    setAmount(m.amount.toString());
    setNotes(m.notes || '');
    setDate(m.date);
    setShowForm(true);
    setDeletingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gaugeId) return;

    if (editingId) {
      onEdit({
        id: editingId,
        gaugeId,
        amount: parseFloat(amount),
        date,
        notes: notes.trim() || undefined
      });
    } else {
      onAdd({ 
        gaugeId, 
        amount: parseFloat(amount), 
        date, 
        notes: notes.trim() || undefined 
      });
    }
    resetForm();
  };

  const confirmDelete = (id: string) => {
    onDelete(id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-bold text-slate-800">Histórico de Chuvas</h3>
        <button 
          onClick={() => {
            if (showForm && !editingId) setShowForm(false);
            else {
              resetForm();
              setShowForm(true);
            }
          }}
          disabled={state.gauges.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium ${
            state.gauges.length === 0 
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
          }`}
        >
          {showForm && !editingId ? <X size={18} /> : <Plus size={18} />}
          {showForm && !editingId ? 'Fechar' : 'Lançar Chuva'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-blue-100 shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-800">
              {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Pluviômetro</label>
              <select 
                required
                value={gaugeId}
                onChange={(e) => setGaugeId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {state.gauges.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Quantidade (mm)</label>
              <input 
                required
                type="number"
                step="0.1"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 25.5"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Data da Ocorrência</label>
              <input 
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <MessageSquare size={14} /> Anotações (opcional)
            </label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Chuva acompanhada de vento sul / Granizo isolado"
              rows={2}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-600">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              {editingId ? 'Salvar Alterações' : 'Registrar Medição'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Data</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Pluviômetro / Obs</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Volume</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedMeasurements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum registro encontrado. Comece lançando uma nova chuva.
                  </td>
                </tr>
              ) : (
                sortedMeasurements.map(m => {
                  const gauge = state.gauges.find(g => g.id === m.gaugeId);
                  const isDeleting = deletingId === m.id;

                  return (
                    <tr key={m.id} className={`transition-all group ${isDeleting ? 'bg-red-50' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-slate-400" />
                          <span className="text-slate-700 font-medium whitespace-nowrap">
                            {format(parseISO(m.date), "dd 'de' MMM", { locale: ptBR })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-sm font-medium w-fit mb-1">
                            {gauge?.name || 'Desconhecido'}
                          </span>
                          {m.notes ? (
                            <span className="text-xs text-slate-500 italic flex items-center gap-1">
                              <MessageSquare size={12} /> {m.notes}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300 italic flex items-center gap-1">
                              <MessageSquare size={12} /> Sem notas
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-bold text-blue-700">
                          {m.amount.toFixed(1)}
                          <span className="text-xs font-normal text-slate-400">mm</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center min-w-[100px]">
                          {isDeleting ? (
                            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                              <button 
                                onClick={() => confirmDelete(m.id)}
                                className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-red-700"
                              >
                                EXCLUIR
                              </button>
                              <button 
                                onClick={() => setDeletingId(null)}
                                className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-300"
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleEditClick(m)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Editar"
                              >
                                <Pencil size={16} />
                              </button>
                              <button 
                                onClick={() => setDeletingId(m.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MeasurementLog;
