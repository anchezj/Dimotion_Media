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

La navegación pública no requiere sesión. Las rutas del cliente y de administración están protegidas por sesión de Supabase y rol de perfil (`client` / `admin`). Esas guardas mejoran la navegación, pero la autorización real de datos vive en RLS y debe mantenerse también en el backend.

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

En dos terminales, desde la raíz:

```bash
npm run frontend
```

```bash
npm run backend
```

Angular queda disponible normalmente en `http://localhost:4200`; Express escucha en `http://localhost:3000`. La comprobación pública de salud es `GET http://localhost:3000/api/health`. También se puede ejecutar `npm run build` desde la raíz para compilar ambas aplicaciones.

## Configuración manual

1. Copia `backend/.env.example` a `backend/.env` y define `PORT`, `SUPABASE_URL` y `SUPABASE_ANON_KEY`. No se necesita una clave `service_role` y nunca debe enviarse al navegador.
2. Copia `frontend/.env.example` como referencia y configura `supabaseUrl` y `supabaseAnonKey` en `frontend/src/environments/environment.ts`. La clave anon/pública es la única clave Supabase que debe aparecer en el frontend; la seguridad depende de RLS.
3. Define y aplica las migraciones SQL en tu proyecto Supabase con Supabase CLI o el SQL Editor; este repositorio no incluye migraciones. No hay conexión remota configurada.
4. Configura la creación de perfiles en Supabase y asígnales el rol `admin` desde un entorno administrativo de confianza; nunca permitas que un usuario cambie su propio rol. Las solicitudes de `/solicitar-cuenta` envían un enlace de verificación con Supabase Auth y guardan el nombre de cliente y solicitante en los metadatos del usuario. La aplicación no crea perfiles ni aprueba solicitudes automáticamente: un administrador debe habilitar el perfil y asignar el rol desde un entorno de confianza.

Sin credenciales, el frontend habilita dos cuentas de demostración locales para probar el flujo: `cliente@dimotion.test` / `Cliente123!` y `admin@dimotion.test` / `Admin123!`. No se necesita URL de Supabase para este modo. Las credenciales están incluidas únicamente para desarrollo local; no son usuarios reales y este mecanismo no debe usarse en producción. Cuando se configuran las credenciales Supabase, el login vuelve a usar Supabase Auth.

Las pantallas de cliente (`/cliente`) y administración (`/admin/campanas`, `/admin/clientes`) incluyen un modo de demostración interactivo y persistido en el `localStorage` del navegador: el calendario agenda campañas y administración permite gestionar etapas, estados, observaciones y clientes. Estos cambios locales no se sincronizan entre navegadores ni con Supabase; las rutas backend de negocio siguen devolviendo `501 Not Implemented` hasta conectar las tablas y políticas RLS del proyecto.

## Datos y seguridad

- `profiles.id` referencia `auth.users.id`; no se guardan contraseñas.
- `brands.owner_profile_id` enlaza marcas con el perfil cliente y `campaigns.brand_id` restringe campañas por marca.
- `campaigns` referencia opcionalmente paquetes y modelos; el historial guarda cada estado inicial/cambio.
- Los estados son `payment_received`, `production`, `editing`, `delivery` y `completed`.
- Clientes pueden leer campañas e historial de sus marcas; solo administradores pueden insertar o cambiar campañas. El historial se registra con trigger.
- Los paquetes activos son legibles públicamente; los modelos y operaciones administrativas están restringidos.
- Fotografías y videos no se almacenan en PostgreSQL en este MVP. Si se requiere alojarlos, se debe evaluar Supabase Storage con políticas propias.

## Diseño

Usa Figma para los flujos, wireframes y sistema visual de Dimotion. No se incluye un archivo ni una URL de Figma porque no se proporcionaron credenciales o un diseño existente.