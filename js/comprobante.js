/**
 * Comprobante de pago (equivalente a la hoja VOLANTE).
 * Renderiza el detalle y genera el PDF descargable.
 */
import { COMPANY } from "./config.js";
import { money, num, escapeHtml } from "./utils.js";

/** Rubros de devengo derivados de las columnas de OCT 2026. */
export function devengos(n) {
  const horasExtra = [
    "valorRecargoNocturno", "valorHorasExtrasDiurnas", "valorHorasExtrasNocturnas",
    "valorDominicalOcasional", "valorRecargoNocturnoFestivo", "valorFestivoDiurno",
    "valorHorasExtrasDiurnasFestivas", "valorHorasExtrasNocturnasFestivas",
  ].reduce((a, k) => a + (+n[k] || 0), 0);

  const incapacidades = ["incapacidadAsumidaEmpresa", "incapacidadCobrarEps", "incapacidadAt"]
    .reduce((a, k) => a + (+n[k] || 0), 0);

  return [
    { label: "INGRESO BÁSICO", base: n.dLab, valor: n.sDevengado, key: "sDevengado" },
    { label: "AUXILIO DE TRANSPORTE", base: "", valor: n.auxTransp, key: "auxTransp" },
    { label: "COMISIONES", base: "", valor: n.comisiones, key: "comisiones" },
    { label: "AUXILIOS EXTRALEGALES / RODAMIENTO", base: "", valor: (+n.rodamiento || 0) + (+n.auxiliosRodamiento || 0), key: "auxRod" },
    { label: "HORAS EXTRA Y RECARGOS", base: n.horasExtrasDiurnas, valor: horasExtra, key: "horasExtra" },
    { label: "RETROACTIVO", base: "", valor: n.retroactivo, key: "retroactivo" },
    { label: "INCAPACIDADES", base: "", valor: incapacidades, key: "incapacidades" },
    { label: "DÍA DE LA FAMILIA", base: "", valor: n.diaDeLaFamilia, key: "diaDeLaFamilia" },
    { label: "LICENCIA DE LUTO", base: "", valor: n.licenciaLuto, key: "licenciaLuto" },
    { label: "PERMISO REMUNERADO", base: "", valor: n.permisoRemunerado, key: "permisoRemunerado" },
    { label: "VACACIONES", base: n.diasVac, valor: n.vacaciones, key: "vacaciones" },
    { label: "SALARIO BASE VACACIONES", base: "", valor: n.salarioBaseVacaciones, key: "salarioBaseVacaciones" },
    { label: "BONIFICACIÓN SALARIAL", base: "", valor: n.bonificacionSalarial, key: "bonificacionSalarial" },
    { label: "BONIFICACIÓN NO SALARIAL", base: "", valor: n.bonificacionNoSalarial, key: "bonificacionNoSalarial" },
  ].filter(d => (+d.valor || 0) !== 0 || d.key === "sDevengado" || d.key === "auxTransp");
}

/** Rubros de deducción derivados de las columnas de OCT 2026. */
export function deducciones(n) {
  return [
    { label: "APORTE EPS (SALUD 4%)", base: n.ibcSaludPensionCorte || n.ibc, valor: n.salud4 },
    { label: "APORTE PENSIÓN (4%)", base: n.ibcSaludPensionCorte || n.ibc, valor: n.pension4 },
    { label: "FONDO SOLIDARIDAD PENSIONAL", base: n.ibcSaludPensionCorte || n.ibc, valor: n.fsp },
    { label: "RETEFUENTE", base: "", valor: n.retefuente },
    { label: "LIBRANZA", base: "", valor: n.libranzas },
    { label: "SEGURO EXEQUIAL", base: "", valor: n.segurosExequiales },
    { label: "EMBARGOS", base: "", valor: n.embargos },
    { label: "DESCUENTO AUTORIZADO", base: "", valor: n.descuentosAutorizados },
    { label: "OTROS DESCUENTOS", base: "", valor: n.otrosDescuentos },
  ].filter(d => (+d.valor || 0) !== 0);
}

