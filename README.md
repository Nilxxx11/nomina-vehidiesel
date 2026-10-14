# Nómina Vehidiesel

Aplicación web para que los empleados de **VEHIDIESEL S.A.S.** consulten y
descarguen su comprobante de pago (volante de nómina). Un administrador carga
el archivo mensual `.xlsx` y el sistema publica los comprobantes por periodo.

- **Frontend:** HTML + CSS + JavaScript (módulos ES, sin build).
- **Backend:** Firebase Authentication (correo/contraseña) + Realtime Database.
- **Excel:** [SheetJS](https://sheetjs.com) vía CDN.
- **PDF:** [`html2pdf.js`](https://ekoopmans.github.io/html2pdf.js/) (con respaldo a impresión del navegador).

## Estructura del proyecto

```
nomina-app/
├── index.html            # Acceso (login / registro)
├── dashboard.html        # Panel del empleado
├── admin.html            # Panel del administrador
├── css/styles.css        # Estilos
├── js/
│   ├── config.js         # Config de Firebase y datos de la empresa  ← EDITAR
│   ├── firebase.js       # Inicialización de Firebase
│   ├── utils.js          # Utilidades (moneda, fechas, avisos)
│   ├── schema.js         # Esquema de columnas de la hoja "OCT 2026" (A..CA)
│   ├── parser.js         # Lectura y mapeo del .xlsx
│   ├── comprobante.js    # Comprobante y generación de PDF
│   ├── auth.js           # Lógica de login/registro
│   ├── dashboard.js      # Lógica del panel del empleado
│   └── admin.js          # Lógica del panel del administrador
├── assets/logo_vehidiesel.png
├── database.rules.json   # Reglas de seguridad de Realtime Database
└── firebase.json         # Configuración de despliegue (hosting + reglas)
```

## Puesta en marcha

### 1. Crear el proyecto de Firebase
1. Entra a <https://console.firebase.google.com> y crea un proyecto.
2. **Authentication** → *Sign-in method* → habilita **Correo electrónico/contraseña**.
3. **Realtime Database** → crea la base de datos (modo bloqueado).
4. **Configuración del proyecto → Tus apps → Web**: registra una app y copia el
   objeto de configuración.

### 2. Configurar la app
Edita `js/config.js` y reemplaza los valores de `FIREBASE_CONFIG` con los de tu
proyecto. Ajusta `COMPANY` si cambian los datos de la empresa.

### 3. Publicar las reglas de seguridad
Copia el contenido de `database.rules.json` en **Realtime Database → Reglas**, o
con la CLI de Firebase:

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # selecciona tu proyecto
firebase deploy --only database
```

### 4. Crear el primer administrador
Las reglas solo dejan escribir `admins/` a quien ya sea admin. Para el primer
usuario, regístralo normalmente desde la web y luego, en la consola de Firebase:

- **Authentication** → copia el **UID** del usuario.
- **Realtime Database** → crea el nodo: `admins/<UID> = true`.

A partir de ahí ese usuario verá el enlace **Administración** en su panel.

### 5. Desplegar (opcional)
```bash
firebase deploy --only hosting
```

En local puedes servirlo con cualquier servidor estático, por ejemplo:
`npx serve .` (no uses `file://`, los módulos ES lo requieren).

## Uso

### Empleado
1. Entra a `index.html` y **regístrate** con su nombre, **número de cédula**,
   correo y contraseña.
2. En su panel elige el **periodo** y descarga su **comprobante en PDF**.

La cédula registrada debe **coincidir** con la del archivo de nómina para que
pueda ver su comprobante (así lo garantizan las reglas de seguridad).

### Administrador
1. En `admin.html` sube el libro `.xlsx` mensual.
2. Elige la hoja (por defecto **OCT 2026**), escribe la etiqueta del periodo
   (p. ej. `OCTUBRE 2026`) y la fecha de pago.
3. Revisa la **previsualización** y pulsa **Cargar a Firebase**.
4. Puede **eliminar** periodos desde la lista inferior.

## Estructura de datos (Realtime Database)

```
usuarios/{uid}         → { email, nombre, cedula, creadoEn }
admins/{uid}           → true
periodos/{YYYY-MM}     → { nombre, fechaPago, creadoEn, totalEmpleados, hoja }
nominas/{YYYY-MM}/{cedula} → { ...todos los rubros del empleado... }
empleados/{cedula}     → { cedula, nombre, cargo }
```

## Notas sobre el archivo de Excel

- La hoja usada es **OCT 2026** (o la primera disponible). El encabezado está en
  la **fila 6** y los datos desde la **fila 7**.
- Las columnas se mapean por **nombre** (según `js/schema.js`). Si el encabezado
  no se reconoce, se usa el **mapeo posicional** A..CA.
- El encabezado **"VACACIONES"** aparece dos veces (devengo y prestación); se
  distinguen por **posición**.
- Los valores con error (`#REF!`, `#N/A`) se tratan como `0`.

## Seguridad

- Cada empleado solo puede leer **su** fila de nómina (validado por cédula).
- Solo los administradores pueden escribir periodos y nóminas.
- Los datos de configuración web de Firebase no son secretos; la protección real
  está en `database.rules.json`.
