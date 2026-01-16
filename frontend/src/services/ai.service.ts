import { api } from './api';

export interface AIInsight {
  id: number;
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface AIRecommendation {
  category: string;
  message: string;
  impact: string;
}

class AIService {
  async getInsights() {
    return api.get<AIInsight[]>('/ai/insights');
  }

  async getRecommendations() {
    return api.get<AIRecommendation[]>('/ai/recommendations');
  }

  async analyzeSpending() {
    return api.post('/ai/analyze-spending');
  }

  async getForecast(months: number = 3) {
    return api.get(`/ai/forecast?months=${months}`);
  }
}

export const aiService = new AIService();
