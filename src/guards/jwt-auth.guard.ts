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
        const isControllerPublic = this.reflector.get<boolean>('isPublicRoute', context.getClass());
        if (isControllerPublic) return true

        const isHandlerRoute = this.reflector.get<boolean>('isPublicRoute', context.getHandler());
        if (isHandlerRoute) return true;
      
        // Add your custom authentication logic here
        // for example, call super.logIn(request) to establish a session.
        return super.canActivate(context);
    }
}
