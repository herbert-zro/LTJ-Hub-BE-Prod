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
