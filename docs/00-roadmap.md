# 00 — Roadmap de implementación (orden real)

Este roadmap está pensado para implementar un **monolito modular** en Node.js/Express/TypeScript usando **Clean Architecture**, con **Prisma (introspection)** sobre una DB existente (legacy), y con seguridad **platform vs tenant** + **impersonación Opción B (sesión server-side)**.

## Objetivo del roadmap

1. Evitar “big ball of mud” desde el día 1.
2. Construir primero la infraestructura transversal (config, errores, logger, seguridad).
3. Integrar Prisma sin contaminar dominio/aplicación.
4. Desarrollar funcionalidad por vertical slices (módulos) con boundaries claros.

---

## Fase 0 — Foundations (Día 1–3)

**Entregables**

- Estructura de carpetas objetivo (sin feature real).
- Express bootstrap (app, routing base).
- Middlewares globales: JSON, requestId, logger request, error handler.
- Configuración de entorno validada (fail-fast).
- Convenciones de respuesta HTTP (paginación, errores).

**Por qué primero**

- Todo lo demás depende de esto y es caro refactorizar luego.

---

## Fase 1 — Prisma + DB legacy (Día 3–7)

**Entregables**

- Prisma introspection (`db pull`) y `schema.prisma` generado.
- PrismaClient singleton en infraestructura.
- “DB constraints” a nivel aplicación (cuando falten FKs o haya inconsistencias).
- Primeros repositorios “thin” + mappers (sin casos de uso todavía).

**Por qué aquí**

- Necesitas “conocer” el shape real de datos para diseñar repositorios puertos/adaptadores correctamente.

---

## Fase 2 — Seguridad (Día 7–14)

**Entregables**

- Auth: login + token.
- Sesión server-side (Opción B) para impersonación.
- Construcción del `AccessContext` (platform/tenant member/tenant impersonation).
- Policies de autorización en Application Layer.

**Reglas cerradas**

- `status tinyint(1)` => activo/inactivo.
- Membership `eva_company_user` es fuente de verdad para acceso tenant (usuarios cliente).
- Super-admin/admin pueden acceder tenant por impersonación **sin membership** (Opción A).
- Estado de impersonación vive server-side (Opción B).

**Por qué aquí**

- Si no lo haces ahora, cada endpoint que agregues después será inseguro o inconsistente.

---

## Fase 3 — Módulos “core” (Día 14–45)

Implementación por módulos, empezando por lo que desbloquea el resto:

1. `platform/companies`
2. `platform/admin-users`
3. `platform/roles-permissions`
4. `tenant/memberships` (pivot company_user)
5. `tenant/candidates`
6. `tenant/processes`
7. `tenant/evaluations` (company_evaluation + catálogos)

**Por qué este orden**

- Companies → Users → Roles → Memberships establece el “sistema operativo” del tenant.

---

## Fase 4 — Módulos complejos (Día 45–75)

- `tenant/assessment-content` (preguntas, scoring, percentiles)
- `tenant/templates` (email templates)
- `tenant/integrations` (bot/WA)
- `tenant/reports` (read models / queries agregadas)

---

## Fase 5 — Producción (en paralelo durante todo el proyecto)

Checklist de producción:

- Health checks
- Timeout y graceful shutdown
- Rate limiting (si aplica)
- Observabilidad (logs JSON, requestId, niveles)
- Config secrets
- Migración/control del schema (si se decide)
- Tests (unit + integration) y pipeline CI

---

## “Definition of Done” por endpoint

- Validación de request
- Autorización (policy)
- Use case (application)
- Repo port + adapter (infra)
- Manejo de errores consistente
- Logs mínimos (sin PII)
- Tests mínimos
