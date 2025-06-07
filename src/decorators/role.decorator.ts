import { ROLE } from "../constants/role.enum";
import { SetMetadata } from "@nestjs/common";

export const ROLE_KEY = 'role';
export const Role = (role: ROLE) => SetMetadata(ROLE_KEY, role);
