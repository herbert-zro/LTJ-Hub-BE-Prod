# Módulo `platform/admin-users` — Guía detallada

Este documento explica cómo está implementado el módulo `admin-users` dentro del slice `platform`,
siguiendo Clean Architecture y el patrón de monolito modular del proyecto.

Sirve como **plantilla de referencia** para implementar cualquier otro módulo.

---

## Estructura de carpetas

```
src/modules/platform/admin-users/
  domain/
    admin-user.entity.ts            ← qué es un AdminUser para el negocio
    admin-user.repository.ts        ← contrato del repositorio (interfaz/puerto)
  application/
    get-admin-users.use-case.ts     ← lógica de caso de uso
  infrastructure/
    admin-user.prisma-repository.ts ← implementación concreta con Prisma
  interfaces/
    http/
      admin-users.controller.ts     ← manejo de request/response HTTP
      admin-users.validator.ts      ← validación de entrada
  routes.ts                         ← ensamblado y registro de rutas
```

---

## Por qué esta estructura

Clean Architecture establece que las dependencias deben apuntar hacia adentro:

```
HTTP request
    │
    ▼
interfaces/http     (Express)
    │ depende de
    ▼
application         (use cases)
    │ depende de
    ▼
domain              (entidades + puertos)
    ▲
    │ implementado por
infrastructure      (Prisma, APIs externas, etc.)
```

Esto garantiza que:

- `domain` nunca sabe que existe Express ni Prisma.
- `application` nunca sabe cómo se almacena la data.
- `infrastructure` es reemplazable sin tocar negocio.
- `interfaces/http` es reemplazable (si mañana usas GraphQL o gRPC).

---

## Capa 1 — `domain/`

### `admin-user.entity.ts`

Define **qué es un AdminUser** para el sistema, sin dependencias externas.

```ts
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  userType: string;
  status: boolean; // true = activo, false = inactivo (viene de tinyint(1) en DB)
  companyId: number | null;
  roleId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}
```

**Por qué `interface` y no `class`:**

- Una entidad de dominio no necesita lógica de construcción en este caso.
- Si el dominio creciera (por ejemplo, necesitas validar si un usuario puede activarse),
  se convierte en `class` con métodos de dominio propios.

**Por qué `status: boolean` y no `number`:**

- La DB almacena `tinyint(1)`.
- El mapper en infrastructure convierte `0/1` a `false/true`.
- El dominio trabaja con semántica clara, sin saber cómo lo guarda la DB.

---

### `admin-user.repository.ts`

Define el **contrato** (puerto) que el dominio exige para acceder a datos.
No sabe si la implementación usa Prisma, una API REST u otro origen.

```ts
import type { AdminUser } from "./admin-user.entity";

export interface AdminUserRepository {
  findAll(): Promise<AdminUser[]>;
  findById(id: number): Promise<AdminUser | null>;
}
```

**Puntos clave:**

- Es solo una `interface`: cero implementación aquí.
- Devuelve `AdminUser` (entidad de dominio), nunca modelos de Prisma.
- `findById` devuelve `AdminUser | null` en lugar de lanzar excepción,
  porque "no encontrado" no es un error excepcional sino un resultado válido.

**Ejemplo de cómo crecería este contrato:**

```ts
export interface AdminUserRepository {
  findAll(): Promise<AdminUser[]>;
  findById(id: number): Promise<AdminUser | null>;
  findByEmail(email: string): Promise<AdminUser | null>; // ← nuevo método
  save(user: AdminUser): Promise<AdminUser>; // ← para crear/actualizar
  deactivate(id: number): Promise<void>; // ← acción de dominio
}
```

---

## Capa 2 — `application/`

### `get-admin-users.use-case.ts`

Contiene **un solo caso de uso** por archivo. Orquesta la lógica de negocio
usando el repositorio (puerto) sin conocer la implementación concreta.

```ts
import type { AdminUserRepository } from "../domain/admin-user.repository";
import type { AdminUser } from "../domain/admin-user.entity";

export class GetAdminUsersUseCase {
  constructor(private readonly repo: AdminUserRepository) {}

  async execute(): Promise<AdminUser[]> {
    return this.repo.findAll();
  }
}
```

**Por qué recibe el repositorio por constructor (inyección de dependencias):**

- El use case no instancia el repositorio por sí mismo.
- Esto permite reemplazar la implementación en tests:
  ```ts
  // En un test:
  const fakeRepo = { findAll: async () => [mockUser] };
  const useCase = new GetAdminUsersUseCase(fakeRepo);
  const result = await useCase.execute();
  // → sin tocar DB real
  ```

