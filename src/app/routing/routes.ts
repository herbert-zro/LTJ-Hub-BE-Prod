import { Router } from "express";
import { PlatformRoutes } from "../../modules/platform/platform.routes";
import { TenantRoutes } from "../../modules/tenant/tenant.routes";
import { SystemRoutes } from "./system.routes";

export class AppRoutes {
  static routes(): Router {
    const router = Router();

    router.use(SystemRoutes.routes());
    router.use("/api/platform", PlatformRoutes.routes());
    router.use("/api/tenant", TenantRoutes.routes());

    return router;
  }
}
