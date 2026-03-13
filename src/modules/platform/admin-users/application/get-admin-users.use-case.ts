import type { AdminUserRepository } from "../domain/admin-user.repository";
import type { AdminUser } from "../domain/admin-user.entity";

export class GetAdminUsersUseCase {
  constructor(private readonly repo: AdminUserRepository) {}

  async execute(): Promise<AdminUser[]> {
    return this.repo.findAll();
  }
}
