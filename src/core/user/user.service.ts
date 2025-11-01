import { Injectable } from "@nestjs/common";
import { FindOptionsWhere, Repository } from "typeorm";
import { User } from "src/entities/User.entity";
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt';
import { SALT_OR_ROUNDS } from "src/constants";
import { RegisterUserDto } from "../auth/dtos/register-user.dto";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
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
}