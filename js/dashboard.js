/**
 * Panel del empleado: elige periodo, ve el detalle y descarga su comprobante.
 */
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { DB_PATHS } from "./config.js";
import { money, num, initials, toast, humanError, escapeHtml, normCedula } from "./utils.js";
import { devengos, deducciones, totalDevengado, totalDeducciones, netoAPagar, comprobanteHTML, descargarComprobantePDF } from "./comprobante.js";

const $ = (s) => document.querySelector(s);
const state = { usuario: null, cedula: "", periodoKey: "", nomina: null, periodo: null };

/* ---------- sesión ---------- */
$("#btn-logout").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.replace("index.html"); return; }
  try {
    const snap = await get(ref(db, `${DB_PATHS.usuarios}/${user.uid}`));
    const u = snap.val() || {};
    state.usuario = u;
    state.cedula = u.cedula || "";
    $("#user-name").textContent = u.nombre || user.displayName || user.email || "Empleado";
    $("#user-cedula").textContent = state.cedula ? "C.C. " + state.cedula : "";
    $("#user-initials").textContent = initials(u.nombre || user.email || "?");

    const esAdmin = (await get(ref(db, `${DB_PATHS.admins}/${user.uid}`))).exists();
    if (esAdmin) $("#link-admin").classList.remove("hidden");

    if (!state.cedula) {
      mostrarCompletarPerfil();
      return;
    }
    await cargarPeriodos();
  } catch (err) {
    toast(humanError(err), "error");
    mostrarEstado("⚠️", "No se pudo cargar tu información.", false);
  }
});

/* ---------- periodos ---------- */
async function cargarPeriodos() {
  const snap = await get(ref(db, DB_PATHS.periodos));
  const data = snap.val() || {};
  const keys = Object.keys(data).sort((a, b) => b.localeCompare(a));
  const sel = $("#sel-periodo");

  if (!keys.length) {
    sel.innerHTML = '<option value="">Sin periodos</option>';
    mostrarEstado("📭", "Aún no hay periodos de nómina cargados.", false);
    return;
  }

  sel.innerHTML = keys.map(k =>
    `<option value="${escapeHtml(k)}">${escapeHtml(data[k].nombre || k)}</option>`).join("");
  sel.value = keys[0];
  await seleccionarPeriodo(keys[0]);
}

async function seleccionarPeriodo(key) {
  state.periodoKey = key;
  $("#detalle").classList.add("hidden");
  $("#btn-descargar").disabled = true;
  mostrarEstado("⏳", "Buscando tu comprobante…", true);

  const per = (await get(ref(db, `${DB_PATHS.periodos}/${key}`))).val() || {};
  state.periodo = { key, ...per };

  const snap = await get(ref(db, `${DB_PATHS.nominas}/${key}/${state.cedula}`));
  const n = snap.val();
  if (!n) {
    mostrarEstado("🔎", `No encontramos tu comprobante para el periodo ${escapeHtml(per.nombre || key)}. ` +
      `Verifica que tu cédula (${escapeHtml(state.cedula)}) esté registrada o contacta a Recursos Humanos.`, false);
    return;
  }
  state.nomina = n;
  renderDetalle(n, state.periodo);
}

