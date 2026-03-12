# 02 — Prisma (Introspection) + DB legacy: estrategia y guardrails

## 1. Objetivo

Integrar Prisma con una base existente (MySQL) **sin romper Clean Architecture** y soportando un esquema con inconsistencias.

---

## 2. Introspection: flujo recomendado

### 2.1 Comando base

- Ejecutar introspection para generar `schema.prisma` desde la DB:
  - `prisma db pull`

### 2.2 Fuente de verdad (fase actual)

- La DB es la fuente de verdad.
- `schema.prisma` es un reflejo (snapshot) del estado actual.

### 2.3 Control de cambios

Mientras el esquema esté “en reparación”, documentar cambios con ADRs.
Cuando estabilice, decidir si se pasa a `prisma migrate` como fuente de verdad.

---

## 3. Ubicación y ownership

### 3.1 `prisma/schema.prisma`

Debe vivir en:

- `./prisma/schema.prisma`

Razón:

- Es infraestructura transversal.
- No pertenece a un módulo de negocio.

---

## 4. PrismaClient como infraestructura transversal

### 4.1 Regla

- Nadie fuera de infraestructura importa `@prisma/client`.

### 4.2 Patrón recomendado

- Un singleton/factory en `src/shared/infrastructure/prisma/prisma-client.ts`
- Repositorios Prisma reciben el client por DI (inyección) en vez de instanciarlo.

Ejemplo (ilustrativo):

```ts
// src/shared/infrastructure/prisma/prisma-client.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  // log: ['query', 'error', 'warn'] // según entorno
});
```

---

## 5. Mappers: Prisma Model ↔ Dominio

### 5.1 Por qué necesitas mappers

- naming distinto (snake_case vs camelCase)
- columnas legacy que no quieres en dominio
- relaciones incompletas (faltan FKs)
- reglas de compatibilidad (fallback de campos)

### 5.2 Dónde viven

Dentro de cada módulo:

- `src/modules/<...>/infrastructure/persistence/prisma/mappers/*`

Ejemplo conceptual:

```ts
// CompanyMapper: PrismaCompany -> Company (domain)
```

---

## 6. Anti-corruption layer (ACL) para DB imperfecta

Cuando el DDL sea inconsistente:

- el repositorio Prisma se encarga de:
  - validar integridad que la DB no valida
  - aplicar defaults
  - transformar datos inconsistentes a un shape estable de dominio

**Importante:** no “parches” en controllers.

---

## 7. Transacciones

Prisma ofrece `$transaction`. En Clean:

- el boundary transaccional ideal se controla desde `application` (use case),
- pero la implementación es infra.

Patrón:

- `UnitOfWork` (port) opcional si quieres encapsular transacciones.

---

## 8. Qué NO hacer

- No usar tipos Prisma como DTO público (`Prisma.*WhereInput`).
- No filtrar/paginar construyendo queries Prisma en controllers.
- No retornar modelos Prisma como respuesta HTTP.
- No importar Prisma en `domain` o `application`.
