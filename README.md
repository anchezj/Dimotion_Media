# Dimotion

Monorepo inicial para el MVP de Dimotion Media, una agencia de publicidad y producción audiovisual. Angular y Express se mantienen como aplicaciones independientes dentro de un solo repositorio Git. PostgreSQL, Auth y las migraciones usan Supabase como servicio externo.

## Estructura

```text
frontend/                 Angular standalone, rutas públicas y portales
  src/app/core/            Auth, guards y servicios globales
  src/app/shared/          Componentes reutilizables
  src/app/layout/          Navegación y estructura general
  src/app/features/        public, auth, client, campaign-tracking,
                           admin, brands, packages y models
backend/                  API Express + TypeScript
  src/config/              Variables de entorno y cliente Supabase
  src/middleware/          Auth, roles, validación y errores
  src/modules/             Campañas, marcas, paquetes, modelos,
                           perfiles y reservas (preparado)
  src/routes/              Registro central de rutas
```

La navegación pública no requiere sesión. Las rutas del cliente y de administración están protegidas por sesión de Supabase y los roles `cliente` / `admin` de `usuarios`. Esas guardas mejoran la navegación, pero la autorización real de datos vive en RLS y debe mantenerse también en el backend.

## Requisitos

- Node.js 20.19 o superior (el scaffold se generó con Angular 22).
- npm.
- Proyecto Supabase propio para habilitar Auth y las rutas autenticadas.
- Figma para los diseños; los enlaces y archivos de diseño se administran por separado.

## Instalación y ejecución

Desde la raíz:

```bash
npm run install:all
```

Para iniciar Angular y Express juntos en una terminal:

```bash
npm run dev
```

Angular queda disponible normalmente en `http://localhost:4200`; Express escucha en `http://localhost:3000`. La comprobación pública de salud es `GET http://localhost:3000/api/health`. También se puede ejecutar `npm run build` desde la raíz para compilar ambas aplicaciones.

Si prefieres iniciarlos por separado, usa `npm run frontend` y `npm run backend` desde la raíz. Cada aplicación mantiene sus propias dependencias y configuración; no se importan módulos Angular desde Express ni módulos Express desde Angular.

## Configuración manual

1. Edita `backend/.env` (archivo local, ignorado por Git). Debe tener `PORT`, `FRONTEND_ORIGIN`, `SUPABASE_URL` y la clave pública/publishable de Supabase. La clave pública del navegador es la única que necesita esta aplicación. No configures ni expongas la clave `service_role`/secret.
2. Angular CLI no carga `.env` automáticamente. Configura la misma URL y clave pública en `frontend/src/environments/environment.ts` (`supabaseUrl` y `supabaseAnonKey`) para que el navegador pueda usar Supabase Auth. La clave pública está diseñada para usarse en el frontend; la seguridad de los datos depende de RLS.
3. Usa el único archivo SQL `supabase/setup.sql` en el SQL Editor. Es idempotente: crea o completa `clientes`, `usuarios`, `campanas` e `campana_etapas_historial` sin duplicarlas; configura roles, políticas RLS y triggers. No ejecutes archivos SQL antiguos ni borres tablas: las cuatro tablas forman parte del panel.
4. Un cliente solicita su cuenta con nombre de cliente, nombre, usuario, correo y contraseña; Supabase Auth guarda la contraseña y envía el correo de confirmación. Una vez confirmado, activa su usuario y cliente. Para el primer administrador, crea una cuenta en Supabase Auth, asigna `nombre_usuario` y ejecuta desde SQL Editor: `update public.usuarios set rol = 'admin', is_active = true where correo_electronico = 'correo-del-admin';`. Tanto administradores como clientes inician sesión con el correo completo y la contraseña. El correo se normaliza a minúsculas antes de autenticar.
5. Revisa el estado con `select nombre_usuario, correo_electronico, rol, is_active, cliente_id from public.usuarios order by created_at;` y `select id, nombre_cliente, correo_contacto, is_active, campanas_cerradas from public.clientes order by nombre_cliente;`.

Sin URL y clave pública de Supabase, el inicio de sesión y los datos no están disponibles. Los paneles obtienen clientes y campañas desde Express/Supabase; crear y actualizar campañas, etapas, estados, observaciones y clientes persiste en la base y las políticas RLS limitan cada operación.

## Datos y seguridad

- `usuarios.id` referencia `auth.users.id`; las contraseñas se gestionan exclusivamente en Supabase Auth y no se guardan en tablas propias.
- `usuarios.rol` admite `cliente` y `admin`; los usuarios nuevos empiezan como clientes inactivos y solo un administrador puede activar perfiles o cambiar roles.
- `usuarios.cliente_id` enlaza al usuario con `clientes.id`; los inicios de sesión usan el correo completo y Supabase Auth compara el correo sin distinguir mayúsculas/minúsculas.
- `campanas` guarda el cliente, título, fecha, hora, etapa, estado y observaciones que muestran los paneles. `campana_etapas_historial` conserva los cambios de etapa automáticamente.
- Los clientes solo pueden consultar sus propios datos y campañas activas asociadas; solo administración puede gestionar todos los clientes y modificar etapas/estados. Las operaciones del panel pasan por Express con el token de sesión y RLS aplica el acceso en la base.
- Los clientes/campañas de demostración anteriores se retiraron del frontend; el servicio elimina del navegador los datos locales antiguos y carga el contenido desde Supabase.
- Los paquetes activos son legibles públicamente; los modelos y operaciones administrativas están restringidos.
- Fotografías y videos no se almacenan en PostgreSQL en este MVP. Si se requiere alojarlos, se debe evaluar Supabase Storage con políticas propias.

## Diseño

Usa Figma para los flujos, wireframes y sistema visual de Dimotion. No se incluye un archivo ni una URL de Figma porque no se proporcionaron credenciales o un diseño existente.