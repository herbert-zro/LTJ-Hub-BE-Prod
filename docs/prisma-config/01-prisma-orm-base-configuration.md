# Prisma ORM Base Configuration

## Objective

Leave Prisma ORM configured for a real project with an existing MySQL database in Azure, following Clean Architecture and without mixing infrastructure setup with business logic.

## Final Decisions

- Keep the Prisma schema in `src/prisma/schema.prisma`.
- Keep Prisma runtime config in `prisma.config.ts`.
- Use Prisma Client with the MariaDB driver adapter (`@prisma/adapter-mariadb`).
- Centralize database access in shared infrastructure.
- Avoid `prisma migrate dev --name init` because the database already exists.

## Implemented Structure

- Prisma schema: `src/prisma/schema.prisma`
- Prisma config: `prisma.config.ts`
- Prisma infrastructure entry point: `src/shared/infrastructure/database/prisma.ts`
- Generated Prisma Client: `src/shared/infrastructure/database/generated/prisma`

## What Was Implemented

1. **Schema location alignment**
   - `prisma.config.ts` points to `src/prisma/schema.prisma`.

2. **Prisma 7-compatible datasource handling**
   - Removed `url = env("DATABASE_URL")` from `datasource` in schema.
   - Connection URL is resolved from `prisma.config.ts`.

3. **Infrastructure-based Prisma client setup**
   - `src/shared/infrastructure/database/prisma.ts` does:
     - Loads env with `dotenv/config`.
     - Validates required variables:
       - `DATABASE_HOST`
       - `DATABASE_PORT`
       - `DATABASE_USER`
       - `DATABASE_PASSWORD`
       - `DATABASE_NAME`
     - Converts `DATABASE_PORT` to number with explicit validation.
     - Creates `PrismaMariaDb` adapter.
     - Creates and exports a singleton `PrismaClient` instance.

4. **Generated artifacts moved to infrastructure**
   - Prisma generator output changed to:
     - `../shared/infrastructure/database/generated/prisma`
   - Old `src/generated` location removed.

## Environment Variables

Required variables:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`

Optional for compatibility:

- `DATABASE_URL`

Notes:

- If password contains special characters (`%`, `?`, `#`, `@`, etc.), it must be URL encoded when manually building a URL.
- The implemented infrastructure setup avoids this issue by using separated env variables for host/user/password/database/port.

## Commands Used in This Setup

For this project on Windows PowerShell:

```powershell
npx prisma validate
npx prisma db pull
npx prisma generate
```

## Recommended Workflow for Existing Databases

1. `npx prisma db pull`
2. `npx prisma generate`

Do not run `prisma migrate dev --name init` unless Prisma Migrate adoption and migration baselining have been planned.

## Architecture Boundary

- This setup belongs to infrastructure only.
- No business rules in Prisma setup.
- Repositories should import the shared Prisma instance from:
  - `src/shared/infrastructure/database/prisma.ts`

## Status

Prisma ORM base configuration is complete and ready for repository integration.
