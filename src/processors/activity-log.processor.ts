import { OnQueueEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { ActivityLogData, ActivityLogService } from "src/core/activity-log/activity-log.service";

@Processor('activity-log')
export class ActivityLogProcessor extends WorkerHost {
    constructor(private readonly activityLogService: ActivityLogService) {
        super();
    }

    @OnQueueEvent('failed')
    handleFailed(job: Job<ActivityLogData[]>, error: Error) {
        console.error(`Activity log job failed: ${JSON.stringify(job.data)}`, error);
    }

    async process(job: Job<ActivityLogData[]>) {
        await this.activityLogService.logActivitySync(job.data);
    }
}
