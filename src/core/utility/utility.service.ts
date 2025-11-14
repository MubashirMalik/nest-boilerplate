import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserPayload } from "../auth/user-payload.model";
import { RequestContext } from "../request-context/request-context.model";
import { randomInt } from "crypto";
import { Email } from "src/constants/email";
import { MailerService } from "@nestjs-modules/mailer";
import { GetPaginatedRecordsDto } from "src/dtos/get-paginated-records.dto";
import { Repository, SelectQueryBuilder } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { List } from "src/entities/List.entity";

@Injectable() 
export class UtilityService {
    constructor(
        @InjectRepository(List) private readonly listRepo: Repository<List>,
        private readonly mailer: MailerService
    ) {}

    async getPaginatedRecords(query: SelectQueryBuilder<any>, params: GetPaginatedRecordsDto) {
        const blockSize = params.endRow - params.startRow
        if (blockSize > 0) {
            query.take(blockSize + 1).skip(params.startRow)
        }

        if ('filterModel' in params) {
            const whereSql = this.whereSql(params)
            if (whereSql.length > 0) {
                query.andWhere(whereSql)
            }
        }

        // Dynamic Ordering
        let userOrderByClauses = this.orderBySql(params)
        if (userOrderByClauses.length > 0) { //user selected a sort
            for (let orderByClause of userOrderByClauses) {
                query.orderBy(orderByClause.column, orderByClause.sort);
            }
        }

        const totalRecords = await query.clone().getCount()
        return {
            totalRecords
        }
    }

    whereSql(params: GetPaginatedRecordsDto) {
        var whereParts = [];
        var filterModel = params.filterModel

        if (filterModel) {
            for (let key in filterModel) {
                var item = filterModel[key];

                // Format single quotes in a string
                if (item?.filterType == 'text' && item?.filter && typeof item.filter == 'string') {
                    item.filter = item.filter.replace(/'/g, "\\'")
                }

                let columnInfo = this.getOutputListingColumnData(params, key);

                if (columnInfo) { //alias defined?
                    let wherePart = this.createFilterSql(`${columnInfo.alias}.${columnInfo.column}`, item);
                    if (wherePart) {
                        whereParts.push(wherePart);
                    }
                }
            }
        }

        if (whereParts.length > 0) {
            return whereParts.join(' AND ');
        }

        return '';
    }

    createFilterSql(key, item) {
        if (item.operator) {
            var condition1 = this.filterMapper(key, item.condition1);
            var condition2 = this.filterMapper(key, item.condition2);

            return '(' + condition1 + ' ' + item.operator + ' ' + condition2 + ')';
        }

        return this.filterMapper(key, item);
    }

    filterMapper(key, item) {
        switch (item.filterType) {
            case 'date':
                item.filter = (item.dateFrom) ? item.dateFrom : '0000-00-00';
                item.filterTo = (item.dateTo) ? item.dateTo : '0000-00-00';
                break;
        }

        //Handle Special filter types
        switch (item.type) {
            //Handle blank filter type values
            case 'blank':
            case 'notBlank':
                item.filter = '';
                if (item.filterType == 'number') {
                    item.filter = '0';
                }
                else if (item.filterType == 'date') {
                    item.filter = '0000-00-00';
                }
                break;
        }

        switch (item.type) {
            case 'equals':
                return key + " = '" + item.filter + "'";
            case 'notEqual':
                return key + " != '" + item.filter + "'";
            case 'contains':
                return key + " LIKE '%" + item.filter + "%'";
            case 'notContains':
                return key + " NOT LIKE '%" + item.filter + "%'";
            case 'startsWith':
                return key + " LIKE '" + item.filter + "%'";
            case 'endsWith':
                return key + " LIKE '%" + item.filter + "'";
            case 'greaterThan':
                return key + " > '" + item.filter + "'";
            case 'greaterThanOrEqual':
                return key + " >= '" + item.filter + "'";
            case 'lessThan':
                return key + " < '" + item.filter + "'";
            case 'lessThanOrEqual':
                return key + " <= '" + item.filter + "'";
            case 'inRange':
                return '(' + key + " >= '" + item.filter + "' AND " + key + " <= '" + item.filterTo + "')";
            case 'blank':
                return '(' + key + " = '" + item.filter + "' OR " + key + " IS NULL)";
            case 'notBlank':
                return '(' + key + " != '" + item.filter + "' AND " + key + " IS NOT NULL)";
            case 'false':
                return '(' + key + " = '" + 0 + "')";
            case 'true':
                return '(' + key + " >= '" + 1 + "')";
            default:
                console.log('unknown text filter type: ' + item.type);
        }
        return null;
    }

    getOutputListingColumnData(params: GetPaginatedRecordsDto, column: string) {
        if (params.hasOwnProperty('secondaryColumnAliases')) {
            if (params.secondaryColumnAliases.hasOwnProperty(column)) {
                return params.secondaryColumnAliases[column];
            }
        }

        return { alias: params.primaryAlias, column: column };
    }

    orderBySql(params: GetPaginatedRecordsDto) {
        const sorts: { column: string, sort: 'ASC' | 'DESC' }[] = [];
        const sortModel = params.sortModel;

        for (let sortItem of sortModel) {
            const sortDirection = sortItem.sort.toUpperCase() as 'ASC' | 'DESC';

            const columnInfo = this.getOutputListingColumnData(params, sortItem.colId);
            if (columnInfo) {
                sorts.push({ column: `${columnInfo.alias}.${columnInfo.column}`, sort: sortDirection });
            }
        }

        return sorts
    }

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

    // Critical: This method loads app metadata. Only add essential data to maintain performance.
    async getAppMetadata() {
        //todo: this is placeholder
        const [dateFormats] = await Promise.all([
            this.listRepo.find({ where: { type: 'dateFormats' }})
        ])
        return { dateFormats }
    } 
}
