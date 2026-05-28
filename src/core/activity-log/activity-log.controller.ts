import { Body, Controller, Post } from "@nestjs/common";
import { ActivityLogService } from "./activity-log.service";
import { GetPaginatedRecordsDto } from "src/dtos/get-paginated-records.dto";
import { Permission } from "src/decorators/permission.decorator";
import { PermissionEnum } from "src/constants/permission.enum";

@Controller('activity-log')
export class ActivityLogController {
    constructor(private readonly activityLogService: ActivityLogService) {}

    @Permission(PermissionEnum.VIEW_USER)
    @Post('all')
    async getPaginatedActivityLogs(@Body() dto: GetPaginatedRecordsDto) {
        return this.activityLogService.getPaginatedActivityLogs(dto);
    }
}
