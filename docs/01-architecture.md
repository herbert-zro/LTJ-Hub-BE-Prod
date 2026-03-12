# 01 — Arquitectura objetivo (Modular Monolith + Clean Architecture)

## 1. Visión general

Este backend se implementará como un **monolito modular** en Node.js + Express + TypeScript, aplicando **Clean Architecture** dentro de cada módulo para:

- Escalabilidad organizacional (muchos módulos / equipos)
- Mantenibilidad (reglas claras de dependencia)
- Evolución gradual (DB legacy hoy, refactor mañana)
- Facilidad de extracción futura (si algún módulo se convierte en servicio)

---

## 2. Principios obligatorios (contrato arquitectónico)

### 2.1 Reglas de dependencia (Clean)

- `domain` **no depende** de nada externo (ni Prisma, ni Express).
- `application` depende solo de:
  - `domain`
  - puertos (interfaces) declarados en `application`
- `infrastructure` implementa los puertos usando Prisma u otros proveedores.
- `interfaces/http` contiene Express (controllers/routes/middlewares) y depende de `application`.

### 2.2 Modular monolith (bounded contexts)

- Cada módulo tiene su propio `domain/application/infrastructure/interfaces`.
- Los módulos NO se importan “por dentro” entre sí.
- Si un módulo necesita algo de otro:
  - consume una interfaz/servicio expuesto por el módulo (API interna), o
  - usa eventos internos (opcional), o
  - usa repositorios del propio módulo y modelos de lectura (preferido para reportes).

---

## 3. Estructura de carpetas recomendada

```txt
src/
  app/
    server/
    routing/
    middlewares/
    logging/
    errors/
    composition-root/
  modules/
    platform/
      auth/
      companies/
      admin-users/
      roles-permissions/
      settings/
    tenant/
      memberships/
      candidates/
      processes/
      evaluations/
      assessment-content/
      templates/
      integrations/
      catalogs/
      reports/
  shared/
    domain/
    application/
    security/
    infrastructure/
    observability/
  prisma/
    schema.prisma
docs/
tests/
```

---

## 4. Plataforma vs Tenant (dos “slices” del monolito)

### 4.1 Platform

Operación interna para soporte y administración global:

- gestión de companies
- activación/desactivación (status)
- gestión de usuarios
- roles/permisos
- impersonación

### 4.2 Tenant

Operación dentro de una empresa:

- memberships (company_user) – fuente de verdad del acceso tenant
- candidatos, procesos, evaluaciones, plantillas, integraciones

---

## 5. Contratos de datos (derivados del DDL)

### 5.1 status

`tinyint(1)` => `0` inactivo / `1` activo.

### 5.2 Membership es fuente de verdad

El acceso tenant se determina por `eva_company_user(status=1)` para `(company_id, user_id)`.
`eva_admin_users.company_id` se considera legacy (no autoritativo para autorización).

### 5.3 Roles centralizados

`eva_admin_roles` es el catálogo central de roles; se usa para:

- rol plataforma (desde `eva_admin_users.role_id`)
- rol tenant (desde `eva_company_user.role_id`)

La distinción de scope se hace por **política**, no por DB (por ahora).

---

## 6. Diseño de “public API” por módulo

Cada módulo debe exponer un `index.ts` (interno al monolito) que registre:

- router HTTP del módulo (si aplica)
- bindings DI del módulo (ports → adapters)

Esto evita imports arbitrarios y mantiene el boundary.
