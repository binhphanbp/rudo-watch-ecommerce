import api from './api.js';
import Swal from '../utils/swal.js';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
});

class FavoritesService {
  constructor() {
    this.favorites = this.loadFromLocalStorage();
  }

  // Load favorites from localStorage
  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('favorites');
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error loading favorites from localStorage:', err);
      return [];
    }
  }

  // Save favorites to localStorage
  saveToLocalStorage() {
    try {
      localStorage.setItem('favorites', JSON.stringify(this.favorites));
    } catch (err) {
      console.error('Error saving favorites to localStorage:', err);
    }
  }

  // Check if product is in favorites
  isFavorite(productId) {
    return this.favorites.includes(Number(productId));
  }

  // Toggle favorite (add or remove)
  async toggleFavorite(productId) {
    const id = Number(productId);
    const token = localStorage.getItem('token');

    if (!token) {
      // If not logged in, use localStorage only
      if (this.isFavorite(id)) {
        this.favorites = this.favorites.filter(fid => fid !== id);
        this.saveToLocalStorage();
        Toast.fire({ icon: 'info', title: 'Đã xóa khỏi yêu thích' });
        return false;
      } else {
        this.favorites.push(id);
        this.saveToLocalStorage();
        Toast.fire({ icon: 'success', title: 'Đã thêm vào yêu thích' });
        return true;
      }
    }

    // If logged in, sync with API
    try {
      if (this.isFavorite(id)) {
        // Remove from favorites
        await api.delete(`/favorites/${id}`);
        this.favorites = this.favorites.filter(fid => fid !== id);
        this.saveToLocalStorage();
        Toast.fire({ icon: 'info', title: 'Đã xóa khỏi yêu thích' });
        return false;
      } else {
        // Add to favorites
        await api.post('/favorites', { product_id: id });
        this.favorites.push(id);
        this.saveToLocalStorage();
        Toast.fire({ icon: 'success', title: 'Đã thêm vào yêu thích' });
        return true;
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      Toast.fire({ 
        icon: 'error', 
        title: err.response?.data?.message || 'Có lỗi xảy ra' 
      });
      return this.isFavorite(id);
    }
  }

  // Get all favorites
  getFavorites() {
    return this.favorites;
  }

  // Sync favorites from API (when user logs in)
  async syncFromAPI() {
    try {
      const res = await api.get('/favorites');
      const favorites = res.data?.data || res.data || [];
      this.favorites = favorites.map(f => Number(f.product_id || f.id));
      this.saveToLocalStorage();
      return this.favorites;
    } catch (err) {
      console.error('Error syncing favorites from API:', err);
      return this.favorites;
    }
  }

  // Clear all favorites
  async clearAll() {
    const token = localStorage.getItem('token');
    
    try {
      if (token) {
        await api.delete('/favorites');
      }
      this.favorites = [];
      this.saveToLocalStorage();
      return true;
    } catch (err) {
      console.error('Error clearing favorites:', err);
      return false;
    }
  }
}

// Create singleton instance
const favoritesService = new FavoritesService();

// Export both the class and the instance
export { FavoritesService };
export default favoritesService;
