import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { NetWorthModule } from './modules/net-worth/net-worth.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',  
        ssl: configService.get<string>('NODE_ENV') === 'production'
          ? { rejectUnauthorized: true }
          : { rejectUnauthorized: false },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    InstitutionsModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    InvestmentsModule,
    NetWorthModule,
    AiModule,
  ],
})
export class AppModule { }
