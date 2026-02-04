import { api } from './api';

export interface FinancialProfile {
  id?: string;
  userId?: string;
  ageRange?: string;
  occupation?: string;
  monthlyIncomeRange?: string;
  incomeStability?: string;
  monthlyExpensePercentage?: string;
  hasDebts?: boolean;
  debtTypes?: string[];
  hasEmergencyFund?: boolean;
  emergencyFundMonths?: string;
  investmentExperience?: string;
  currentInvestments?: string[];
  investmentGoal?: string;
  investmentHorizon?: string;
  riskTolerance?: string;
  mainFinancialGoals?: string[];
  biggestFinancialChallenge?: string;
  profileCompleted?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  fullName: string;
  image?: string;
  hasFinancialProfile: boolean;
}

class UserService {
  async getProfile() {
    return api.get<UserProfile>('/users/me');
  }

  async getFinancialProfile() {
    return api.get<{ profile: FinancialProfile | null }>('/users/financial-profile');
  }

  async saveFinancialProfile(data: FinancialProfile) {
    return api.post<{ profile: FinancialProfile }>('/users/financial-profile', data);
  }

  async updateFinancialProfile(data: FinancialProfile) {
    return api.put<{ profile: FinancialProfile }>('/users/financial-profile', data);
  }

  async checkFinancialProfile() {
    return api.get<{ hasProfile: boolean }>('/users/financial-profile/check');
  }
}

export const userService = new UserService();
