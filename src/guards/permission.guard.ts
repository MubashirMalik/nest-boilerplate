import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { UserPayload } from "src/core/auth/user-payload.model";
import { PermissionEnum } from "../constants/permission.enum";
import { PERMISSION_KEY } from "../decorators/permission.decorator";
import { ROLE } from "../constants/role.enum";

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requiredPermission = this.reflector.getAllAndOverride<PermissionEnum[]>(PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermission || requiredPermission.length === 0) {
            return true;
        }

        const { user }: { user: UserPayload } = context.switchToHttp().getRequest();
        if (!user) {
            return false;
        }

        if (user.roleId === ROLE.SUPER_ADMIN) {
            return true;
        }

        return requiredPermission.every(permission => user.permissions?.includes(permission));
    }
}
