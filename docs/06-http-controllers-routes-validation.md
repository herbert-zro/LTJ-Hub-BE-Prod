# 06 — HTTP (Express): Controllers, Routes, Validación y errores

## 1. Objetivo

Conectar HTTP con use cases sin introducir lógica de negocio en Express.

---

## 2. Convención de endpoints

- `/platform/*` administración global
- `/tenant/*` operación por company efectiva

Esto reduce ambigüedad en autorización.

---

## 3. Controllers

Responsabilidad:

- parsear request (params/body/query)
- validar input (schema)
- construir command/query DTO de use case
- invocar use case
- mapear output a HTTP response

No debe:

- llamar Prisma
- construir queries DB
- decidir reglas de negocio

Ejemplo (esqueleto):

```ts
export async function activateCompanyController(req, res) {
  const ctx = req.accessContext;
  const command = { companyId: req.params.id };

  const result = await activateCompanyUseCase.execute(ctx, command);
  res.status(200).json(result);
}
```

---

## 4. Validación

Recomendación:

- Validar en `interfaces/http/validators`.
- Usar una librería consistente (zod/yup/joi).
- Fail fast con errores 400/422.

---

## 5. Error handling global

- Un middleware final:
  - captura errores
  - mapea errores application/domain a HTTP codes
  - incluye `requestId`
  - evita exponer stacktrace en prod

---

## 6. Middlewares recomendados

Global:

- `requestId`
- `requestLogger`
- `jsonBody`
- `auth` (construye AccessContext)
- `errorHandler`

Por rutas:

- `requirePlatform`
- `requireTenant`

---

## 7. Paginación y filtros (convención)

Definir estándar:

- `page`, `pageSize`
- `sort`, `order`
- filtros: `filter[name]=x`

Controllers no generan query Prisma; pasan un DTO neutral al use case/query service.

---

## 8. Tipado Express

- Extender `Request` para incluir `accessContext`.
- Evitar `any`.
