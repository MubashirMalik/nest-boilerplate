import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { ROLE } from "../constants/role.enum";
import { ROLE_KEY } from "../decorators/role.decorator";
import { UserPayload } from "src/core/auth/user-payload.model";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
    ) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        // Handler -> Function, Class -> Controller
        // Precedence: Handler (then ->) Class
        // Docs: https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata
        // If permissions found at handler level then override permissions of controller.
        const requiredRole = this.reflector.getAllAndOverride<ROLE>(ROLE_KEY, [ 
            context.getHandler(),
            context.getClass(),
        ]);

        // If there is no Role Guard present, it means no role is found. We ALLOW access! 
        if (!requiredRole) {
            return true;
        }

        const { user }: { user: UserPayload } = context.switchToHttp().getRequest();
        if (!user) { // This should not happen for logged in users
            return false;
        }
    
        return requiredRole === user?.roleId 
    }
}
