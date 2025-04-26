import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserPayload } from "../auth/user-payload.model";
import { RequestContext } from "../request-context/request-context.model";

@Injectable() 
export class UtilityService {

    constructor() {}

    getRequestUser() {
        // Get Request Object
        const req = RequestContext.currentContext.req;
        if (!req || !req.user) {
            throw new UnauthorizedException("User not found.");
        }

        return req.user as UserPayload
    }
}