import React from 'react';
import { Eye, Search, X } from 'lucide-react';

const ColaboradoresTable = ({
  filteredColaboradores,
  searchQuery,
  setSearchQuery,
  formatMoney,
  setSelectedColab,
  setExpandedLegIds
}) => {
  return (
    <div>
      <div className="p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Historial por Colaborador</h3>
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-9 pr-9 py-2.5 bg-slate-950/50 border border-slate-800 focus:border-blue-500 rounded-xl text-xs text-slate-200 placeholder-slate-600 outline-none transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/30 text-xs font-semibold uppercase text-slate-500 tracking-wider">
              <th className="py-4 px-6">Colaborador</th>
              <th className="py-4 px-6 text-center">Viajes / Legalizaciones</th>
              <th className="py-4 px-6 text-right">Anticipos Desembolsados</th>
              <th className="py-4 px-6 text-right">Total Gastado</th>
              <th className="py-4 px-6 text-right">Saldo Global</th>
              <th className="py-4 px-6 text-center print:hidden">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
            {filteredColaboradores.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-500">
                  No se encontraron colaboradores que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredColaboradores.map((colab) => {
                const totalSaldo = colab.saldo;
                return (
                  <tr key={colab.usuario.id} className="hover:bg-slate-900/20 transition-all duration-150">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-950/50 border border-slate-800 flex items-center justify-center font-bold text-slate-300">
                          {colab.usuario.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{colab.usuario.nombre}</div>
                          <div className="text-xs text-slate-500 font-mono">{colab.usuario.correo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-slate-400">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs">
                        {colab.legalizacionesList.length} {colab.legalizacionesList.length === 1 ? 'Viaje' : 'Viajes'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-semibold font-mono text-slate-400">
                      {formatMoney(colab.anticipo)}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold font-mono text-slate-400">
                      {formatMoney(colab.total_gastado)}
                    </td>
                    <td className={`py-4 px-6 text-right font-bold font-mono ${totalSaldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatMoney(totalSaldo)}
                    </td>
                    <td className="py-4 px-6 text-center print:hidden">
                      <button
                        onClick={() => {
                          setSelectedColab(colab);
                          setExpandedLegIds([]); // reset expansion state
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all duration-200 shadow-md shadow-blue-600/10"
                        title="Ver Desglose de Viáticos"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Desglose
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ColaboradoresTable;
