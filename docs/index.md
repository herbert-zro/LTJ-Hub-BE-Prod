# LTJ Hub BE – Documentation Index

> Ordenado según el orden real de implementación (de infraestructura base → seguridad → persistencia → casos de uso → HTTP → DI → observabilidad).

1. [00-roadmap.md](00-roadmap.md) — Roadmap de implementación y prioridades
2. [01-architecture.md](01-architecture.md) — Arquitectura objetivo (Modular Monolith + Clean)
3. [02-prisma-introspection-and-db.md](02-prisma-introspection-and-db.md) — Prisma con introspection y reglas DB-legacy
4. [03-security-auth-impersonation.md](03-security-auth-impersonation.md) — Auth, AccessContext, permisos e impersonación (Opción B)
5. [04-repositories-and-mappers.md](04-repositories-and-mappers.md) — Repositorios, mappers y anti-corruption layer
6. [05-use-cases.md](05-use-cases.md) — Use Cases (Application Layer) y políticas
7. [06-http-controllers-routes-validation.md](06-http-controllers-routes-validation.md) — Express: controllers, routes, validación, errores HTTP
8. [07-dependency-injection.md](07-dependency-injection.md) — Composition Root / DI sin framework pesado
9. [08-observability-errors-config.md](08-observability-errors-config.md) — Logging, requestId, config, error handling, prácticas prod
