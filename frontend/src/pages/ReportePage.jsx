import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Printer, ArrowLeft, Loader2, AlertCircle, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import Layout from '../components/Layout';
import { exportLegalizacionToExcel } from '../utils/excelExport';

const fmt = (val) => {
  const num = parseFloat(val ?? 0);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (str) => {
  if (!str) return '';
  const parts = str.split('-');
  return `${parseInt(parts[1])}/${parseInt(parts[2])}/${parts[0]}`;
};

const ROWS_PER_PAGE = 20;

const thS = (w, a = 'center') => ({
  padding: '4px 3px',
  border: '1px solid #aaa',
  width: w || 'auto',
  textAlign: a,
  verticalAlign: 'middle',
  fontSize: '8.5px',
  fontWeight: 'bold',
  background: '#fff',
});

const tdS = (a = 'center', ex = {}) => ({
  padding: '2px 4px',
  border: '1px solid #ddd',
  fontSize: '9px',
  textAlign: a,
  verticalAlign: 'middle',
  ...ex,
});

const ReportePage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const legId = searchParams.get('id');
  const [leg, setLeg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [includeImages, setIncludeImages] = useState(true);

  useEffect(() => {
    if (!legId) {
      setError('No se especifico una legalizacion.');
      setLoading(false);
      return;
    }
    fetch(`${API_BASE_URL}/api/legalizaciones/${legId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('No se pudo cargar la legalizacion.');
        return r.json();
      })
      .then((d) => {
        setLeg(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [legId, token]);

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#94a3b8', gap: 8 }}>
          <Loader2 style={{ width: 24, height: 24 }} /> Cargando reporte...
        </div>
      </Layout>
    );
  }

  if (error || !leg) {
    return (
      <Layout>
        <div style={{ padding: 24, color: '#f87171', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle style={{ width: 20, height: 20 }} /> {error || 'No encontrado'}
        </div>
      </Layout>
    );
  }

  const gastos = leg.gastos || [];
  const gastosWithComprobante = gastos.filter(g => g.comprobante_url);
  const pages = [];
  for (let i = 0; i < Math.max(1, Math.ceil(gastos.length / ROWS_PER_PAGE)); i++) {
    pages.push(gastos.slice(i * ROWS_PER_PAGE, (i + 1) * ROWS_PER_PAGE));
  }
  const grandTotal = gastos.reduce((a, g) => a + parseFloat(g.monto ?? 0), 0);
  const checkNumber = String(leg.id).padStart(4, '0');

  return (
    <Layout>
      {/* Barra de herramientas */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} /> Volver
        </button>
        <div style={{ flex: 1 }} />
        
        {gastosWithComprobante.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#cbd5e1', cursor: 'pointer', userSelect: 'none', padding: '6px 12px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: 8, border: '1px solid #334155' }}>
            <input
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563eb' }}
            />
            <ImageIcon style={{ width: 16, height: 16, color: '#60a5fa' }} />
            Incluir imágenes en PDF ({gastosWithComprobante.length})
          </label>
        )}

        <button
          onClick={() => exportLegalizacionToExcel(leg)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
          title="Exportar a Hoja de Cálculo Excel (.xlsx)"
        >
          <FileSpreadsheet style={{ width: 16, height: 16 }} /> Exportar a Excel
        </button>

        <button
          onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
        >
          <Printer style={{ width: 16, height: 16 }} /> Imprimir / Guardar PDF
        </button>
      </div>

      {/* Area imprimible */}
      <div id="report-print-area">
        {pages.map((pageGastos, pageIdx) => {
          const isLast = pageIdx === pages.length - 1;
          const startSeq = pageIdx * ROWS_PER_PAGE + 1;

          return (
            <div
              key={pageIdx}
              style={{
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: '10px',
                color: '#000',
                background: '#fff',
                padding: '20px 24px',
                pageBreakAfter: isLast ? 'auto' : 'always',
                width: '100%',
                boxSizing: 'border-box',
                boxShadow: '0 1px 10px rgba(0,0,0,0.08)',
                marginBottom: pageIdx < pages.length - 1 ? 32 : 0,
              }}
            >
              {/* ── Encabezado ── */}
              {pageIdx === 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6 }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 180, border: '1px solid #888', padding: '8px 12px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 900, fontSize: 22, color: '#1a56a0', lineHeight: 1 }}>PCM</div>
                        <div style={{ fontSize: 8, color: '#666', letterSpacing: '2.5px', marginTop: 1 }}>ENGINEERING</div>
                      </td>
                      <td style={{ border: '1px solid #888', textAlign: 'center', fontWeight: 'bold', fontSize: 12, verticalAlign: 'middle' }}>
                        EXPENSE REPORT CHECK {checkNumber}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* ── Metadatos ── */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #888', marginBottom: 6 }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '5px 10px', width: '50%', verticalAlign: 'top', borderRight: '1px solid #ccc' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
                        <tbody>
                          <tr>
                            <td style={{ fontWeight: 'bold', color: '#1a56a0', whiteSpace: 'nowrap', paddingBottom: 3, width: 150 }}>VALUE OF THE CHECK</td>
                            <td style={{ paddingBottom: 3, width: 50 }}><u><b>COP</b></u></td>
                            <td style={{ paddingBottom: 3, textAlign: 'right' }}><u><b>{fmt(leg.anticipo)}</b></u></td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', color: '#1a56a0', paddingBottom: 3 }}>AMOUNT SPENT</td>
                            <td style={{ paddingBottom: 3 }}><u><b>COP</b></u></td>
                            <td style={{ paddingBottom: 3, textAlign: 'right' }}><u><b>{fmt(leg.total_gastado)}</b></u></td>
                          </tr>
                          <tr>
                            <td colSpan={3} style={{ paddingTop: 4 }}>
                              <span style={{ fontWeight: 'bold', color: '#1a56a0' }}>NAME OF THE PERSON IN CHARGE:&nbsp;&nbsp;</span>
                              <u><b>{leg.usuario?.nombre || ''}</b></u>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td style={{ padding: '5px 10px', verticalAlign: 'top' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
                        <tbody>
                          <tr>
                            <td style={{ fontWeight: 'bold', color: '#1a56a0', whiteSpace: 'nowrap', paddingBottom: 3, width: 110 }}>CASH BALANCE</td>
                            <td style={{ paddingBottom: 3 }}><u><b>{fmt(leg.saldo)}</b></u></td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', color: '#1a56a0', paddingBottom: 3 }}>PROJECT NAME</td>
                            <td style={{ paddingBottom: 3 }}><u><b>{leg.destino_motivo}</b></u></td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* ── Tabla de gastos ── */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #888' }}>
                <thead>
                  <tr>
                    <th style={thS('48px')}>SEQUENTIAL NUMBER</th>
                    <th style={thS('70px')}>No. RECEIPT</th>
                    <th style={thS('60px')}>DATE</th>
                    <th style={thS('110px', 'left')}>NAME</th>
                    <th style={thS('65px')}>TIN</th>
                    <th style={thS('60px')}>ADDRESS</th>
                    <th style={thS('65px')}>PHONE</th>
                    <th style={thS('32px')}>CITY</th>
                    <th style={thS(undefined, 'left')}>EXPENSE DESCRIPTION</th>
                    <th style={thS('72px', 'right')}>SUBTOTAL</th>
                    <th style={thS('58px', 'right')}>VAT (14%)</th>
                    <th style={thS('72px', 'right')}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {pageGastos.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', padding: 16, color: '#888', fontSize: 10 }}>
                        Sin gastos registrados.
                      </td>
                    </tr>
                  ) : (
                    pageGastos.map((g, idx) => {
                      const seq = startSeq + idx;
                      const subtotal = g.subtotal != null ? parseFloat(g.subtotal) : parseFloat(g.monto ?? 0);
                      const iva = g.iva != null ? parseFloat(g.iva) : 0;
                      const total = parseFloat(g.monto ?? 0);
                      return (
                        <tr key={g.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                          <td style={tdS('center')}>{seq}</td>
                          <td style={tdS('center')}>{g.no_comprobante || ''}</td>
                          <td style={tdS('center')}>{fmtDate(g.fecha_gasto)}</td>
                          <td style={tdS('left', { fontWeight: 600 })}>{g.proveedor || ''}</td>
                          <td style={tdS('center')}>{g.tin || ''}</td>
                          <td style={tdS('center')}>{g.direccion || ''}</td>
                          <td style={tdS('center')}>{g.telefono || ''}</td>
                          <td style={tdS('center')}>{g.ciudad || ''}</td>
                          <td style={tdS('left')}>{g.descripcion}</td>
                          <td style={tdS('right')}>{fmt(subtotal)}</td>
                          <td style={tdS('right')}>{iva > 0 ? fmt(iva) : ''}</td>
                          <td style={tdS('right', { fontWeight: 600 })}>{fmt(total)}</td>
                        </tr>
                      );
                    })
                  )}

                  {isLast && (
                    <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold', background: '#fff' }}>
                      <td colSpan={9} style={{ ...tdS('left'), fontWeight: 'bold', fontSize: 10, paddingLeft: 8, letterSpacing: 1 }}>
                        TOTAL
                      </td>
                      <td colSpan={2} style={{ ...tdS('right'), fontWeight: 'bold', fontSize: 10 }}>COP</td>
                      <td style={{ ...tdS('right'), fontWeight: 'bold', fontSize: 10 }}>{fmt(grandTotal)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* ── Firmas (solo ultima pagina) ── */}
              {isLast && (
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #888', marginTop: 16 }}>
                  <tbody>
                    <tr>
                      {['PREPARED BY:', 'COORDINATOR APPROVAL', 'REVIEWED', 'TECHNICAL MANAGER APPROVAL', 'ACCOUNTED'].map((label, i) => (
                        <td key={i} style={{ border: '1px solid #888', padding: '6px 8px', width: '20%', verticalAlign: 'top' }}>
                          <div style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 30 }}>{label}</div>
                          <div style={{ borderTop: '1px solid #444', marginTop: 4, minHeight: 14 }} />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          );
        })}

        {/* ── Anexo: Comprobantes de Gastos (Imágenes adjuntas para PDF) ── */}
        {includeImages && gastosWithComprobante.length > 0 && (
          <div
            style={{
              fontFamily: 'Arial, Helvetica, sans-serif',
              background: '#fff',
              padding: '20px 24px',
              pageBreakBefore: 'always',
              boxShadow: '0 1px 10px rgba(0,0,0,0.08)',
              marginTop: 32,
              borderRadius: 4
            }}
          >
            <div style={{ borderBottom: '2px solid #1a56a0', paddingBottom: 8, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 13, fontWeight: 'bold', color: '#1a56a0', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ANEXO: COMPROBANTES DE GASTOS ADJUNTOS ({gastosWithComprobante.length})
              </h3>
              <span style={{ fontSize: 9, color: '#666' }}>PCM ENGINEERING - EXPENSE REPORT CHECK {checkNumber}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
              {gastosWithComprobante.map((g, idx) => {
                let fullUrl = g.comprobante_url;
                if (fullUrl.startsWith('/')) {
                  fullUrl = `${API_BASE_URL}${fullUrl}`;
                } else if (!fullUrl.startsWith('http')) {
                  fullUrl = `${API_BASE_URL}/${fullUrl}`;
                }
                fullUrl = encodeURI(fullUrl);
                
                const isPdf = g.comprobante_url.toLowerCase().endsWith('.pdf');

                return (
                  <div
                    key={g.id}
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: 6,
                      padding: 14,
                      background: '#fafafa',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 8, fontSize: 10 }}>
                      <div>
                        <span style={{ fontWeight: 'bold', color: '#1a56a0' }}>GASTO N° {idx + 1}</span>
                        {g.no_comprobante && <span style={{ color: '#475569', marginLeft: 8 }}>| Comprobante: <b>{g.no_comprobante}</b></span>}
                        {g.proveedor && <span style={{ color: '#475569', marginLeft: 8 }}>| Proveedor: <b>{g.proveedor}</b></span>}
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>
                        {fmtDate(g.fecha_gasto)} &nbsp;|&nbsp; COP {fmt(g.monto)}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: 9.5, color: '#334155', marginBottom: 10 }}>
                      <b>Descripción:</b> {g.descripcion} &nbsp;({g.categoria})
                    </div>

                    {!isPdf ? (
                      <div style={{ textAlign: 'center', background: '#fff', padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }}>
                        <img
                          src={fullUrl}
                          alt={`Comprobante Gasto ${g.id}`}
                          style={{
                            maxHeight: '480px',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            display: 'inline-block',
                            borderRadius: 2
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ padding: 16, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, textAlign: 'center', fontSize: 10 }}>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#1e40af' }}>📄 Documento PDF Adjunto</p>
                        <p style={{ margin: '4px 0 8px 0', color: '#3b82f6', fontSize: 9 }}>El archivo cargado es un documento en formato PDF.</p>
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#1d4ed8', fontWeight: 'bold', textDecoration: 'underline' }}
                        >
                          Abrir o Descargar PDF Original
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: #fff !important; }
          #report-print-area { margin: 0; padding: 0; }
          @page { size: A4 landscape; margin: 8mm; }
          img { max-height: 440px !important; page-break-inside: avoid; }
        }
      `}</style>
    </Layout>
  );
};

export default ReportePage;