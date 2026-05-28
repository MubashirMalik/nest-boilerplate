import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserPayload } from "../auth/user-payload.model";
import { RequestContext } from "../request-context/request-context.model";
import { createCipheriv, createDecipheriv, randomBytes, randomInt, scryptSync } from "crypto";
import { Email } from "src/constants/email";
import { MailerService } from "@nestjs-modules/mailer";
import { GetPaginatedRecordsDto } from "src/dtos/get-paginated-records.dto";
import { In, LessThan, Not, Repository, SelectQueryBuilder } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { List } from "src/entities/List.entity";
import { ErrorLog } from "src/entities/Error.entity";
import { Role } from "src/entities/Role.entity";
import { Permission } from "src/entities/Permission.entity";
import * as fs from 'fs';
import * as path from 'path';

@Injectable() 
export class UtilityService {
    constructor(
        @InjectRepository(List) private readonly listRepo: Repository<List>,
        @InjectRepository(ErrorLog) private readonly errorLogRepository: Repository<ErrorLog>,
        @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
        @InjectRepository(Permission) private readonly permissionRepository: Repository<Permission>,
        private readonly mailer: MailerService,
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

    generateSecurePassword(length = 16): string {
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const digits = '0123456789';
        const special = '!@#$%^&*';
        const all = upper + lower + digits + special;

        if (length < 4) {
            throw new Error('Password length must be at least 4 characters.');
        }

        const getRandomChar = (charset: string) => charset[Math.floor(Math.random() * charset.length)];
        const requiredChars = [
            getRandomChar(upper),
            getRandomChar(lower),
            getRandomChar(digits),
            getRandomChar(special),
        ];
        const remainingChars = Array.from({ length: length - requiredChars.length }, () => getRandomChar(all));
        const passwordChars = [...requiredChars, ...remainingChars];

        for (let i = passwordChars.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
        }

        return passwordChars.join('');
    }

    async writeToCsv(fileName: string, headers: string[], keys: string[], data: Record<string, unknown>[]): Promise<string> {
        const filePath = path.join(process.cwd(), 'temp', `${fileName}.csv`);

        if (!fs.existsSync(path.join(process.cwd(), 'temp'))) {
            fs.mkdirSync(path.join(process.cwd(), 'temp'));
        }

        const rows = data.map(obj => keys.map(key => {
            let value = obj[key];
            if (typeof value === 'string' && value.includes(',')) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');
        fs.writeFileSync(filePath, csvContent);

        setTimeout(() => {
            fs.unlink(filePath, (err) => {
                if (err) console.error(`Error while deleting file: ${err.message}`);
            });
        }, 50000);

        return filePath;
    }

    encryptAES(data: string, secretKey?: string): { encryptedData: string; iv: string; authTag: string; salt: string } {
        const salt = randomBytes(16).toString('hex');
        const keySource = secretKey || process.env.AES_SECRET_KEY || 'default-secret-key-for-development';
        const key = scryptSync(keySource, salt, 32);
        const iv = randomBytes(16);
        const cipher = createCipheriv('aes-256-gcm', key, iv);

        let encryptedData = cipher.update(data, 'utf8', 'hex');
        encryptedData += cipher.final('hex');

        return {
            encryptedData,
            iv: iv.toString('hex'),
            authTag: cipher.getAuthTag().toString('hex'),
            salt,
        };
    }

    decryptAES(encryptedData: string, iv: string, authTag: string, salt: string, secretKey?: string): string {
        const keySource = secretKey || process.env.AES_SECRET_KEY || 'default-secret-key-for-development';
        const key = scryptSync(keySource, salt, 32);
        const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
        decryptedData += decipher.final('utf8');
        return decryptedData;
    }

    encryptAESToString(data: string, secretKey?: string): string {
        return JSON.stringify(this.encryptAES(data, secretKey));
    }

    decryptAESFromString(encryptedString: string, secretKey?: string): string {
        const encrypted = JSON.parse(encryptedString);
        return this.decryptAES(encrypted.encryptedData, encrypted.iv, encrypted.authTag, encrypted.salt, secretKey);
    }

    async getAppMetadata() {
        const [roles, permissions, dateFormats] = await Promise.all([
            this.roleRepository.find({
                relations: { RoleXPermission: { Permission: true } },
            }),
            this.permissionRepository.find(),
            this.listRepo.find({ where: { type: 'dateFormats' } }),
        ]);
        return { roles, permissions, dateFormats }
    }

    async saveErrorLog(statusCode = 500, path = '', message = '', stack = '') {
        let user: UserPayload = null;
        let requestData = null;

        try {
            user = this.getRequestUser();
        } catch {}

        try {
            const req = RequestContext.currentContext?.req;
            if (req) {
                requestData = JSON.stringify({
                    body: req.body,
                    params: req.params,
                    query: req.query,
                    headers: req.headers
                });
            }
        } catch (error) {
            console.error('Error extracting request data:', error.message);
        }

        try {
            const errorLog = new ErrorLog();
            errorLog.statusCode = statusCode;
            errorLog.path = path;
            errorLog.method = RequestContext.currentContext?.req?.method || null;
            errorLog.message = message;
            errorLog.stack = stack;
            errorLog.username = user?.email ?? '';
            errorLog.userId = user?.id ?? null;
            errorLog.requestData = requestData;
            errorLog.createdAt = new Date();
            await errorLog.save();
        } catch (error) {
            console.error('Error saving error log:', error.message);
        }
    }

    async clearErrorLogs() {
        await this.errorLogRepository.delete({
            createdAt: LessThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
            statusCode: Not(In([403])),
        });
    }
}
