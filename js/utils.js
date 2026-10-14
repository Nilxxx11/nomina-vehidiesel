/**
 * Utilidades compartidas: formato de moneda/números, fechas, avisos, etc.
 */

const nf = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Devuelve "" si el valor es vacío; si no, número. Acepta "1.234,56" o "1,234.56". */
export function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let s = String(value).trim().replace(/\s/g, "").replace(/\$/g, "");
  // si tiene ambos separadores, el último es el decimal
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = /,\d{1,2}$/.test(s) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Moneda colombiana: $ 1.234.567 */
export function money(value) {
  const n = toNumber(value);
  return "$ " + nf.format(Math.round(n));
}

/** Moneda con centavos (para horas/días donde aplique). */
export function money2(value) {
  return "$ " + nf2.format(toNumber(value));
}

/** Número con separador de miles (sin $). */
export function num(value, decimals = 0) {
  const n = toNumber(value);
  return decimals ? nf2.format(n) : nf.format(n);
}

export function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Fecha (Date | timestamp | "YYYY-MM-DD" | serial Excel) -> Date|null */
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    // serial de Excel (base 1899-12-30)
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function fechaCorta(value) {
  const d = toDate(value);
  if (!d) return "—";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function fechaLarga(value) {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Construye una clave de período tipo "YYYY-MM" a partir de un texto
 * como "OCTUBRE 2026", "oct-2026", "10/2026". Si no lo logra, devuelve
 * el texto normalizado.
 */
const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};
export function periodKey(label) {
  const raw = String(label || "").toLowerCase();
  const year = (raw.match(/(20\d{2})/) || [])[1];
  let month = null;
  for (const [nombre, n] of Object.entries(MESES)) {
    if (raw.includes(nombre) || raw.includes(nombre.slice(0, 3))) { month = n; break; }
  }
  if (!month) {
    const m = raw.match(/\b(0?[1-9]|1[0-2])\b/);
    if (m && year) month = parseInt(m[1], 10);
  }
  if (month && year) return `${year}-${pad2(month)}`;
  return normSlug(label);
}

export function normSlug(text) {
  return String(text || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function normCedula(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Aviso flotante (toast). type: info | ok | warn | error */
export function toast(message, type = "info", ms = 3600) {
  let cont = document.getElementById("toast-cont");
  if (!cont) {
    cont = document.createElement("div");
    cont.id = "toast-cont";
    document.body.appendChild(cont);
  }
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  cont.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, ms);
}

export function humanError(err) {
  const code = err?.code || "";
  const map = {
    "auth/email-already-in-use": "Ese correo ya está registrado. Inicia sesión.",
    "auth/invalid-email": "El correo no es válido.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/user-not-found": "No existe una cuenta con ese correo.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
    "auth/network-request-failed": "Sin conexión. Revisa tu internet.",
  };
  return map[code] || err?.message || "Ocurrió un error inesperado.";
}
