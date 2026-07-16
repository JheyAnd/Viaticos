import React from 'react';
import { Calendar, MapPin, Eye, Printer, Edit, Trash2 } from 'lucide-react';

const LegalizacionesTable = ({
  legalizaciones,
  formatMoney,
  handleVerDetalles,
  navigate,
  user,
  handleEliminar
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-950/30 text-xs font-semibold uppercase text-slate-500 tracking-wider">
            <th className="py-4 px-6">Fecha Inicio</th>
            <th className="py-4 px-6">Destino / Motivo</th>
            <th className="py-4 px-6 text-right">Anticipo</th>
            <th className="py-4 px-6 text-right">Total Gastado</th>
            <th className="py-4 px-6 text-right">Saldo Final</th>
            <th className="py-4 px-6">Estado</th>
            <th className="py-4 px-6 text-center print:hidden">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
          {legalizaciones.map((leg) => {
            const saldo = parseFloat(leg.saldo);
            return (
              <tr key={leg.id} className="hover:bg-slate-900/20 transition-all duration-150">
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    {leg.fecha_inicio}
                  </div>
                </td>
                <td className="py-4 px-6 font-medium text-slate-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    {leg.destino_motivo}
                  </div>
                </td>
                <td className="py-4 px-6 text-right font-semibold font-mono text-slate-400">
                  {formatMoney(leg.anticipo)}
                </td>
                <td className="py-4 px-6 text-right font-semibold font-mono text-slate-400">
                  {formatMoney(leg.total_gastado)}
                </td>
                <td className={`py-4 px-6 text-right font-bold font-mono ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatMoney(saldo)}
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    leg.estado === 'Borrador' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    leg.estado === 'Enviado' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-green-500/10 text-green-400 border border-green-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      leg.estado === 'Borrador' ? 'bg-amber-400' :
                      leg.estado === 'Enviado' ? 'bg-blue-400' :
                      'bg-green-400'
                    }`}></span>
                    {leg.estado}
                  </span>
                </td>
                <td className="py-4 px-6 text-center print:hidden">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleVerDetalles(leg.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all duration-200"
                      title="Ver Detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/reporte?id=${leg.id}`)}
                      className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg transition-all duration-200"
                      title="Ver Reporte PCM"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    
                    {leg.estado === 'Borrador' && (
                      <button
                        onClick={() => navigate(`/nueva?id=${leg.id}`)}
                        className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg transition-all duration-200"
                        title="Continuar Editando"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {(user?.rol === 'superadmin' || user?.rol === 'admin') && (
                      <button
                        onClick={() => handleEliminar(leg.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LegalizacionesTable;
