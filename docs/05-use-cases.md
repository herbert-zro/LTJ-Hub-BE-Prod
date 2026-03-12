# 05 — Use Cases (Application Layer) y políticas

## 1. Objetivo

Los use cases son el corazón del sistema:

- orquestan repositorios
- aplican reglas de aplicación
- ejecutan políticas de autorización (con AccessContext)

---

## 2. Estructura recomendada

Dentro del módulo:

```txt
application/
  use-cases/
    <UseCaseName>/
      <UseCaseName>.ts
      dto.ts
      policy.ts
```

---

## 3. DTOs de use case (no HTTP DTO)

- Input DTO: `Command` o `Query`
- Output DTO: `Result`

Ejemplo:

```ts
export type ActivateCompanyCommand = {
  companyId: string;
};
```

---

## 4. Authorization en use cases

Cada use case debe recibir `AccessContext` (o `ActorContext`) y validar:

- Platform use cases:
  - requieren `mode=PLATFORM`
  - requieren permisos `platform.*`

- Tenant use cases:
  - requieren `mode=TENANT_MEMBER` o `TENANT_IMPERSONATION`
  - autorizan según:
    - membership role permissions (member)
    - support permission set (impersonation)

---

## 5. Ejemplos de use cases por módulo (derivado del DDL)

### Platform/Companies

- CreateCompany
- UpdateCompany
- ActivateCompany (status=1) — solo super-admin
- DeactivateCompany (status=0)
- SetCompanySetting
- EnableEvaluationForCompany

### Platform/Admin-Users

- CreateUser
- ActivateUser — solo super-admin
- DeactivateUser

### Tenant/Memberships

- AddUserToCompany
- ChangeMemberRole
- ActivateMembership
- DeactivateMembership

### Tenant/Candidates

- CreateCandidate
- UpdateCandidate
- AssignEvaluationToExternalCandidate

---

## 6. Orden recomendado de implementación de use cases

1. Policies y AccessContext contract
2. Companies + Users + Roles (platform)
3. Memberships (tenant entry point)
4. Core tenant: candidates/processes
5. Evaluations enablement
6. Scoring/results/templates/integrations/reports

---

## 7. Manejo de errores en application

- Errores de dominio: invariantes (ej. “CompanyAlreadyActive”)
- Errores de aplicación: autorización, precondiciones (Forbidden, NotFound, Conflict)
- No mezclar con HTTP status aquí; eso es presentation layer.
