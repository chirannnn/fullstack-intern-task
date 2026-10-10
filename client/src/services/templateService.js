import { api } from './api';

/** @returns {Promise<{ data: object[], meta: { page: number, limit: number, total: number, totalPages: number } }>} */
export async function getTemplates({ search, category, page, limit } = {}, options = {}) {
  const params = {};
  if (search) params.search = search;
  if (category) params.category = category;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const { data } = await api.get('/templates', { params, ...options });
  return data;
}

export async function getCategories(options = {}) {
  const { data } = await api.get('/templates/categories', options);
  return data.data;
}
