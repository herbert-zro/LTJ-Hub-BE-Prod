# 03 — Seguridad: Auth, AccessContext, permisos e impersonación (Opción B)

## 1. Objetivo

Implementar seguridad coherente desde el inicio:

- scopes: `platform` vs `tenant`
- roles centralizados
- membership como fuente de verdad tenant
- impersonación para soporte interno
- estado de impersonación guardado en **sesión server-side (Opción B)**

---

## 2. Roles del sistema (contrato funcional)

- Plataforma:
  - `super-admin`
  - `admin`
- Tenant:
  - `empresa-admin`
  - `operador`

Roles viven en `eva_admin_roles` y permissions en `eva_admin_permissions`.

---

## 3. AccessContext (modelo conceptual)

Cada request debe producir un `AccessContext` que viajará hasta use cases.

### 3.1 Modos

- `PLATFORM`
- `TENANT_MEMBER` (usuario cliente con membership activa)
- `TENANT_IMPERSONATION` (super-admin/admin impersonando company)

### 3.2 Resolución tenant

**Regla fija:**

- Para `TENANT_MEMBER`:
  - debe existir `eva_company_user(status=1)` para `(user_id, effectiveCompanyId)`
- Para `TENANT_IMPERSONATION`:
  - NO se requiere membership
  - los permisos tenant se derivan del rol plataforma (support permission set)

---

## 4. Impersonación — Opción B (sesión server-side)

## 4.1 ¿Por qué Opción B?

Guardar `impersonatedCompanyId` en servidor (Redis/memoria) permite:

- revocación inmediata sin esperar expiración del token
- auditoría futura más simple (si se agrega)
- evitar que el cliente “forje” claims de impersonación

---

## 5. Diseño de sesión (recomendación)

### 5.1 Identificador de sesión

Al autenticar, emitir:

- `accessToken` (JWT corto) con `sessionId` (y `userId`)
- opcional: `refreshToken`

En servidor, mantener:

- `Session { sessionId, userId, impersonatedCompanyId?, createdAt, expiresAt }`

### 5.2 Storage

- Recomendado: Redis
- Alternativa temporal: memoria (no recomendado para producción multi-instancia)

---

## 6. Middlewares vs Policies (dónde se decide qué)

### 6.1 Middleware (Express)

Responsable de:

- autenticar token
- cargar user básico
- leer session server-side
- resolver `effectiveCompanyId`
- construir AccessContext

### 6.2 Policy en Application Layer (obligatorio)

Cada use case debe autorizar usando el AccessContext:

- evita dependencias en Express
- consistente para jobs/cron/colas

---

## 7. Permission naming convention (recomendado)

Para evitar confusión:

- `platform.companies.activate`
- `platform.users.activate`
- `platform.roles.create`
- `tenant.candidates.create`
- `tenant.processes.close`
- etc.

Aunque DB no tenga “scope”, el string lo expresa.

---

## 8. Logging de impersonación

Por ahora no se persiste en DB. Se loguea:

- start / stop
- actorUserId
- targetCompanyId
- requestId

Ejemplo conceptual:

```ts
logger.info({
  event: "impersonation.start",
  actorUserId,
  companyId,
  requestId,
});
```

---

## 9. Puntos de fallo comunes (y cómo evitarlos)

1. Permitir `/tenant/*` sin company efectiva:
   - middleware `requireTenantContext`
2. Confundir rol plataforma con rol tenant:
   - AccessContext separa `platformRole` y `tenantAuthorization`
3. Usar `eva_admin_users.company_id` como pertenencia:
   - prohibido por norma (legacy only)
