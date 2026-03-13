export interface AdminUser {
  id: number;
  name: string;
  email: string;
  userType: string;
  status: boolean;
  companyId: number | null;
  roleId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}
