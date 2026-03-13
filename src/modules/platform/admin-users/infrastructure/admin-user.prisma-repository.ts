import type { AdminUserRepository } from "../domain/admin-user.repository";
import type { AdminUser } from "../domain/admin-user.entity";

// TODO: inject PrismaClient via constructor once Prisma is configured
export class AdminUserPrismaRepository implements AdminUserRepository {
  async findAll(): Promise<AdminUser[]> {
    throw new Error("Not implemented — wire PrismaClient first");
  }

  async findById(_id: number): Promise<AdminUser | null> {
    throw new Error("Not implemented — wire PrismaClient first");
  }
}
