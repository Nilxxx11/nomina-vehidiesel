/**
 * Lectura de archivos .xlsx respetando la estructura de la hoja "OCT 2026".
 * Usa SheetJS (global window.XLSX) cargado por CDN en admin.html.
 */
import { COLUMNS, columnAliases, normHeader } from "./schema.js";
import { toNumber, normCedula } from "./utils.js";

const SHEET_PREFERIDA = "OCT 2026";

export function xlsxDisponible() {
  return typeof window !== "undefined" && typeof window.XLSX !== "undefined";
}

/** Lee un File y devuelve el libro de trabajo de SheetJS. */
export async function leerWorkbook(file) {
  if (!xlsxDisponible()) throw new Error("La librería de Excel (XLSX) no está cargada.");
  const buf = await file.arrayBuffer();
  return window.XLSX.read(buf, { type: "array", cellDates: true });
}

/** Devuelve la matriz (AOA) de una hoja del libro. */
export function hojaAOA(wb, nombreHoja) {
  const ws = wb.Sheets[nombreHoja];
  if (!ws) throw new Error(`No existe la hoja "${nombreHoja}".`);
  return window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, blankrows: false, defval: "" });
}

/** Nombre de hoja sugerido (prefiere "OCT 2026"). */
export function hojaSugerida(wb) {
  const names = wb.SheetNames || [];
  return names.find(n => normHeader(n) === normHeader(SHEET_PREFERIDA)) || names[0];
}

/** Compatibilidad: lee un File -> { sheetNames, hojaElegida, aoa } */
export async function leerArchivo(file) {
  const wb = await leerWorkbook(file);
  const sheetNames = wb.SheetNames || [];
  const hojaElegida = hojaSugerida(wb);
  return { sheetNames, hojaElegida, aoa: hojaAOA(wb, hojaElegida) };
}

/** Busca la fila de encabezados dentro de las primeras `max` filas. */
function encontrarFilaEncabezado(aoa, max = 30) {
  const limite = Math.min(max, aoa.length);
  for (let i = 0; i < limite; i++) {
    const set = new Set((aoa[i] || []).map(normHeader));
    const tieneCedula = set.has("CEDULA");
    const tieneNombre = set.has("EMPLEADO") || set.has("NOMBRE") || set.has("NOMBRES");
    const tieneSalario = [...set].some(h => h.includes("BASICO") || h === "SALARIO");
    if (tieneCedula && (tieneNombre || tieneSalario)) return i;
  }
  return -1;
}

/**
 * Mapea cada columna del esquema a un índice real del encabezado.
 * Primero por nombre (tolerante a alias y a encabezados duplicados como
 * "VACACIONES"); si no hay suficientes coincidencias, cae a mapeo posicional.
 */
function mapearColumnas(headerRow) {
  const used = new Set();
  const map = {};
  let matched = 0;

  for (const col of COLUMNS) {
    const aliases = columnAliases(col);
    let idx = -1;
    for (let i = 0; i < headerRow.length; i++) {
      if (used.has(i)) continue;
      const h = normHeader(headerRow[i]);
      if (h && aliases.includes(h)) { idx = i; break; }
    }
    if (idx > -1) { map[col.key] = idx; used.add(idx); matched++; }
  }

  // Fallback: el encabezado no se reconoció -> usar posición estándar A..CA
  if (matched < 10) {
    COLUMNS.forEach((col, i) => { map[col.key] = i; });
    return { map, modo: "posicional", matched: COLUMNS.length };
  }

  // Completar lo que falte por posición cuando la columna del esquema existe
  COLUMNS.forEach((col, i) => {
    if (map[col.key] == null && !used.has(i)) map[col.key] = i;
  });

  return { map, modo: matched >= COLUMNS.length * 0.6 ? "encabezado" : "mixto", matched };
}

/**
 * Convierte la matriz (AOA) en registros listos para Firebase.
 * @returns {{ records: Array, mapping: object, meta: object }}
 */
export function construirRegistros(aoa) {
  const headerRowIdx = encontrarFilaEncabezado(aoa);
  if (headerRowIdx < 0) {
    throw new Error("No se encontró la fila de encabezados (debe contener CÉDULA y EMPLEADO/SALARIO).");
  }
  const headerRow = aoa[headerRowIdx] || [];
  const { map, modo, matched } = mapearColumnas(headerRow);

  const porCedula = new Map();
  for (let r = headerRowIdx + 1; r < aoa.length; r++) {
    const row = aoa[r] || [];
    const rec = {};
    for (const col of COLUMNS) {
      const idx = map[col.key];
      const raw = idx != null ? row[idx] : "";
      if (col.type === "number") rec[col.key] = toNumber(raw);
      else if (col.type === "id") rec[col.key] = normCedula(raw);
      else rec[col.key] = String(raw ?? "").trim();
    }
    if (!rec.cedula) continue;
    if (!rec.empleado && !rec.cargo) continue;
    // conserva el registro con más información valiosa si hay cédulas repetidas
    const previo = porCedula.get(rec.cedula);
    if (!previo) { porCedula.set(rec.cedula, rec); continue; }
    const peso = (x) => Object.values(x).reduce((a, v) => a + (typeof v === "number" ? (v !== 0 ? 1 : 0) : (v ? 1 : 0)), 0);
    if (peso(rec) > peso(previo)) porCedula.set(rec.cedula, rec);
  }

  const records = [...porCedula.values()];
  return {
    records,
    mapping: map,
    meta: {
      headerRow: headerRowIdx + 1,
      columnasReconocidas: matched,
      totalColumnas: COLUMNS.length,
      modo,
      totalEmpleados: records.length,
    },
  };
}
