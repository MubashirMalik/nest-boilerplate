import { Controller, Get } from "@nestjs/common";
import { UtilityService } from "./utility.service";


@Controller('utility')
export class UtilityController {
    constructor(private readonly utilityService: UtilityService) {}

    @Get("app-metadata")
    async getAppMetadata() {
        return this.utilityService.getAppMetadata()
    }
}