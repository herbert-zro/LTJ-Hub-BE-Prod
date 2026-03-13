import { Router } from "express";
import { AdminUsersRoutes } from "./admin-users/routes";
import { AuthRoutes } from "./auth/routes";
import { CompaniesRoutes } from "./companies/routes";
import { RolesPermissionsRoutes } from "./roles-permissions/routes";
import { SettingsRoutes } from "./settings/routes";

export class PlatformRoutes {
  static routes(): Router {
    const router = Router();

    router.use("/auth", AuthRoutes.routes());
    router.use("/companies", CompaniesRoutes.routes());
    router.use("/admin-users", AdminUsersRoutes.routes());
    router.use("/roles-permissions", RolesPermissionsRoutes.routes());
    router.use("/settings", SettingsRoutes.routes());

    return router;
  }
}
