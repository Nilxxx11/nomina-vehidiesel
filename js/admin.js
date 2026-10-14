/**
 * Panel de administración: carga el .xlsx y publica la nómina en Firebase.
 * Acceso restringido a usuarios con admins/{uid} = true.
 */
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { DB_PATHS } from "./config.js";
import { toast, humanError, escapeHtml, periodKey, num, money } from "./utils.js";
import { leerWorkbook, hojaAOA, hojaSugerida, construirRegistros, xlsxDisponible } from "./parser.js";

const $ = (s) => document.querySelector(s);
let wb = null;
let parsed = null;

/* ---------- guard de administrador ---------- */
$("#btn-logout").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.replace("index.html"); return; }
  let esAdmin = false;
  try { esAdmin = (await get(ref(db, `${DB_PATHS.admins}/${user.uid}`))).exists(); } catch {}
  if (!esAdmin) {
    $("#guard").innerHTML = '<span class="big">🚫</span><p>No tienes permisos de administrador. ' +
      'Solicita acceso a Recursos Humanos.</p>';
    return;
  }
  $("#guard").classList.add("hidden");
  $("#admin-content").classList.remove("hidden");
  await cargarPeriodos();
});

/* ---------- archivo ---------- */
if (!xlsxDisponible()) toast("No se pudo cargar la librería de Excel.", "warn", 6000);

const drop = $("#drop");
drop.addEventListener("click", () => $("#file-xlsx").click());
["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", e => { const f = e.dataTransfer.files?.[0]; if (f) procesarArchivo(f); });
$("#file-xlsx").addEventListener("change", e => { const f = e.target.files?.[0]; if (f) procesarArchivo(f); });

async function procesarArchivo(file) {
  if (!/\.(xlsx|xls)$/i.test(file.name)) return toast("El archivo debe ser .xlsx o .xls", "warn");
  $("#file-name").textContent = file.name;
  try {
    wb = await leerWorkbook(file);
    const sel = $("#sel-hoja");
    sel.innerHTML = (wb.SheetNames || []).map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
    sel.value = hojaSugerida(wb);
    sel.disabled = false;

    const nombre = file.name.replace(/\.(xlsx|xls)$/i, "");
    if (!$("#periodo-nombre").value) $("#periodo-nombre").value = limpiarNombrePeriodo(nombre);

    await analizar();
  } catch (err) {
    console.error(err);
    toast("No se pudo leer el archivo: " + (err.message || err), "error");
  }
}

function limpiarNombrePeriodo(nombre) {
  const k = periodKey(nombre);
  if (/^\d{4}-\d{2}$/.test(k)) {
    const [y, m] = k.split("-");
    const meses = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
    return `${meses[parseInt(m, 10) - 1]} ${y}`;
  }
  return nombre.toUpperCase();
}

$("#sel-hoja").addEventListener("change", analizar);
$("#btn-analizar").addEventListener("click", analizar);

async function analizar() {
  if (!wb) return;
  try {
    const aoa = hojaAOA(wb, $("#sel-hoja").value);
    parsed = construirRegistros(aoa);
    renderPreview(parsed);
    $("#btn-cargar").disabled = parsed.records.length === 0;
    toast(`Se detectaron ${parsed.records.length} empleados (modo ${parsed.meta.modo}).`, "ok");
  } catch (err) {
    console.error(err);
    parsed = null;
    $("#btn-cargar").disabled = true;
    $("#panel-preview").classList.add("hidden");
    toast(err.message || "Error al analizar.", "error");
  }
}

/* ---------- previsualización ---------- */
function renderPreview({ records, meta }) {
  $("#panel-preview").classList.remove("hidden");
  $("#preview-meta").textContent =
    `${records.length} empleados · ${meta.columnasReconocidas}/${meta.totalColumnas} columnas · fila encabezado ${meta.headerRow} · modo ${meta.modo}`;

  const cols = [
    ["cedula", "Cédula"], ["empleado", "Empleado"], ["cargo", "Cargo"],
    ["sBasico", "Salario"], ["sDevengado", "Ingreso base"], ["auxTransp", "Aux. transp."],
    ["totalDevengos", "Total devengado"], ["tDeducciones", "Deducciones"],
  ];
  const rows = records.slice(0, 50).map(r => `<tr>${cols.map(([k]) => {
    const v = r[k];
    const isNum = typeof v === "number";
    return `<td class="${isNum ? "r" : ""}">${escapeHtml(isNum && k !== "cedula" ? money(v) : v)}</td>`;
  }).join("")}</tr>`).join("");

  $("#tabla-preview").innerHTML =
    `<thead><tr>${cols.map(([, h]) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody>`;
}

