import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client";

type RequiredDatabaseEnv =
  | "DATABASE_HOST"
  | "DATABASE_PORT"
  | "DATABASE_USER"
  | "DATABASE_PASSWORD"
  | "DATABASE_NAME";

const REQUIRED_DATABASE_ENVS: RequiredDatabaseEnv[] = [
  "DATABASE_HOST",
  "DATABASE_PORT",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
  "DATABASE_NAME",
];

const getDatabaseConfig = () => {
  const missingEnvs = REQUIRED_DATABASE_ENVS.filter((envName) => {
    const value = process.env[envName];
    return !value || value.trim().length === 0;
  });

  if (missingEnvs.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missingEnvs.join(", ")}`,
    );
  }

  const port = Number.parseInt(process.env.DATABASE_PORT as string, 10);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(
      `DATABASE_PORT must be a valid positive number. Received: ${process.env.DATABASE_PORT}`,
    );
  }

  return {
    host: process.env.DATABASE_HOST as string,
    port,
    user: process.env.DATABASE_USER as string,
    password: process.env.DATABASE_PASSWORD as string,
    database: process.env.DATABASE_NAME as string,
  };
};

const databaseConfig = getDatabaseConfig();

// Centralized adapter initialization for all Prisma repositories.
const adapter = new PrismaMariaDb({
  host: databaseConfig.host,
  port: databaseConfig.port,
  user: databaseConfig.user,
  password: databaseConfig.password,
  database: databaseConfig.database,
  connectionLimit: 5,
});

type GlobalPrisma = typeof globalThis & {
  __prismaClient?: PrismaClient;
};

const globalPrisma = globalThis as GlobalPrisma;

// Reuse a single PrismaClient instance to avoid extra pools in dev/hot reload.
export const prisma =
  globalPrisma.__prismaClient ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalPrisma.__prismaClient = prisma;
}
