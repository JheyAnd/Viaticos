import React from 'react';
import { MapPin, Calendar, DollarSign, Save, Loader2, Sparkles, Send } from 'lucide-react';

const ViajeForm = ({
  destino,
  setDestino,
  fechaInicio,
  setFechaInicio,
  anticipo,
  setAnticipo,
  legId,
  handleGuardarPaso1,
  loading,
  liquidacionMatematica,
  formatMoney,
  handleEnviarLegalizacion
}) => {
  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <span className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">1</span>
          <h3 className="font-bold text-slate-200">Datos Iniciales y Anticipo</h3>
        </div>

        <form onSubmit={handleGuardarPaso1} className="space-y-4">
          {/* Destino */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Destino / Motivo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                disabled={legId !== null}
                placeholder="Ej: Bogotá - Reunión de Ventas"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 disabled:opacity-60 focus:border-blue-500 rounded-xl text-sm text-slate-100 placeholder-slate-600 outline-none"
                required
              />
            </div>
          </div>

          {/* Fecha Inicio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha de Inicio</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                disabled={legId !== null}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 disabled:opacity-60 focus:border-blue-500 rounded-xl text-sm text-slate-100 placeholder-slate-600 outline-none"
                required
              />
            </div>
          </div>

          {/* Anticipo (Valor Inicial) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor Inicial (Anticipo)</label>
              <span className="text-[10px] text-slate-500">*Obligatorio (0 si no hay)</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                value={anticipo}
                onChange={(e) => setAnticipo(e.target.value)}
                disabled={legId !== null}
                placeholder="0"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 disabled:opacity-60 focus:border-blue-500 rounded-xl text-sm text-slate-100 placeholder-slate-600 outline-none font-mono"
                required
              />
            </div>
          </div>

          {!legId && (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Registrar Anticipo e Iniciar
            </button>
          )}
        </form>
      </div>

      {/* CARD DE LIQUIDACIÓN MATEMÁTICA EN TIEMPO REAL */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-sm text-slate-200">Liquidación en Tiempo Real</h3>
        </div>
        
        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between text-slate-400">
            <span>(+) Anticipo (Valor Inicial):</span>
            <span className="font-semibold text-slate-300">{formatMoney(liquidacionMatematica.anticipo)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>(-) Total Gastado:</span>
            <span className="font-semibold text-slate-300">{formatMoney(liquidacionMatematica.totalGastado)}</span>
          </div>
          <hr className="border-slate-800" />
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-slate-300">(=) Saldo Final:</span>
            <span className={liquidacionMatematica.saldo >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatMoney(liquidacionMatematica.saldo)}
            </span>
          </div>
        </div>

        {/* Botón de Enviar Legalización (Visible solo si se inició el flujo) */}
        {legId && (
          <button
            onClick={handleEnviarLegalizacion}
            disabled={loading}
            className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-600/15"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Finalizar y Enviar Legalización
          </button>
        )}
      </div>
    </div>
  );
};

export default ViajeForm;
