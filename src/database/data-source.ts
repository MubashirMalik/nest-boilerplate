import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';

// This is needed to simulate the environment outside of NestJS
ConfigModule.forRoot();

// Initialize ConfigService
const configService = new ConfigService();

// Create a DataSource instance using ConfigService
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: configService.get<string>('DATABASE_HOST'),
  port: parseInt(configService.get<string>('DATABASE_PORT'), 10),
  username: configService.get<string>('DATABASE_USER'),
  password: configService.get<string>('DATABASE_PASSWORD'),
  database: configService.get<string>('DATABASE_NAME'),
  // npx typeorm-ts-node-commonjs migration:generate src/migrations/data -d src/config/data-source.ts
  entities: [__dirname + '/../entities/*.entity.{js,ts}'],
  // npx typeorm-ts-node-commonjs migration:run -d src/config/data-source.ts
  migrations: [__dirname + '/../migrations/*.{js,ts}'],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
},
});
