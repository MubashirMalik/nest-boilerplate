import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { UserPayload } from "src/core/auth/user-payload.model";
import { ROLE } from "../constants/role.enum";
import { ROLE_KEY } from "src/decorators/role.decorator";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
    ) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        // Handler -> Function, Class -> Controller
        // Precedence: Handler (then ->) Class
        // Docs: https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata
        // If roles found at handler level then override roles of controller.
        const requiredRoles = this.reflector.getAllAndOverride<ROLE[]>(ROLE_KEY, [ 
            context.getHandler(),
            context.getClass(),
        ]);

        // If there is no Role Guard present, it means no role is found. We ALLOW access! 
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user }: { user: UserPayload } = context.switchToHttp().getRequest();
        if (!user) { // This should not happen for logged in users
            return false;
        }

        // Check if user has the required role.
        const hasRole = requiredRoles.some(role => user.roleId === role);
        return hasRole;
    }
}