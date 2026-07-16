import React from 'react';
import { Inbox, TrendingUp, DollarSign } from 'lucide-react';

const StatsSummary = ({ isAdminView, totalAnticipos, totalGastos, totalSaldos, formatMoney }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
      {/* Anticipo Total */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-xl">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {isAdminView ? 'Anticipos Desembolsados' : 'Anticipos Totales'}
          </span>
          <h3 className="text-2xl font-bold text-slate-200">{formatMoney(totalAnticipos)}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-center text-blue-400">
          <Inbox className="w-6 h-6" />
        </div>
      </div>

      {/* Gastado Total */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-xl">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {isAdminView ? 'Gastos Registrados' : 'Total Gastado'}
          </span>
          <h3 className="text-2xl font-bold text-slate-200">{formatMoney(totalGastos)}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-center text-amber-500">
          <TrendingUp className="w-6 h-6" />
        </div>
      </div>

      {/* Saldo Neto */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-xl">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {isAdminView ? 'Saldos a Reembolsar/Cobrar' : 'Saldo a Liquidar'}
          </span>
          <h3 className={`text-2xl font-bold ${totalSaldos >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatMoney(totalSaldos)}
          </h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-center">
          <DollarSign className={`w-6 h-6 ${totalSaldos >= 0 ? 'text-green-400' : 'text-red-400'}`} />
        </div>
      </div>
    </div>
  );
};

export default StatsSummary;
