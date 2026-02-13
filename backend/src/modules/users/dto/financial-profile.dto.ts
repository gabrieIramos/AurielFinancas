import { IsString, IsBoolean, IsArray, IsOptional } from 'class-validator';

export class CreateFinancialProfileDto {
  @IsOptional()
  @IsString()
  ageRange?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  monthlyIncomeRange?: string;

  @IsOptional()
  @IsString()
  incomeStability?: string;

  @IsOptional()
  @IsString()
  monthlyExpensePercentage?: string;

  @IsOptional()
  @IsBoolean()
  hasDebts?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  debtTypes?: string[];

  @IsOptional()
  @IsBoolean()
  hasEmergencyFund?: boolean;

  @IsOptional()
  @IsString()
  emergencyFundMonths?: string;

  @IsOptional()
  @IsString()
  investmentExperience?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentInvestments?: string[];

  @IsOptional()
  @IsString()
  investmentGoal?: string;

  @IsOptional()
  @IsString()
  investmentHorizon?: string;

  @IsOptional()
  @IsString()
  riskTolerance?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mainFinancialGoals?: string[];

  @IsOptional()
  @IsString()
  biggestFinancialChallenge?: string;

  @IsOptional()
  @IsBoolean()
  profileCompleted?: boolean;
}

export class UpdateFinancialProfileDto extends CreateFinancialProfileDto {}
