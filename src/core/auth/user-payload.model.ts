import { PermissionEnum } from "src/constants/permission.enum";

export type UserPayload = {
    id: number,
    email: string
    roleId: number
    permissions: PermissionEnum[]
    denormalizedRoleName?: string
}

export type RefreshTokenPayload = {
    id: number,
    email: string
}
