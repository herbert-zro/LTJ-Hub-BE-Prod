import { Request, Response, Router } from "express";

export class SystemRoutes {
  static routes(): Router {
    const router = Router();

    router.get("/", (_req: Request, res: Response) => {
      res.json({
        message: "LTJ Hub API",
        status: "ok",
      });
    });

    router.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({ status: "ok" });
    });

    return router;
  }
}
