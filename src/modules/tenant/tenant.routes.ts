import { Router } from "express";
import { AssessmentContentRoutes } from "./assesment-content/routes";
import { CandidatesRoutes } from "./candidates/routes";
import { CatalogsRoutes } from "./catalogs/routes";
import { EvaluationsRoutes } from "./evaluations/routes";
import { IntegrationsRoutes } from "./integrations/routes";
import { MembershipsRoutes } from "./memberships/routes";
import { ProcessesRoutes } from "./processes/routes";
import { ReportsRoutes } from "./reports/routes";
import { TemplatesRoutes } from "./templates/routes";

export class TenantRoutes {
  static routes(): Router {
    const router = Router();

    router.use("/memberships", MembershipsRoutes.routes());
    router.use("/candidates", CandidatesRoutes.routes());
    router.use("/processes", ProcessesRoutes.routes());
    router.use("/evaluations", EvaluationsRoutes.routes());
    router.use("/assessment-content", AssessmentContentRoutes.routes());
    router.use("/templates", TemplatesRoutes.routes());
    router.use("/integrations", IntegrationsRoutes.routes());
    router.use("/catalogs", CatalogsRoutes.routes());
    router.use("/reports", ReportsRoutes.routes());

    return router;
  }
}
