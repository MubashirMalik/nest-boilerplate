import { BadRequestException, Injectable } from "@nestjs/common";
import { FindOptionsWhere, Repository } from "typeorm";
import { User } from "src/entities/User.entity";
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt';
import { SALT_OR_ROUNDS } from "src/constants";
import { RegisterUserDto } from "../auth/dtos/register-user.dto";
import { GetPaginatedRecordsDto } from "src/dtos/get-paginated-records.dto";
import { UtilityService } from "../utility/utility.service";
import { PermissionEnum } from "src/constants/permission.enum";
import { ROLE } from "src/constants/role.enum";
import { validatePasswordStrength } from "src/constants/passwordValidation";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        private readonly utilityService: UtilityService
    ) {}

    async getUserBy(fields: FindOptionsWhere<User> | FindOptionsWhere<User>[]) {
        const user = await this.userRepo.findOne({ where: fields });
        return user;
    }

    getUserPermissions(user: User): PermissionEnum[] {
        if (!user?.Role?.RoleXPermission) {
            return [];
        }

        const rolePermissions = user.Role.RoleXPermission.map(
            rxp => rxp.Permission.name as PermissionEnum,
        );

        const userPermissions = (user.UserXPermission ?? [])
            .filter(uxp => !uxp.suppressPermission)
            .map(uxp => uxp.Permission.name as PermissionEnum);

        const suppressedPermissions = (user.UserXPermission ?? [])
            .filter(uxp => uxp.suppressPermission)
            .map(uxp => uxp.Permission.name as PermissionEnum);

        const rolePermissionsNotSuppressed = rolePermissions.filter(
            permission => !suppressedPermissions.includes(permission),
        );

        return [...new Set([...rolePermissionsNotSuppressed, ...userPermissions])];
    }

    async createUser(registerUserDto: RegisterUserDto) {
        if (!validatePasswordStrength(registerUserDto.password)) {
            throw new BadRequestException(
                'Password must be at least 16 characters and include a letter, number, and special character.',
            )
        }

        const user = new User()
        user.email = registerUserDto.email
        user.roleId = ROLE.NORMAL_USER

        const hash = await bcrypt.hash(registerUserDto.password, SALT_OR_ROUNDS);
        user.password = hash

        return await this.userRepo.save(user)
    }

    async getUserForAuth(fields: FindOptionsWhere<User> | FindOptionsWhere<User>[]) {
        const user = await this.userRepo.findOne({ 
            where: fields,
            relations: {
                Role: { RoleXPermission: { Permission: true } },
                UserXPermission: { Permission: true },
            },
        });
        
        return user;
    }

    async getPaginatedUsers(params: GetPaginatedRecordsDto) {
        const query = this.userRepo
            .createQueryBuilder('u')
            .select(['u.id', 'u.email', 'r.name'])
            .leftJoin('u.Role', 'r')
            .orderBy('u.id', 'DESC')

        params.primaryAlias = 'u';

        const { totalRecords } = await this.utilityService.getPaginatedRecords(query, params)

        const users = await query.getMany();
    
        return {
            records: users,
            totalRecords,
        };
    }
}
