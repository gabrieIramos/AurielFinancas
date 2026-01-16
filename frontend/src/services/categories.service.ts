import { api } from './api';

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
}

export interface CreateCategoryData {
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
}

class CategoriesService {
  async getAll() {
    return api.get<Category[]>('/categories');
  }

  async getByType(type: 'income' | 'expense') {
    return api.get<Category[]>(`/categories?type=${type}`);
  }

  async create(data: CreateCategoryData) {
    return api.post<Category>('/categories', data);
  }

  async update(id: number, data: Partial<CreateCategoryData>) {
    return api.put<Category>(`/categories/${id}`, data);
  }

  async delete(id: number) {
    return api.delete(`/categories/${id}`);
  }
}

export const categoriesService = new CategoriesService();
