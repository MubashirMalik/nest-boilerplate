import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserPayload } from "../auth/user-payload.model";
import { RequestContext } from "../request-context/request-context.model";
import { randomInt } from "crypto";
import { Email } from "src/constants/email";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable() 
export class UtilityService {
    constructor(
        private readonly mailer: MailerService
    ) {}

    getRequestUser() {
        // Get Request Object
        const req = RequestContext.currentContext.req;
        if (!req || !req.user) {
            throw new UnauthorizedException("User not found.");
        }

        return req.user as UserPayload
    }

    //TODO: check if its secure and random enough
    generateOtp() {
        const otp = randomInt(100000, 999999); // Generates a random number between 100000 and 999999
        return otp.toString(); // Convert to string
    }

    async sendEmail(email: Email) {
        try {
            await this.mailer.sendMail({
                ...email
            });
            return true
        } catch (error) {
            console.error("Error sending email:", error);
            return false
        }
    }
}