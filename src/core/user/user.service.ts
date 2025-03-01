import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
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

    async getUserByEmail(email: string) {
        return this.userRepo.findOne({
            where: { email }
        })
    }

    async createUser(registerUserDto: RegisterUserDto) {
        const user = new User()
        user.email = registerUserDto.email

        // Generate Password Hash
        const hash = await bcrypt.hash(registerUserDto.password, SALT_OR_ROUNDS);
        user.password = hash

        return await this.userRepo.save(user)
    }
}