export function totalDevengado(n) {
  if (+n.totalDevengos) return +n.totalDevengos;
  return devengos(n).reduce((a, d) => a + (+d.valor || 0), 0);
}
export function totalDeducciones(n) {
  if (+n.tDeducciones) return +n.tDeducciones;
  return deducciones(n).reduce((a, d) => a + (+d.valor || 0), 0);
}
export function netoAPagar(n) {
  if (+n.netoPagarQuincena) return +n.netoPagarQuincena;
  if (+n.totalAPagar) return +n.totalAPagar;
  return totalDevengado(n) - totalDeducciones(n);
}

/** Filas HTML de una lista de rubros. */
function filas(rubros) {
  return rubros.map(r => `
    <tr>
      <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(r.label)}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap;">${r.base === "" ? "" : num(r.base)}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap;">${money(r.valor)}</td>
    </tr>`).join("");
}

/**
 * Genera el HTML completo del comprobante (con estilos inline para el PDF).
 */
export function comprobanteHTML(nomina, periodo = {}) {
  const n = nomina;
  const dev = devengos(n);
  const ded = deducciones(n);
  const tDev = totalDevengado(n);
  const tDed = totalDeducciones(n);
  const neto = netoAPagar(n);

  const th = "padding:8px;background:#0f172a;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.4px;text-align:left;";
  const thR = th + "text-align:right;";
  const td = "padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:12px;";

  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff;padding:28px 30px;width:760px;box-sizing:border-box;box-shadow:none;border-radius:0;">
    <table style="width:100%;border-collapse:collapse;border-bottom:3px solid #2563eb;margin-bottom:16px;">
      <tr>
        <td style="padding-bottom:12px;vertical-align:top;">
          <div style="font-size:22px;font-weight:800;color:#2563eb;letter-spacing:.5px;">COMPROBANTE DE PAGO</div>
          <div style="font-size:13px;font-weight:700;margin-top:2px;">${escapeHtml(COMPANY.nombre)}</div>
          <div style="font-size:11px;color:#64748b;">NIT ${escapeHtml(COMPANY.nit)}</div>
        </td>
        <td style="padding-bottom:12px;vertical-align:top;text-align:right;font-size:12px;white-space:nowrap;">
          <div><b>PERIODO:</b> ${escapeHtml(periodo.nombre || "—")}</div>
          <div><b>FECHA DE PAGO:</b> ${escapeHtml(periodo.fechaPago || new Date().toLocaleDateString("es-CO"))}</div>
          <div><b>No. de días:</b> ${n.dLab || "—"}</div>
        </td>
      </tr>
    </table>

    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px;">
      <tr>
        <td style="padding:4px 0;width:130px;color:#64748b;">EMPLEADO</td>
        <td style="padding:4px 0;font-weight:700;">${escapeHtml(n.empleado)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#64748b;">IDENTIFICACIÓN</td>
        <td style="padding:4px 0;">${escapeHtml(n.cedula)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#64748b;">CARGO</td>
        <td style="padding:4px 0;">${escapeHtml(n.cargo || "—")}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#64748b;">SALARIO BÁSICO</td>
        <td style="padding:4px 0;">${money(n.sBasico)}</td>
      </tr>
    </table>

    <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
      <thead>
        <tr>
          <th style="${th}">Devengados — concepto</th>
          <th style="${thR}">Base</th>
          <th style="${thR}">Devengado</th>
        </tr>
      </thead>
      <tbody>${filas(dev)}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="${td}font-weight:700;text-align:right;background:#f1f5f9;">TOTAL DEVENGADO</td>
          <td style="${td}font-weight:700;text-align:right;background:#f1f5f9;">${money(tDev)}</td>
        </tr>
      </tfoot>
    </table>

    ${ded.length ? `
    <table style="width:100%;border-collapse:collapse;margin:14px 0 6px;">
      <thead>
        <tr>
          <th style="${th}">Deducciones — concepto</th>
          <th style="${thR}">Base</th>
          <th style="${thR}">Deducción</th>
        </tr>
      </thead>
      <tbody>${filas(ded)}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="${td}font-weight:700;text-align:right;background:#f1f5f9;">TOTAL DEDUCCIONES</td>
          <td style="${td}font-weight:700;text-align:right;background:#f1f5f9;">${money(tDed)}</td>
        </tr>
      </tfoot>
    </table>` : ""}

    <table style="width:100%;border-collapse:collapse;margin:14px 0 22px;">
      <tr>
        <td style="width:60%;border:none;"></td>
        <td style="background:#2563eb;color:#ffffff;border-radius:10px;padding:12px 22px;text-align:right;border:none;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#dbeafe;">Neto a pagar</div>
          <div style="font-size:24px;font-weight:800;color:#ffffff;">${money(neto)}</div>
        </td>
      </tr>
    </table>

    <div style="border-top:1px dashed #cbd5e1;padding-top:12px;">
      <div style="font-size:12px;font-weight:700;margin-bottom:6px;">Información prestaciones sociales y aportes</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tbody>
          <tr>
            <td style="padding:3px 6px;color:#64748b;">Cesantías</td><td style="padding:3px 6px;text-align:right;">${money(n.cesantias)}</td>
            <td style="padding:3px 6px;color:#64748b;">Intereses</td><td style="padding:3px 6px;text-align:right;">${money(n.intereses)}</td>
            <td style="padding:3px 6px;color:#64748b;">Primas</td><td style="padding:3px 6px;text-align:right;">${money(n.primas)}</td>
          </tr>
          <tr>
            <td style="padding:3px 6px;color:#64748b;">Vacaciones</td><td style="padding:3px 6px;text-align:right;">${money(n.vacacionesPrestacion)}</td>
            <td style="padding:3px 6px;color:#64748b;">EPS</td><td style="padding:3px 6px;text-align:right;">${money(n.eps)}</td>
            <td style="padding:3px 6px;color:#64748b;">AFP</td><td style="padding:3px 6px;text-align:right;">${money(n.afp)}</td>
          </tr>
          <tr>
            <td style="padding:3px 6px;color:#64748b;">ARL</td><td style="padding:3px 6px;text-align:right;">${money(n.arl)}</td>
            <td style="padding:3px 6px;color:#64748b;">Caja</td><td style="padding:3px 6px;text-align:right;">${money(n.caja)}</td>
            <td style="padding:3px 6px;color:#64748b;">ICBF / SENA</td><td style="padding:3px 6px;text-align:right;">${money((+n.icbf||0)+(+n.sena||0))}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${n.notas ? `<div style="margin-top:12px;font-size:11px;background:#fef3c7;border-radius:8px;padding:8px 10px;"><b>Notas:</b> ${escapeHtml(n.notas)}</div>` : ""}

    <div style="margin-top:18px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:10px;">
      Cualquier inquietud enviar requerimiento al correo ${escapeHtml(COMPANY.correo)} con copia a ${escapeHtml(COMPANY.copia)}.
    </div>
  </div>`;
}

/** Nombre de archivo sugerido. */
export function nombreArchivo(nomina, periodo) {
  const periodoSlug = String(periodo?.nombre || "periodo").replace(/\s+/g, "_");
  const nombre = String(nomina.empleado || "empleado").replace(/\s+/g, "_");
  return `Comprobante_${nombre}_${nomina.cedula}_${periodoSlug}.pdf`;
}

/**
 * Genera y descarga el PDF del comprobante.
 * Si html2pdf no está disponible, abre una ventana de impresión.
 */
/**
 * Genera y descarga el PDF del comprobante.
 * @param {object} nomina  registro del empleado
 * @param {object} periodo datos del periodo
 * @param {HTMLElement} [nodoVisible] nodo ya renderizado en el DOM (vista previa).
 *        Si se pasa, se captura ese mismo nodo (el PDF coincide con la vista previa).
 */
export async function descargarComprobantePDF(nomina, periodo = {}, nodoVisible = null) {
  const html = comprobanteHTML(nomina, periodo);

  if (typeof window.html2pdf !== "undefined") {
    let holder = null;
    let nodo = nodoVisible;

    if (!nodo) {
      // Sin nodo visible: usar uno en el DOM en (0,0) detrás del contenido.
      holder = document.createElement("div");
      holder.style.cssText = "position:absolute;left:0;top:0;z-index:-1;background:#ffffff;";
      holder.innerHTML = html;
      document.body.appendChild(holder);
      nodo = holder.firstElementChild;
    }

    try {
      await window.html2pdf().set({
        margin: 0,
        filename: nombreArchivo(nomina, periodo),
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      }).from(nodo).save();
    } finally {
      if (holder) holder.remove();
    }
    return true;
  }

  // Fallback: ventana de impresión -> "Guardar como PDF"
  const w = window.open("", "_blank");
  w.document.write(`<html><head><title>Comprobante</title></head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
  return true;
}
