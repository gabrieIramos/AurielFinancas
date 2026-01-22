import { IsNotEmpty, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '../entities/account.entity';

export class CreateAccountDto {
  @ApiProperty({ example: 'Nubank' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AccountType, example: 'CONTA_CORRENTE' })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiProperty({ required: false })
  @IsOptional()
  institutionId?: string;

  @ApiProperty({ required: false, example: 1500.00, description: 'Saldo inicial da conta' })
  @IsOptional()
  @IsNumber()
  initialBalance?: number;
}
