import { IsNotEmpty, IsNumber, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  fitid?: string;

  @ApiProperty({ example: 'COMPRA SUPERMERCADO ABC 12/01' })
  @IsNotEmpty()
  descriptionRaw: string;

  @ApiProperty({ example: -150.50 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '2024-01-12' })
  @IsDateString()
  date: Date;
}
