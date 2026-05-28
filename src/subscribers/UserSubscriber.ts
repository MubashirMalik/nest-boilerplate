import { User } from "src/entities/User.entity";
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from "typeorm";
import { ActivityLogService } from "src/core/activity-log/activity-log.service";
import { ActivityAction } from "src/entities/ActivityLog.entity";

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
    constructor(
        private readonly dataSource: DataSource,
        private readonly activityLogService: ActivityLogService,
    ) {
        dataSource.subscribers.push(this);
    }

    listenTo() {
        return User;
    }

    async afterInsert(event: InsertEvent<User>) {
        const newEntity = event.entity;
        if (!newEntity) return;

        await this.activityLogService.logUserChange(
            `Account created for ${newEntity.email}`,
            ActivityAction.CREATE,
            newEntity.id,
        );
    }

    async beforeUpdate(event: UpdateEvent<User>) {
        const oldEntity = event.databaseEntity;
        const newEntity = event.entity;

        if (!oldEntity || !newEntity) return;

        if (newEntity.password !== oldEntity.password) {
            await this.activityLogService.logUserChange(
                `Password changed for ${oldEntity.email}`,
                ActivityAction.UPDATE,
                oldEntity.id,
            );
        }

        if (newEntity.roleId !== oldEntity.roleId) {
            await this.activityLogService.logUserChange(
                `Role changed for ${oldEntity.email}`,
                ActivityAction.UPDATE,
                oldEntity.id,
            );
        }
    }
}
