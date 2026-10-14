/**
 * Configuración global de la aplicación.
 *
 * 1) Reemplaza los valores de FIREBASE_CONFIG con los de tu proyecto:
 *    Consola de Firebase -> Configuración del proyecto -> Tus apps -> Web.
 * 2) Ajusta COMPANY con los datos que aparecerán en el comprobante.
 *
 * Los datos de la app web de Firebase NO son secretos (son públicos por diseño),
 * la seguridad real se controla con las reglas en database.rules.json.
 */

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCPu4rPHWu08NhtFEcy2AlCzoY8VsDu8ks",
  authDomain: "sistematicv2.firebaseapp.com",
  databaseURL: "https://sistematicv2-default-rtdb.firebaseio.com",
  projectId: "sistematicv2",
  storageBucket: "sistematicv2.firebasestorage.app",
  messagingSenderId: "606439518001",
  appId: "1:606439518001:web:e9e47ba2880cd3748eca10"
};

export const COMPANY = {
  nombre: "VEHIDIESEL S.A.S.",
  nit: "890.113.554-3",
  correo: "rrhh@vehidiesel.com.co",
  copia: "gerenciaadministrativa@vehidiesel.com.co",
};

/** Ruta raíz en la base de datos en tiempo real. */
export const DB_PATHS = {
  usuarios: "usuarios",
  admins: "admins",
  periodos: "periodos",
  nominas: "nominas",
  empleados: "empleados",
};
