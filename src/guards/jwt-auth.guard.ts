import {  
    ExecutionContext,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        // The Reflector class is used to easily access the metadata by passing in two arguments: a metadata key and a context (decorator target) to retrieve the metadata from
        // Example: const handlerGuards = this.reflector.get<string[]>('guards', context.getHandler())
        private readonly reflector: Reflector
    ) {
        super()
    }
    
    canActivate(context: ExecutionContext) {
        // NOTE: Route Handler Level Guards take precedence over Class Level Guards in our implementation.

        // Get all the Guards applied on current handler
        const handlerGuards = this.reflector.get<string[]>('guards', context.getHandler())
        if (handlerGuards && handlerGuards.length > 0) {
            // Check for below guards, if applied on the handler we will ignore authentication for these.
            if (handlerGuards.includes("OptionalJwtAuthGuard") || handlerGuards.includes("LocalAuthGuard")) {
                return true
            }
        }

        // Get all the Guards applied on current handler's controller
        const controllerGuards = this.reflector.get<string[]>('guards', context.getClass())
        if (controllerGuards && controllerGuards.length > 0) {
            // Check for below guards, if applied on the controller we will ignore authentication for these
            if (controllerGuards.includes("OptionalJwtAuthGuard") || controllerGuards.includes("LocalAuthGuard")) {
                return true
            }
        }
      
        // Add your custom authentication logic here
        // for example, call super.logIn(request) to establish a session.
        return super.canActivate(context);
    }
}
