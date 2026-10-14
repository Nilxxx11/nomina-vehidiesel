/**
 * Esquema de columnas de la hoja "OCT 2026" del libro de nómina VEHIDIESEL.
 *
 * El orden de este arreglo es EXACTAMENTE el orden de columnas A..CA (1..79)
 * de la hoja "OCT 2026". Se usa tanto para:
 *   1) Importar un archivo .xlsx respetando esa estructura (parser.js), y
 *   2) Pintar el detalle y el comprobante de pago (VOLANTE).
 *
 * Cada columna define:
 *   key      -> nombre de campo que se guarda en Firebase
 *   letter   -> letra de columna esperada (referencia)
 *   header   -> encabezado tal cual aparece en la hoja
 *   group    -> agrupación lógica para la interfaz
 *   type     -> number | text | id
 *   aliases  -> otros encabezados aceptados (tolerante a variaciones)
 */

export const GROUP = {
  BASICO: "Datos del empleado",
  DEVENGOS: "Devengos",
  HORAS: "Horas extra y recargos",
  NOVEDADES: "Novedades / ausencias",
  DEDUCCIONES: "Deducciones",
  PRESTACIONES: "Prestaciones y aportes",
  TOTALES: "Totales",
};

export const COLUMNS = [
  { key: "no",                          letter: "A",  header: "NO.",                              group: GROUP.BASICO,       type: "text" },
  { key: "notas",                       letter: "B",  header: "NOTAS",                            group: GROUP.BASICO,       type: "text" },
  { key: "cedula",                      letter: "C",  header: "CÉDULA",                           group: GROUP.BASICO,       type: "id", aliases: ["CEDULA", "IDENTIFICACION", "C.C.", "CC"] },
  { key: "empleado",                    letter: "D",  header: "EMPLEADO",                         group: GROUP.BASICO,       type: "text", aliases: ["NOMBRE", "NOMBRE EMPLEADO", "NOMBRES"] },
  { key: "cargo",                       letter: "E",  header: "CARGOS",                           group: GROUP.BASICO,       type: "text", aliases: ["CARGO"] },
  { key: "sBasico",                     letter: "F",  header: "S. BÁSICO",                        group: GROUP.BASICO,       type: "number", aliases: ["S. BASICO", "SALARIO BASICO", "SUELDO BASICO", "SALARIO"] },
  { key: "rodamiento",                  letter: "G",  header: "RODAMIENTO",                       group: GROUP.DEVENGOS,     type: "number" },
  { key: "dLab",                        letter: "H",  header: "D. LAB",                           group: GROUP.BASICO,       type: "number", aliases: ["DIAS LAB", "DIAS LABORADOS", "D. LABORADOS", "DIAS"] },
  { key: "sDevengado",                  letter: "I",  header: "S. DEVENGADO",                     group: GROUP.DEVENGOS,     type: "number", aliases: ["SALARIO DEVENGADO"] },
  { key: "auxTransp",                   letter: "J",  header: "AUX. TRANSP",                      group: GROUP.DEVENGOS,     type: "number", aliases: ["AUXILIO DE TRANSPORTE", "AUX TRANSPORTE", "AUXILIO TRANSPORTE"] },
  { key: "horasRecargoNocturno",        letter: "K",  header: "HORAS RECARGO NOCTURNO",           group: GROUP.HORAS,        type: "number" },
  { key: "valorRecargoNocturno",        letter: "L",  header: "VALOR RECARGO NOCTURNO",           group: GROUP.HORAS,        type: "number" },
  { key: "horasExtrasDiurnas",          letter: "M",  header: "HORAS EXTRAS DIURNAS",             group: GROUP.HORAS,        type: "number" },
  { key: "valorHorasExtrasDiurnas",     letter: "N",  header: "VALOR HORAS EXTRAS DIURNAS",       group: GROUP.HORAS,        type: "number" },
  { key: "horasExtrasNocturnas",        letter: "O",  header: "HORAS EXTRAS NOCTURNAS",           group: GROUP.HORAS,        type: "number" },
  { key: "valorHorasExtrasNocturnas",   letter: "P",  header: "VALOR HORAS EXTRAS NOCTURNAS",     group: GROUP.HORAS,        type: "number" },
  { key: "horasDominicalOcasional",     letter: "Q",  header: "HORAS DOMINICAL OCASIONAL",        group: GROUP.HORAS,        type: "number" },
  { key: "valorDominicalOcasional",     letter: "R",  header: "VALOR DOMINICAL OCASIONAL",        group: GROUP.HORAS,        type: "number" },
  { key: "horasRecargoNocturnoFestivo", letter: "S",  header: "HORAS RECARGO NOCTURNO FESTIVO",   group: GROUP.HORAS,        type: "number" },
  { key: "valorRecargoNocturnoFestivo", letter: "T",  header: "VALOR RECARGO NOCTURNO FESTIVO",   group: GROUP.HORAS,        type: "number" },
  { key: "horasFestivoDiurno",          letter: "U",  header: "HORAS FESTIVO DIURNO",             group: GROUP.HORAS,        type: "number" },
  { key: "valorFestivoDiurno",          letter: "V",  header: "VALOR FESTIVO DIURNO",             group: GROUP.HORAS,        type: "number" },
  { key: "horasExtrasDiurnasFestivas",  letter: "W",  header: "HORAS EXTRAS DIURNAS FESTIVAS",    group: GROUP.HORAS,        type: "number" },
  { key: "valorHorasExtrasDiurnasFestivas", letter: "X", header: "VALOR HORAS EXTRAS DIURNAS FESTIVAS", group: GROUP.HORAS,  type: "number" },
  { key: "horasExtrasNocturnasFestivas", letter: "Y", header: "HORAS EXTRAS NOCTURNAS FESTIVAS",  group: GROUP.HORAS,        type: "number" },
  { key: "valorHorasExtrasNocturnasFestivas", letter: "Z", header: "VALOR HORAS EXTRAS NOCTURNAS FESTIVAS", group: GROUP.HORAS, type: "number" },
  { key: "comisiones",                  letter: "AA", header: "COMISIONES",                       group: GROUP.DEVENGOS,     type: "number", aliases: ["COMISION"] },
  { key: "auxiliosRodamiento",          letter: "AB", header: "AUXILIOS DE RODAMIENTO",           group: GROUP.DEVENGOS,     type: "number", aliases: ["AUXILIO DE RODAMIENTO", "AUX. RODAMIENTO"] },
  { key: "base",                        letter: "AC", header: "BASE",                            group: GROUP.DEVENGOS,     type: "number" },
  { key: "retroactivo",                 letter: "AD", header: "RETROACTIVO",                     group: GROUP.DEVENGOS,     type: "number" },
  { key: "diasIncEG",                   letter: "AE", header: "DIAS INC. EG",                     group: GROUP.NOVEDADES,    type: "number", aliases: ["DIAS INC EG", "DIAS INCAPACIDAD GENERAL"] },
  { key: "ibcMesAnterior",              letter: "AF", header: "IBC MES ANTERIOR",                 group: GROUP.NOVEDADES,    type: "number" },
  { key: "diasIncapacidadAsumidaEmpresa", letter: "AG", header: "DIAS INCAPACIDAD ASUMIDA EMPRESA", group: GROUP.NOVEDADES,  type: "number" },
  { key: "incapacidadAsumidaEmpresa",   letter: "AH", header: "INCAPACIDAD ASUMIDA EMPRESA",      group: GROUP.DEVENGOS,     type: "number" },
  { key: "diasIncapacidadCobrarEps",    letter: "AI", header: "DIAS INCAPACIDAD A COBRAR EPS",    group: GROUP.NOVEDADES,    type: "number" },
  { key: "incapacidadCobrarEps",        letter: "AJ", header: "INCAPACIDAD A COBRAR EPS",         group: GROUP.DEVENGOS,     type: "number" },
  { key: "diasIncapacidadAt",           letter: "AK", header: "DIAS INCAPACIDAD AT",              group: GROUP.NOVEDADES,    type: "number" },
  { key: "incapacidadAt",               letter: "AL", header: "INCAPACIDAD AT",                   group: GROUP.DEVENGOS,     type: "number" },
  { key: "diasDf",                      letter: "AM", header: "DIAS DF",                         group: GROUP.NOVEDADES,    type: "number" },
  { key: "diaDeLaFamilia",              letter: "AN", header: "DIA DE LA FAMILIA",                group: GROUP.DEVENGOS,     type: "number" },
  { key: "diasLicenciaLuto",            letter: "AO", header: "DIAS LICENCIA LUTO",               group: GROUP.NOVEDADES,    type: "number" },
  { key: "licenciaLuto",                letter: "AP", header: "LICENCIA LUTO",                    group: GROUP.DEVENGOS,     type: "number" },
  { key: "diasPr",                      letter: "AQ", header: "DIAS PR",                          group: GROUP.NOVEDADES,    type: "number" },
  { key: "permisoRemunerado",           letter: "AR", header: "PERMISO REMUNERADO",               group: GROUP.DEVENGOS,     type: "number" },
  { key: "diasPermisoNoRemunerado",     letter: "AS", header: "DIAS PERMISO NO REMUNERADO",       group: GROUP.NOVEDADES,    type: "number" },
  { key: "diasAusenciaSinPermiso",      letter: "AT", header: "DIAS AUSENCIA SIN PERMISO",        group: GROUP.NOVEDADES,    type: "number" },
  { key: "diasDomingoPorAsp",           letter: "AU", header: "DIAS DOMINGO POR ASP",             group: GROUP.NOVEDADES,    type: "number" },
  { key: "diasVac",                     letter: "AV", header: "DIAS VAC",                         group: GROUP.NOVEDADES,    type: "number" },
  { key: "salarioBaseVacaciones",       letter: "AW", header: "SALARIO BASE VACACIONES",          group: GROUP.DEVENGOS,     type: "number" },
  { key: "vacaciones",                  letter: "AX", header: "VACACIONES",                       group: GROUP.DEVENGOS,     type: "number" },
  { key: "bonificacionSalarial",        letter: "AY", header: "BONIFICACION SALARIAL",            group: GROUP.DEVENGOS,     type: "number" },
  { key: "bonificacionNoSalarial",      letter: "AZ", header: "BONIFICACION NO SALARIAL",         group: GROUP.DEVENGOS,     type: "number" },
  { key: "totalDevengos",               letter: "BA", header: "TOTAL DEVENGOS",                  group: GROUP.TOTALES,      type: "number" },
  { key: "ibcSaludPensionCorte",        letter: "BB", header: "IBC SALUD Y PENSION DEL CORTE",   group: GROUP.PRESTACIONES, type: "number" },
  { key: "salud4",                      letter: "BC", header: "SALUD 4%",                        group: GROUP.DEDUCCIONES,  type: "number", aliases: ["SALUD", "APORTE EPS", "EPS 4%"] },
  { key: "pension4",                    letter: "BD", header: "PENSIÓN 4%",                      group: GROUP.DEDUCCIONES,  type: "number", aliases: ["PENSION 4%", "PENSION", "APORTE PENSION"] },
  { key: "libranzas",                   letter: "BE", header: "LIBRANZAS",                       group: GROUP.DEDUCCIONES,  type: "number", aliases: ["LIBRANZA"] },
  { key: "segurosExequiales",           letter: "BF", header: "SEGUROS EXEQUIALES",               group: GROUP.DEDUCCIONES,  type: "number", aliases: ["SEGURO EXEQUIAL"] },
  { key: "retefuente",                  letter: "BG", header: "RETEFUENTE",                      group: GROUP.DEDUCCIONES,  type: "number", aliases: ["RETENCION EN LA FUENTE"] },
  { key: "fsp",                         letter: "BH", header: "FONDO SOLIDARIDAD PENSIONAL",     group: GROUP.DEDUCCIONES,  type: "number", aliases: ["FONDO DE SOLIDARIDAD PENSIONAL", "FSP", "SOLIDARIDAD"] },
  { key: "embargos",                    letter: "BI", header: "EMBARGOS",                        group: GROUP.DEDUCCIONES,  type: "number", aliases: ["EMBARGO"] },
  { key: "descuentosAutorizados",       letter: "BJ", header: "DESCUENTOS AUTORIZADOS",           group: GROUP.DEDUCCIONES,  type: "number", aliases: ["DESCUENTO AUTORIZADO", "DESC. AUTORIZADOS"] },
  { key: "otrosDescuentos",             letter: "BK", header: "OTROS DESCUENTOS",                 group: GROUP.DEDUCCIONES,  type: "number" },
  { key: "tDeducciones",                letter: "BL", header: "T. DEDUCCIONES",                  group: GROUP.TOTALES,      type: "number", aliases: ["TOTAL DEDUCCIONES"] },
  { key: "netoPagarQuincena",           letter: "BM", header: "NETO A PAGAR QUINCENA",            group: GROUP.TOTALES,      type: "number", aliases: ["NETO QUINCENA", "NETO A PAGAR"] },
  { key: "ibc",                         letter: "BN", header: "IBC",                             group: GROUP.PRESTACIONES, type: "number" },
  { key: "basePs",                      letter: "BO", header: "BASE PS",                         group: GROUP.PRESTACIONES, type: "number" },
  { key: "cesantias",                   letter: "BP", header: "CESANTIAS",                       group: GROUP.PRESTACIONES, type: "number", aliases: ["CESANTÍAS"] },
  { key: "intereses",                   letter: "BQ", header: "INTERESES",                      group: GROUP.PRESTACIONES, type: "number" },
  { key: "primas",                      letter: "BR", header: "PRIMAS",                         group: GROUP.PRESTACIONES, type: "number" },
  { key: "vacacionesPrestacion",        letter: "BS", header: "VACACIONES",                      group: GROUP.PRESTACIONES, type: "number" },
  { key: "eps",                         letter: "BT", header: "EPS",                             group: GROUP.PRESTACIONES, type: "number" },
  { key: "afp",                         letter: "BU", header: "AFP",                             group: GROUP.PRESTACIONES, type: "number" },
  { key: "arl",                         letter: "BV", header: "ARL",                             group: GROUP.PRESTACIONES, type: "number" },
  { key: "caja",                        letter: "BW", header: "CAJA",                            group: GROUP.PRESTACIONES, type: "number" },
  { key: "icbf",                        letter: "BX", header: "ICBF",                            group: GROUP.PRESTACIONES, type: "number" },
  { key: "sena",                        letter: "BY", header: "SENA",                            group: GROUP.PRESTACIONES, type: "number" },
  { key: "total",                       letter: "BZ", header: "TOTAL",                           group: GROUP.PRESTACIONES, type: "number" },
  { key: "totalAPagar",                 letter: "CA", header: "TOTAL A PAGAR",                   group: GROUP.TOTALES,      type: "number" },
];

/** claves numéricas (para conversión al importar) */
export const NUMERIC_KEYS = new Set(COLUMNS.filter(c => c.type === "number").map(c => c.key));

/** normaliza un encabezado: mayúsculas, sin tildes, sin signos, espacios simples */
export function normHeader(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[.,%]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Encabezado "canónico" de cada columna + alias, ya normalizados. */
export function columnAliases(col) {
  return [col.header, ...(col.aliases || [])].map(normHeader);
}
