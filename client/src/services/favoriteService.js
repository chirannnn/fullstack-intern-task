import { api } from './api';

export async function getFavorites({ page, limit } = {}, options = {}) {
  const { data } = await api.get('/favorites', { params: { page, limit }, ...options });
  return data;
}

export async function addFavorite(templateId) {
  const { data } = await api.post(`/favorites/${templateId}`);
  return data.data;
}

export async function removeFavorite(templateId) {
  await api.delete(`/favorites/${templateId}`);
}
