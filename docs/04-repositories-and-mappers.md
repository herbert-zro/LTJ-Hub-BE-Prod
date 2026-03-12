# 04 — Repositories, Ports/Adapters y Mappers

## 1. Objetivo

Implementar persistencia con Prisma sin filtrar detalles DB hacia el dominio o application.

---

## 2. Repository Pattern en Clean

### 2.1 Definición

- En `application/ports/repositories` se definen interfaces:
  - `CompanyRepository`
  - `UserRepository`
  - `MembershipRepository`
  - etc.

### 2.2 Implementación

- En `infrastructure/repositories` se implementan usando Prisma:
  - `PrismaCompanyRepository`
  - etc.

---

## 3. Qué retorna un repositorio

Regla:

- Los repositorios retornan **entidades de dominio** o DTOs internos del caso de uso.
- Evitar retornar modelos Prisma.

---

## 4. Mappers: responsabilidad

- Mapear DB shape a dominio:
  - snake_case → camelCase
  - status tinyint → boolean/enum
  - timestamps: Date
- Aplicar compatibilidad legacy:
  - campos duplicados o ambiguos se normalizan aquí

---

## 5. Queries complejas (Reports/Dashboard)

Para consultas muy agregadas:

- no forces el dominio
- crea `QueryService` (infra) que retorna “read models” (DTOs de lectura)

Ejemplo conceptual:

```ts
export interface ReportsQueryService {
  getCompanyDashboard(
    companyId: CompanyId,
    input: DashboardQuery,
  ): Promise<DashboardReadModel>;
}
```

---

## 6. Multi-tenancy en repositorios

Regla:

- Todo repositorio tenant debe requerir `companyId` y filtrar.

Ejemplo conceptual:

```ts
findCandidates(companyId, filters);
```

Nunca:

- `findCandidates(filters)` sin companyId

---

## 7. Errores de persistencia

- Los repositorios pueden lanzar errores infra (`DatabaseError`) o mapear a errores application.
- No exponer errores Prisma crudos al controller.

---

## 8. Tests de repositorios

- Integration tests contra DB (o test containers).
- Validar:
  - filtros por company
  - status handling
  - consistencia al faltar FKs (si aplica)
