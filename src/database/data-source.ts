import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { cwd } from 'process';
import { join } from 'path';

// This is needed to simulate the environment outside of NestJS
ConfigModule.forRoot();

// Initialize ConfigService
const configService = new ConfigService();

// Create a DataSource instance for migrations with ALL entities
export const MigrationDataSource = new DataSource({
  type: 'mysql',
  host: configService.get<string>('DB_HOST'),
  port: parseInt(configService.get<string>('DB_PORT'), 3306),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  // Include ALL entities to handle all relationships
  entities: [
    join(cwd(), 'src/entities/*.entity.ts'),
    join(cwd(), 'src/entities/*.entity.js')
  ],
  migrations: [
    join(cwd(), 'src/database/migrations/*.ts'),
    join(cwd(), 'src/database/migrations/*.js')
  ],
  synchronize: false,
  logging: true,
  ssl: {
    rejectUnauthorized: false,
  },
});


//npm run migration:generate src/database/migrations/AddIsRecruitingToError
