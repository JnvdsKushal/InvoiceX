export type UserRole = "supplier" | "buyer" | "lender" | "admin";

export interface Organization {
  id: string;
  name: string;
  status: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  organization: Organization;
}

export interface LoginResponse {
  access: string;
  user: User;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  organizationName: string;
  organizationType: "MSME" | "BUYER" | "LENDER";
  password: string;
}