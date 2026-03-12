# 08 — Observabilidad, Errores, Config y prácticas producción

## 1. Config (env) — fail fast

- Centralizar lectura de env en `src/config` o `src/shared`.
- Validar tipos y presencia al startup.
- No usar `process.env` en módulos.

Ejemplo (conceptual con zod):

```ts
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
});
```

---

## 2. Logging estructurado

- Logger JSON (pino/winston).
- Siempre incluir:
  - `requestId`
  - `actorUserId` (si existe)
  - `effectiveCompanyId` (si existe)
  - `mode` (PLATFORM / TENANT_MEMBER / TENANT_IMPERSONATION)

---

## 3. requestId

- Generar en middleware inicial.
- Propagar en logs y respuestas de error.

---

## 4. Errores

### 4.1 Tipos de errores

- DomainError: invariantes (no HTTP)
- ApplicationError: forbidden/notFound/conflict
- InfrastructureError: db down, timeouts
- HttpError: mapeo final (presentation)

### 4.2 Mapeo sugerido

- NotFound => 404
- Forbidden => 403
- Unauthorized => 401
- Conflict => 409
- Validation => 422 (o 400)
- Unexpected => 500

---

## 5. Seguridad operativa

- Helmet, CORS (según clientes)
- Rate limiting (especialmente login)
- Input size limits
- Sanitización de logs (no passwords, no tokens)

---

## 6. Graceful shutdown

- Capturar SIGTERM/SIGINT
- cerrar server
- cerrar PrismaClient
- cerrar Redis

---

## 7. Sesión server-side (Opción B) en producción

- Usar Redis para sesión.
- Rotación/revocación:
  - invalidar sessionId
  - logout elimina sesión

---

## 8. Testing strategy (mínimo)

- Unit: domain + use cases
- Integration: repositorios Prisma
- E2E: rutas críticas (auth, companies activation, memberships)

---

## 9. Checklist “Production readiness”

- Health endpoints:
  - `/health/live`
  - `/health/ready` (db + redis)
- Observabilidad ok
- Config validada
- Error handler seguro
- Logs consistentes
