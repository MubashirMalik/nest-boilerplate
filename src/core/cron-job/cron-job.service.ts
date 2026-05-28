import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { UtilityService } from "../utility/utility.service";

@Injectable()
export class CronJobService {
    private readonly logger = new Logger(CronJobService.name);

    constructor(
        private readonly utilityService: UtilityService,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleErrorLogCleanup() {
        try {
            this.logger.debug('Cleaning up error logs');
            await this.utilityService.clearErrorLogs();
        } catch (error) {
            this.logger.error('Error cleaning up error logs', error);
        }
    }
}