/* ---------- cargar a Firebase ---------- */
$("#btn-cargar").addEventListener("click", cargar);

async function cargar() {
  if (!parsed || !parsed.records.length) return;
  const nombre = $("#periodo-nombre").value.trim();
  if (!nombre) return toast("Escribe la etiqueta del periodo (ej: OCTUBRE 2026).", "warn");

  const key = periodKey(nombre);
  const btn = $("#btn-cargar");
  btn.disabled = true; btn.textContent = "Subiendo…";
  try {
    const nominaMap = {};
    const empMap = {};
    for (const r of parsed.records) {
      nominaMap[r.cedula] = r;
      empMap[r.cedula] = { cedula: r.cedula, nombre: r.empleado, cargo: r.cargo || "" };
    }

    await set(ref(db, `${DB_PATHS.nominas}/${key}`), nominaMap);
    await set(ref(db, `${DB_PATHS.periodos}/${key}`), {
      nombre,
      key,
      fechaPago: $("#periodo-fecha").value || "",
      creadoEn: Date.now(),
      totalEmpleados: parsed.records.length,
      hoja: $("#sel-hoja").value,
    });
    for (const ced of Object.keys(empMap)) {
      await set(ref(db, `${DB_PATHS.empleados}/${ced}`), empMap[ced]);
    }

    toast(`Periodo ${nombre} cargado con ${parsed.records.length} empleados.`, "ok");
    await cargarPeriodos();
  } catch (err) {
    console.error(err);
    toast("Error al subir: " + humanError(err), "error");
  } finally {
    btn.disabled = false; btn.textContent = "Cargar a Firebase";
  }
}

/* ---------- periodos cargados ---------- */
$("#btn-refresh").addEventListener("click", cargarPeriodos);

async function cargarPeriodos() {
  const snap = await get(ref(db, DB_PATHS.periodos));
  const data = snap.val() || {};
  const keys = Object.keys(data).sort((a, b) => b.localeCompare(a));

  if (!keys.length) {
    $("#tabla-periodos").innerHTML = `<tbody><tr><td class="muted center">No hay periodos cargados.</td></tr></tbody>`;
    return;
  }
  const rows = keys.map(k => {
    const p = data[k];
    const fecha = p.creadoEn ? new Date(p.creadoEn).toLocaleString("es-CO") : "—";
    return `<tr>
      <td><b>${escapeHtml(p.nombre || k)}</b><br><span class="muted">${escapeHtml(k)}</span></td>
      <td class="r">${num(p.totalEmpleados)}</td>
      <td>${escapeHtml(p.fechaPago || "—")}</td>
      <td class="muted">${escapeHtml(fecha)}</td>
      <td class="r"><button class="btn danger sm" data-del="${escapeHtml(k)}">Eliminar</button></td>
    </tr>`;
  }).join("");

  $("#tabla-periodos").innerHTML =
    `<thead><tr><th>Periodo</th><th class="r">Empleados</th><th>Fecha pago</th><th>Cargado</th><th></th></tr></thead>
     <tbody>${rows}</tbody>`;

  $("#tabla-periodos").querySelectorAll("[data-del]").forEach(b =>
    b.addEventListener("click", () => eliminarPeriodo(b.dataset.del)));
}

async function eliminarPeriodo(key) {
  if (!confirm(`¿Eliminar el periodo "${key}" y todos sus comprobantes? Esta acción no se puede deshacer.`)) return;
  try {
    await remove(ref(db, `${DB_PATHS.nominas}/${key}`));
    await remove(ref(db, `${DB_PATHS.periodos}/${key}`));
    toast("Periodo eliminado.", "ok");
    await cargarPeriodos();
  } catch (err) {
    toast("Error al eliminar: " + humanError(err), "error");
  }
}
