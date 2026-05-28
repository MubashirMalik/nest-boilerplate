import { Injectable, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, JobsOptions } from 'bullmq';
import { ActivityLog, ActivityArea, ActivityAction } from '../../entities/ActivityLog.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestContext } from '../request-context/request-context.model';
import { UtilityService } from '../utility/utility.service';
import { GetPaginatedRecordsDto } from 'src/dtos/get-paginated-records.dto';

export interface ActivityLogData {
    description: string;
    area: ActivityArea;
    action: ActivityAction;
    recordId?: number;
    ipAddress: string;
    userAgent: string;
    userId: number | null;
    userName: string;
    recordBeforeAction?: string;
}

@Injectable()
export class ActivityLogService {
    constructor(
        @Optional() @InjectQueue('activity-log') private readonly activityLogQueue: Queue | null,
        @InjectRepository(ActivityLog) private readonly activityLogRepository: Repository<ActivityLog>,
        private readonly utilityService: UtilityService,
    ) {}

    async logActivityWithQueue(data: ActivityLogData[], queueConfig: Partial<JobsOptions> = {}) {
        if (!this.activityLogQueue) {
            await this.logActivitySync(data);
            return;
        }

        try {
            const defaultQueueConfig: JobsOptions = {
                attempts: 3,
                backoff: { type: 'exponential' },
                removeOnComplete: true,
                removeOnFail: 100,
                delay: 2000,
            };

            await this.activityLogQueue.add('save-activity', data, { ...defaultQueueConfig, ...queueConfig });
        } catch (error) {
            console.error('Failed to add activity log to queue:', error.message);
            await this.logActivitySync(data);
        }
    }

    async logActivitySync(data: ActivityLogData[]) {
        await this.saveActivityLog(data);
    }

    async logAuthEvent(description: string, action: ActivityAction, recordId: number | null = null) {
        await this.logChange(description, ActivityArea.AUTH, action, recordId);
    }

    async logUserChange(description: string, action: ActivityAction, recordId: number | null = null, recordBeforeAction: string | null = null) {
        await this.logChange(description, ActivityArea.USER, action, recordId, recordBeforeAction);
    }

    async logRoleChange(description: string, action: ActivityAction, recordId: number | null = null, recordBeforeAction: string | null = null) {
        await this.logChange(description, ActivityArea.ROLE, action, recordId, recordBeforeAction);
    }

    async logChange(
        description: string,
        area: ActivityArea,
        action: ActivityAction,
        recordId: number | null = null,
        recordBeforeAction: string | null = null,
    ) {
        await this.logActivityWithQueue([{
            description,
            recordId,
            recordBeforeAction: recordBeforeAction ?? undefined,
            area,
            action,
            ...this.getRequestContext(),
        }]);
    }

    async getPaginatedActivityLogs(getPaginatedRecordsDto: GetPaginatedRecordsDto) {
        const query = this.activityLogRepository.createQueryBuilder('al')
            .select(['al.id', 'al.description', 'al.userName', 'al.createdAt', 'al.area', 'al.action'])
            .orderBy('al.createdAt', 'DESC');

        getPaginatedRecordsDto.primaryAlias = 'al';

        const { totalRecords } = await this.utilityService.getPaginatedRecords(query, getPaginatedRecordsDto);
        const activityLogs = await query.getMany();

        return { records: activityLogs, totalRecords };
    }

    private getRequestContext(): Omit<ActivityLogData, 'description' | 'area' | 'action' | 'recordId' | 'recordBeforeAction'> {
        const req = RequestContext.currentContext?.req as { ip?: string; headers?: Record<string, string>; user?: { id?: number; email?: string } };
        return {
            ipAddress: req?.ip ?? '',
            userAgent: req?.headers?.['user-agent'] ?? '',
            userId: req?.user?.id ?? null,
            userName: req?.user?.email ?? '',
        };
    }

    private async saveActivityLog(data: ActivityLogData[]) {
        const activityLogs: ActivityLog[] = [];
        for (const item of data) {
            const activityLog = new ActivityLog();
            activityLog.description = item.description;
            activityLog.area = item.area;
            activityLog.action = item.action;
            activityLog.recordId = item.recordId ?? null;
            activityLog.recordBeforeAction = item.recordBeforeAction ?? null;
            activityLog.ipAddress = (item.ipAddress ?? '').substring(0, 45);
            activityLog.userAgent = (item.userAgent ?? '').substring(0, 255);
            activityLog.userId = item.userId;
            activityLog.userName = item.userName ?? '';
            activityLogs.push(activityLog);
        }
        await this.activityLogRepository.save(activityLogs);
    }
}
