# 07 — Dependency Injection (Composition Root)

## 1. Objetivo

Aplicar Dependency Inversion sin un contenedor complejo:

- use cases dependen de interfaces (ports)
- infraestructura provee adapters
- composition root hace wiring

---

## 2. Dónde vive el wiring

- `src/app/composition-root/container.ts`
  y por módulo:
- `src/modules/<module>/index.ts` registra bindings y router

---

## 3. Estrategia DI recomendada (simple y efectiva)

- Construir objetos manualmente (factory functions).
- Evitar service locator global.

Ejemplo conceptual:

```ts
const companyRepo: CompanyRepository = new PrismaCompanyRepository(prisma);
const activateCompanyUseCase = new ActivateCompany(
  companyRepo,
  authorizationService,
);
```

---

## 4. Módulos como “plugins internos”

Cada módulo expone:

- `register(container)` o `buildModule(deps)` (concepto)
- `router`

El `routes.ts` central monta:

- `app.use('/platform/companies', platformCompaniesRouter)`
- etc.

---

## 5. Testabilidad

- Use cases se testean con fakes/mocks de repositorios.
- Infra se testea con integración.
- Controllers se testean con supertest (e2e) o aislados.
