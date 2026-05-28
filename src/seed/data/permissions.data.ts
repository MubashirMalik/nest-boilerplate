import { PermissionEnum } from "src/constants/permission.enum";
import { ROLE } from "src/constants/role.enum";

export const PERMISSIONS_DATA = [
    {
        name: PermissionEnum.VIEW_USER,
        description: 'View user records',
        resource: 'user',
        roles: [ROLE.SUPER_ADMIN, ROLE.ADMIN],
    },
    {
        name: PermissionEnum.ADD_EDIT_USER,
        description: 'Create and update users',
        resource: 'user',
        roles: [ROLE.SUPER_ADMIN, ROLE.ADMIN],
    },
    {
        name: PermissionEnum.DELETE_USER,
        description: 'Delete or deactivate users',
        resource: 'user',
        roles: [ROLE.SUPER_ADMIN],
    },
    {
        name: PermissionEnum.VIEW_ROLE,
        description: 'View roles and permissions',
        resource: 'role',
        roles: [ROLE.SUPER_ADMIN, ROLE.ADMIN],
    },
    {
        name: PermissionEnum.ADD_EDIT_ROLE,
        description: 'Create and update roles',
        resource: 'role',
        roles: [ROLE.SUPER_ADMIN],
    },
    {
        name: PermissionEnum.DELETE_ROLE,
        description: 'Delete roles',
        resource: 'role',
        roles: [ROLE.SUPER_ADMIN],
    },
];
