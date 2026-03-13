import { Router } from "express";
import { AdminUsersController } from "./interfaces/http/admin-users.controller";
import { GetAdminUsersUseCase } from "./application/get-admin-users.use-case";
import { AdminUserPrismaRepository } from "./infrastructure/admin-user.prisma-repository";

export class AdminUsersRoutes {
  static routes(): Router {
    const router = Router();

    const repo = new AdminUserPrismaRepository();
    const getAdminUsers = new GetAdminUsersUseCase(repo);
    const controller = new AdminUsersController(getAdminUsers);

    router.get("/", controller.getAll);
    router.get("/:id", controller.getById);

    return router;
  }
}
