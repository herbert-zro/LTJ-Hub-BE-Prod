import type { AdminUser } from "./admin-user.entity";

export interface AdminUserRepository {
  findAll(): Promise<AdminUser[]>;
  findById(id: number): Promise<AdminUser | null>;
}