**Ejemplo de un use case más completo (para referencia futura):**

```ts
export class ActivateAdminUserUseCase {
  constructor(private readonly repo: AdminUserRepository) {}

  async execute(id: number): Promise<void> {
    const user = await this.repo.findById(id);

    if (!user) {
      throw new NotFoundError(`AdminUser ${id} not found`);
    }

    if (user.status === true) {
      throw new BusinessRuleError("User is already active");
    }

    await this.repo.save({ ...user, status: true });
  }
}
```

Nota: los errores `NotFoundError` y `BusinessRuleError` se definirían en `shared/domain/errors/`.

---

## Capa 3 — `infrastructure/`

### `admin-user.prisma-repository.ts`

**Implementa** el contrato `AdminUserRepository` usando Prisma.
Esta es la única capa que conoce cómo se almacena la data.

```ts
import type { AdminUserRepository } from "../domain/admin-user.repository";
import type { AdminUser } from "../domain/admin-user.entity";

// TODO: inject PrismaClient via constructor once Prisma is configured
export class AdminUserPrismaRepository implements AdminUserRepository {
  async findAll(): Promise<AdminUser[]> {
    throw new Error("Not implemented — wire PrismaClient first");
  }

  async findById(_id: number): Promise<AdminUser | null> {
    throw new Error("Not implemented — wire PrismaClient first");
  }
}
```

**Cómo quedará una vez Prisma esté configurado:**

```ts
import type { PrismaClient } from "@prisma/client";
import type { AdminUserRepository } from "../domain/admin-user.repository";
import type { AdminUser } from "../domain/admin-user.entity";

export class AdminUserPrismaRepository implements AdminUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<AdminUser[]> {
    const rows = await this.prisma.eva_admin_users.findMany({
      where: { status: 1 },
    });
    return rows.map(this.toEntity);
  }

  async findById(id: number): Promise<AdminUser | null> {
    const row = await this.prisma.eva_admin_users.findUnique({
      where: { id },
    });
    return row ? this.toEntity(row) : null;
  }

  // Mapper: transforma modelo Prisma → entidad de dominio
  private toEntity(row: any): AdminUser {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      userType: row.user_type,
      status: row.status === 1, // tinyint(1) → boolean
      companyId: row.company_id,
      roleId: row.role_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
```

**Por qué existe el mapper `toEntity`:**

- Prisma devuelve modelos que reflejan exactamente las columnas de la DB (snake_case, tipos primitivos).
- La entidad de dominio tiene nombres semánticos (camelCase, tipos limpios como `boolean`).
- Si mañana cambia el nombre de la columna en DB, solo cambia el mapper, no el dominio.

---

## Capa 4 — `interfaces/http/`

### `admin-users.validator.ts`

Valida la entrada HTTP **antes** de que llegue al controller.
Si la validación falla, lanza un error con `statusCode: 400`.

```ts
export function validateGetByIdParams(id: unknown): number {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw Object.assign(new Error("Invalid id param"), { statusCode: 400 });
  }
  return parsed;
}
```

**Por qué valida aquí y no en el use case:**

- Los use cases trabajan con datos ya válidos (DTOs limpios).
- La validación de formato HTTP (tipos, rangos, requeridos) pertenece a la capa de entrada.
- El middleware global de error capturará el `statusCode: 400` y responderá correctamente.

**Ejemplo de validación de body (para referencia):**

```ts
export interface CreateAdminUserDto {
  name: string;
  email: string;
  userType: string;
}

export function validateCreateBody(body: unknown): CreateAdminUserDto {
  if (typeof body !== "object" || body === null) {
    throw Object.assign(new Error("Body is required"), { statusCode: 400 });
  }

  const { name, email, userType } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim() === "") {
    throw Object.assign(new Error("name is required"), { statusCode: 422 });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    throw Object.assign(new Error("email is invalid"), { statusCode: 422 });
  }
  if (typeof userType !== "string") {
    throw Object.assign(new Error("userType is required"), { statusCode: 422 });
  }

  return { name: name.trim(), email: email.trim(), userType };
}
```

---

### `admin-users.controller.ts`

Orquesta el ciclo HTTP: recibe request → valida → invoca use case → responde.

