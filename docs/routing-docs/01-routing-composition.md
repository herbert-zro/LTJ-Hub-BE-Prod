# Routing Composition - Estado actual

## Objetivo del cambio

Separar la capa de routing en una arquitectura de composicion para evitar que `app/routing/routes.ts` se convierta en un lugar de negocio.

Principio aplicado:

- `app/routing` compone routers.
- Los modulos exponen sus routers por dominio.
- Las rutas transversales de sistema viven separadas.

---

## Cambios implementados

### 1) App router como composicion

Archivo:

- `src/app/routing/routes.ts`

Responsabilidad actual:

- Crear el router raiz.
- Montar rutas de sistema.
- Montar slices funcionales por prefijo:
  - `/api/platform`
  - `/api/tenant`

No contiene logica de negocio ni handlers de modulos.

### 2) Rutas de sistema separadas

Archivo:

- `src/app/routing/system.routes.ts`

Responsabilidad actual:

- Endpoints operativos/transversales:
  - `GET /`
  - `GET /health`

Esto evita mezclar health y root con endpoints de dominio.

### 3) Agregador de rutas Platform

Archivo:

- `src/modules/platform/platform.routes.ts`

Subrutas compuestas:

- `/auth`
- `/companies`
- `/admin-users`
- `/roles-permissions`
- `/settings`

Montaje final:

- `/api/platform/auth`
- `/api/platform/companies`
- `/api/platform/admin-users`
- `/api/platform/roles-permissions`
- `/api/platform/settings`

### 4) Agregador de rutas Tenant

Archivo:

- `src/modules/tenant/tenant.routes.ts`

Subrutas compuestas:

- `/memberships`
- `/candidates`
- `/processes`
- `/evaluations`
- `/assessment-content`
- `/templates`
- `/integrations`
- `/catalogs`
- `/reports`

Montaje final:

- `/api/tenant/memberships`
- `/api/tenant/candidates`
- `/api/tenant/processes`
- `/api/tenant/evaluations`
- `/api/tenant/assessment-content`
- `/api/tenant/templates`
- `/api/tenant/integrations`
- `/api/tenant/catalogs`
- `/api/tenant/reports`

### 5) Entrypoints por modulo

Se crearon entrypoints de rutas (stubs) para que cada modulo pueda crecer sin tocar la composicion central.

Platform:

- `src/modules/platform/auth/routes.ts`
- `src/modules/platform/companies/routes.ts`
- `src/modules/platform/admin-users/routes.ts`
- `src/modules/platform/roles-permissions/routes.ts`
- `src/modules/platform/settings/routes.ts`

Tenant:

- `src/modules/tenant/memberships/routes.ts`
- `src/modules/tenant/candidates/routes.ts`
- `src/modules/tenant/processes/routes.ts`
- `src/modules/tenant/evaluations/routes.ts`
- `src/modules/tenant/assesment-content/routes.ts`
- `src/modules/tenant/templates/routes.ts`
- `src/modules/tenant/integrations/routes.ts`
- `src/modules/tenant/catalogs/routes.ts`
- `src/modules/tenant/reports/routes.ts`

Cada archivo actualmente retorna `Router()` vacio como contrato inicial.

---

## Flujo de composicion resultante

1. `Server` monta `AppRoutes.routes()`.
2. `AppRoutes` monta:
   - `SystemRoutes`
   - `PlatformRoutes`
   - `TenantRoutes`
3. Cada agregador monta routers de modulo.
4. Cada modulo implementara sus handlers/controladores sin tocar el core del enrutamiento.

---

## Beneficios logrados

- Se evita router monolitico central.
- Se reduce acoplamiento entre modulos.
- Se habilita crecimiento incremental por vertical slices.
- Se alinea con el roadmap de monolito modular + Clean Architecture.

---

## Convencion para siguientes endpoints

Regla operativa:

- Nuevos endpoints de negocio se agregan en el `routes.ts` del modulo correspondiente.
- `src/app/routing/routes.ts` solo cambia cuando hay que montar un nuevo slice de alto nivel.

Ejemplo de extension:

- Si agregas `tenant/candidates`:
  - Implementar handlers y rutas dentro de `src/modules/tenant/candidates/`.
  - Mantener `src/app/routing/routes.ts` sin logica de negocio.

---

## Riesgos y notas tecnicas

- Existe inconsistencia de nombre de carpeta `assesment-content` (falta una "s" respecto a "assessment").
- La ruta expuesta usa `/assessment-content` y el import actual apunta a `./assesment-content`.
- Recomendacion: definir si se renombrara ahora o se mantendra por compatibilidad interna.

---

## Checklist de validacion

- `app/routing/routes.ts` no contiene handlers de dominio.
- `system.routes.ts` contiene solo rutas transversales.
- `platform.routes.ts` y `tenant.routes.ts` agregan routers de sus dominios.
- Cada modulo tiene entrypoint de rutas.
- El proyecto compila tras la refactorizacion.