$("#sel-periodo").addEventListener("change", (e) => seleccionarPeriodo(e.target.value));
$("#btn-ver-detalle").addEventListener("click", () => {
  $("#detalle").classList.remove("hidden");
  $("#detalle").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#btn-descargar").addEventListener("click", descargar);
$("#btn-descargar2").addEventListener("click", descargar);

async function descargar() {
  if (!state.nomina) return;
  try {
    toast("Generando PDF…", "info", 1800);
    const nodo = document.querySelector("#comprobante-preview > div");
    await descargarComprobantePDF(state.nomina, state.periodo, nodo || null);
  } catch (err) {
    console.error(err);
    toast("No se pudo generar el PDF.", "error");
  }
}

/* ---------- render ---------- */
function mostrarEstado(icono, mensaje, cargando) {
  const el = $("#estado");
  el.classList.remove("hidden");
  el.innerHTML = `<span class="big">${icono}</span><p>${mensaje}</p>`;
  if (!cargando) $("#detalle").classList.add("hidden");
}

/* ---------- completar cédula (cuentas antiguas) ---------- */
function mostrarCompletarPerfil() {
  const el = $("#estado");
  el.classList.remove("hidden");
  el.innerHTML = `
    <span class="big">🪪</span>
    <p>Necesitamos tu número de cédula para mostrarte tu comprobante.</p>
    <form id="form-cedula" style="max-width:360px;margin:16px auto 0;display:grid;gap:12px;">
      <label><span>Número de cédula</span>
        <input type="text" id="cedula-input" inputmode="numeric" required placeholder="Sin puntos ni espacios"></label>
      <button class="btn primary block" type="submit">Guardar y continuar</button>
    </form>`;
  document.getElementById("form-cedula").addEventListener("submit", async (e) => {
    e.preventDefault();
    const ced = normCedula(document.getElementById("cedula-input").value);
    if (ced.length < 5) return toast("Ingresa una cédula válida.", "warn");
    const btn = e.target.querySelector("button");
    btn.disabled = true; btn.textContent = "Guardando…";
    try {
      const user = auth.currentUser;
      const previo = state.usuario || {};
      await set(ref(db, `${DB_PATHS.usuarios}/${user.uid}`), {
        email: user.email || previo.email || "",
        nombre: previo.nombre || user.displayName || "",
        cedula: ced,
        creadoEn: previo.creadoEn || Date.now(),
      });
      state.usuario = { ...previo, cedula: ced };
      state.cedula = ced;
      $("#user-cedula").textContent = "C.C. " + ced;
      toast("Cédula guardada.", "ok");
      await cargarPeriodos();
    } catch (err) {
      toast(humanError(err), "error");
      btn.disabled = false; btn.textContent = "Guardar y continuar";
    }
  });
}

function renderDetalle(n, periodo) {
  $("#estado").classList.add("hidden");
  $("#detalle").classList.remove("hidden");
  $("#btn-descargar").disabled = false;

  const tDev = totalDevengado(n);
  const tDed = totalDeducciones(n);
  const neto = netoAPagar(n);

  $("#metrics").innerHTML = `
    ${metric("Empleado", escapeHtml(n.empleado), true)}
    ${metric("Cargo", escapeHtml(n.cargo || "—"), true)}
    ${metric("Periodo", escapeHtml(periodo.nombre || state.periodoKey), true)}
    ${metric("Salario básico", money(n.sBasico))}
    ${metric("Días laborados", num(n.dLab))}
    ${metric("Total devengado", money(tDev))}
    ${metric("Total deducciones", money(tDed))}
    ${metric("Neto a pagar", money(neto), false, true)}
  `;

  $("#tabla-devengos").innerHTML = `
    <thead><tr><th>Concepto</th><th class="r">Valor</th></tr></thead>
    <tbody>${devengos(n).map(d =>
      `<tr><td>${escapeHtml(d.label)}</td><td class="r">${money(d.valor)}</td></tr>`).join("") || filaVacia(2)}</tbody>
    <tfoot><tr><td class="r b">Total devengado</td><td class="r b">${money(tDev)}</td></tr></tfoot>`;

  $("#tabla-deducciones").innerHTML = `
    <thead><tr><th>Concepto</th><th class="r">Valor</th></tr></thead>
    <tbody>${deducciones(n).map(d =>
      `<tr><td>${escapeHtml(d.label)}</td><td class="r">${money(d.valor)}</td></tr>`).join("") || filaVacia(2)}</tbody>
    <tfoot><tr><td class="r b">Total deducciones</td><td class="r b">${money(tDed)}</td></tr></tfoot>`;

  $("#comprobante-preview").innerHTML = comprobanteHTML(n, {
    nombre: periodo.nombre, fechaPago: periodo.fechaPago,
  });

  $("#detalle").scrollIntoView({ behavior: "smooth", block: "start" });
}

function metric(label, value, small = false, highlight = false) {
  return `<div class="metric ${highlight ? "hl" : ""}">
    <div class="k">${escapeHtml(label)}</div>
    <div class="v ${small ? "sm" : ""}">${value}</div>
  </div>`;
}
function filaVacia(cols) {
  return `<tr><td colspan="${cols}" class="muted center">Sin movimientos</td></tr>`;
}