```ts
import type { Request, Response, NextFunction } from "express";
import type { GetAdminUsersUseCase } from "../../application/get-admin-users.use-case";
import { validateGetByIdParams } from "./admin-users.validator";

export class AdminUsersController {
  constructor(private readonly getAdminUsers: GetAdminUsersUseCase) {}

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.getAdminUsers.execute();
      res.status(200).json({ data: users });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = validateGetByIdParams(req.params["id"]);
      res.status(200).json({ data: { id } }); // replace with use case call
    } catch (error) {
      next(error);
    }
  };
}
```

**Por qué los métodos son arrow functions (`getAll = async () =>`) y no métodos normales:**

```ts
// ❌ Problema con método normal:
router.get("/", controller.getAll);
// Al pasar la referencia, `this` se pierde → error en runtime

// ✅ Arrow function como propiedad de clase:
getAll = async (_req, res, next) => { ... }
// `this` siempre apunta a la instancia del controller
```

**Por qué `next(error)` y no `res.status(500).json(...)`:**

- El proyecto tendrá un middleware global de error en `app/errors/`.
- Ese middleware centraliza el mapeo de errores a responses HTTP.
- El controller delega, no maneja directamente.
- Esto garantiza respuestas consistentes en toda la API.

**Formato de respuesta estándar:**

```ts
// Éxito con datos
res.status(200).json({ data: users });

// Éxito sin cuerpo (por ejemplo DELETE)
res.status(204).send();

// Los errores los maneja el middleware global, no el controller
```

---

## Punto de ensamblado — `routes.ts`

Este archivo es el único lugar donde se instancian y conectan todas las dependencias del módulo.

```ts
import { Router } from "express";
import { AdminUsersController } from "./interfaces/http/admin-users.controller";
import { GetAdminUsersUseCase } from "./application/get-admin-users.use-case";
import { AdminUserPrismaRepository } from "./infrastructure/admin-user.prisma-repository";

export class AdminUsersRoutes {
  static routes(): Router {
    const router = Router();

    // 1. Crear implementación concreta del repositorio
    const repo = new AdminUserPrismaRepository();

    // 2. Crear use cases inyectando el repositorio
    const getAdminUsers = new GetAdminUsersUseCase(repo);

    // 3. Crear controller inyectando los use cases que necesita
    const controller = new AdminUsersController(getAdminUsers);

    // 4. Registrar rutas apuntando a métodos del controller
    router.get("/", controller.getAll);
    router.get("/:id", controller.getById);

    return router;
  }
}
```

**Flujo completo de una request `GET /api/platform/admin-users`:**

```
Request HTTP
    │
    ▼
AppRoutes.routes()                  →  app/routing/routes.ts
    │  router.use("/api/platform", ...)
    ▼
PlatformRoutes.routes()             →  platform/platform.routes.ts
    │  router.use("/admin-users", ...)
    ▼
AdminUsersRoutes.routes()           →  admin-users/routes.ts
    │  router.get("/", controller.getAll)
    ▼
AdminUsersController.getAll()       →  interfaces/http/admin-users.controller.ts
    │  getAdminUsers.execute()
    ▼
GetAdminUsersUseCase.execute()      →  application/get-admin-users.use-case.ts
    │  repo.findAll()
    ▼
AdminUserPrismaRepository.findAll() →  infrastructure/admin-user.prisma-repository.ts
    │  prisma.eva_admin_users.findMany(...)
    ▼
DB MySQL (Azure)
    │
    ▼  (respuesta sube de vuelta por el mismo camino)
res.status(200).json({ data: users })
```

---

## Resumen de reglas por capa

| Capa               | Puede importar                   | No puede importar                      |
| ------------------ | -------------------------------- | -------------------------------------- |
| `domain/`          | Solo TypeScript nativo           | Prisma, Express, cualquier lib externa |
| `application/`     | `domain/`                        | Prisma, Express, `infrastructure/`     |
| `infrastructure/`  | `domain/`, Prisma                | Express, `application/`                |
| `interfaces/http/` | `application/`, `domain/` (DTOs) | Prisma directamente                    |
| `routes.ts`        | Todas las capas del módulo       | Otros módulos por dentro               |

---

## Cómo replicar este módulo para otros

1. Copiar la estructura de `admin-users/`.
2. Reemplazar `AdminUser` con la entidad del nuevo módulo.
3. Definir los contratos del repositorio.
4. Implementar los use cases necesarios.
5. Adaptar el controller y el validator.
6. Registrar el router en `platform.routes.ts` o `tenant.routes.ts` según corresponda.

No es necesario tocar ningún archivo fuera del directorio del módulo nuevo.
