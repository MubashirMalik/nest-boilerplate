import { Injectable } from "@nestjs/common";
import { FindOptionsWhere, Repository } from "typeorm";
import { User } from "src/entities/User.entity";
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt';
import { SALT_OR_ROUNDS } from "src/constants";
import { RegisterUserDto } from "../auth/dtos/register-user.dto";
import { GetPaginatedRecordsDto } from "src/dtos/get-paginated-records.dto";
import { UtilityService } from "../utility/utility.service";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        private readonly utilityService: UtilityService
    ) {}

    // Generic method to get a user by a specific field
    async getUserBy(fields: FindOptionsWhere<User> | FindOptionsWhere<User>[]) {
        const user = await this.userRepo.findOne({ where: fields });
        return user;
    }

    async createUser(registerUserDto: RegisterUserDto) {
        const user = new User()
        user.email = registerUserDto.email

        // Generate Password Hash
        const hash = await bcrypt.hash(registerUserDto.password, SALT_OR_ROUNDS);
        user.password = hash

        return await this.userRepo.save(user)
    }

    async getUserForAuth(fields: FindOptionsWhere<User> | FindOptionsWhere<User>[]) {
        const user = await this.userRepo.findOne({ 
            where: fields, 
        });
        
        return user;
    }

    async getPaginatedUsers(params: GetPaginatedRecordsDto) {
        const query = this.userRepo
            .createQueryBuilder('u')
            .select(['u.id', 'u.name', 'u.email', 'u.createdAt', 'r.name'])
            .leftJoin('u.Role', 'r')
            .orderBy('u.createdAt', 'DESC')

        params.primaryAlias = 'u';

        const { totalRecords } = await this.utilityService.getPaginatedRecords(query, params)

        const users = await query.getMany();
    
        return {
            records: users,
            totalRecords,
        };
    }
}