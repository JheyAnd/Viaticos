import * as XLSX from 'xlsx';

const formatNum = (val) => {
  const num = parseFloat(val ?? 0);
  return isNaN(num) ? 0 : num;
};

const formatDate = (str) => {
  if (!str) return '';
  const parts = str.split('-');
  if (parts.length === 3) {
    return `${parseInt(parts[1])}/${parseInt(parts[2])}/${parts[0]}`;
  }
  return str;
};

export const exportLegalizacionToExcel = (leg) => {
  if (!leg) return;

  const checkNumber = String(leg.id).padStart(4, '0');
  const gastos = leg.gastos || [];
  const grandTotal = gastos.reduce((acc, g) => acc + formatNum(g.monto), 0);

  // 1. Construcción de filas de la hoja de cálculo
  const wsData = [];

  // Encabezado
  wsData.push(['PCM ENGINEERING', '', '', '', '', '', '', '', '', '', '', '']);
  wsData.push([`EXPENSE REPORT CHECK ${checkNumber}`, '', '', '', '', '', '', '', '', '', '', '']);
  wsData.push([]); // Fila en blanco

  // Metadatos
  wsData.push(['VALOR DEL CHEQUE / ANTICIPO:', 'COP', formatNum(leg.anticipo), '', 'SALDO EN CAJA:', formatNum(leg.saldo)]);
  wsData.push(['TOTAL GASTADO:', 'COP', formatNum(leg.total_gastado), '', 'NOMBRE PROYECTO:', leg.destino_motivo || '']);
  wsData.push(['RESPONSABLE:', leg.usuario?.nombre || '', '', '', 'FECHA INICIO:', leg.fecha_inicio || '']);
  wsData.push([]); // Fila en blanco

  // Encabezados de Tabla de Gastos
  wsData.push([
    'N° SECUENCIAL',
    'N° COMPROBANTE',
    'FECHA',
    'NOMBRE / PROVEEDOR',
    'NIT / TIN',
    'DIRECCIÓN',
    'TELÉFONO',
    'CIUDAD',
    'DESCRIPCIÓN DEL GASTO',
    'SUBTOTAL',
    'IVA (14%)',
    'TOTAL'
  ]);

  // Filas de Gastos
  gastos.forEach((g, idx) => {
    const seq = idx + 1;
    const total = formatNum(g.monto);
    const subtotal = g.subtotal != null ? formatNum(g.subtotal) : total;
    const iva = g.iva != null ? formatNum(g.iva) : 0;

    wsData.push([
      seq,
      g.no_comprobante || '',
      formatDate(g.fecha_gasto),
      g.proveedor || '',
      g.tin || '',
      g.direccion || '',
      g.telefono || '',
      g.ciudad || '',
      g.descripcion || '',
      subtotal,
      iva > 0 ? iva : '',
      total
    ]);
  });

  // Fila de Total General
  wsData.push([
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'COP',
    '',
    grandTotal
  ]);

  // 2. Crear hoja de cálculo
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Definir anchos de columnas
  ws['!cols'] = [
    { wch: 15 }, // N° Secuencial
    { wch: 18 }, // N° Comprobante
    { wch: 14 }, // Fecha
    { wch: 25 }, // Proveedor
    { wch: 16 }, // TIN
    { wch: 20 }, // Dirección
    { wch: 15 }, // Teléfono
    { wch: 15 }, // Ciudad
    { wch: 35 }, // Descripción
    { wch: 15 }, // Subtotal
    { wch: 15 }, // IVA
    { wch: 18 }  // Total
  ];

  // 3. Crear Libro y guardar
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Check ${checkNumber}`);

  const fileName = `Reporte_PCM_Check_${checkNumber}_${(leg.destino_motivo || 'Viaticos').replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
