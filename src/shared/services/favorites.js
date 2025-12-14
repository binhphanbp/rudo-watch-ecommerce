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
    this.favorites = [];
    this.isLoggedIn = !!localStorage.getItem('token');
  }

  // Check if user is logged in
  checkAuth() {
    this.isLoggedIn = !!localStorage.getItem('token');
    return this.isLoggedIn;
  }

  // ==================== LOCALSTORAGE FALLBACK ====================

  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('favorites');
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error loading favorites from localStorage:', err);
      return [];
    }
  }

  saveToLocalStorage(favorites) {
    try {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (err) {
      console.error('Error saving favorites to localStorage:', err);
    }
  }

  // ==================== API METHODS ====================

  // Get all favorites from API
  async getFavorites() {
    if (!this.checkAuth()) {
      // Not logged in - use localStorage
      return this.loadFromLocalStorage();
    }

    try {
      const res = await api.get('/favorites');

      // Parse response (can be nested)
      let data = res.data;
      if (data.data) {
        data = data.data;
        if (data.data && Array.isArray(data.data)) {
          data = data.data;
        }
      }

      const favorites = Array.isArray(data) ? data : [];

      // Extract product IDs
      this.favorites = favorites.map((f) => Number(f.product_id || f.id));

      // Cache to localStorage
      this.saveToLocalStorage(this.favorites);

      return this.favorites;
    } catch (err) {
      console.error('Error getting favorites from API:', err);
      // Fallback to localStorage
      return this.loadFromLocalStorage();
    }
  }

  // Get favorites count
  async getCount() {
    if (!this.checkAuth()) {
      return this.loadFromLocalStorage().length;
    }

    try {
      const res = await api.get('/favorites/count');
      const count = res.data?.data?.count || res.data?.count || 0;
      return count;
    } catch (err) {
      console.error('Error getting favorites count:', err);
      return this.loadFromLocalStorage().length;
    }
  }

  // Check if product is favorite
  async isFavorite(productId) {
    if (!this.checkAuth()) {
      const localFavs = this.loadFromLocalStorage();
      return localFavs.includes(Number(productId));
    }

    try {
      const res = await api.get(`/favorites/check/${productId}`);
      return res.data?.data?.is_favorite || res.data?.is_favorite || false;
    } catch (err) {
      console.error('Error checking favorite:', err);
      const localFavs = this.loadFromLocalStorage();
      return localFavs.includes(Number(productId));
    }
  }

  // Add product to favorites
  async addFavorite(productId) {
    const id = Number(productId);

    if (!this.checkAuth()) {
      // Not logged in - use localStorage
      const localFavs = this.loadFromLocalStorage();
      if (!localFavs.includes(id)) {
        localFavs.push(id);
        this.saveToLocalStorage(localFavs);
      }
      Toast.fire({ icon: 'success', title: 'Đã thêm vào yêu thích' });
      return true;
    }

    try {
      await api.post('/favorites', { product_id: id });

      // Update cache
      if (!this.favorites.includes(id)) {
        this.favorites.push(id);
        this.saveToLocalStorage(this.favorites);
      }

      Toast.fire({ icon: 'success', title: 'Đã thêm vào yêu thích' });
      return true;
    } catch (err) {
      console.error('Error adding favorite:', err);

      // Show error if it's not a duplicate
      if (err.response?.status !== 409) {
        Toast.fire({ icon: 'error', title: 'Không thể thêm vào yêu thích' });
      } else {
        // Already exists
        Toast.fire({ icon: 'info', title: 'Sản phẩm đã có trong yêu thích' });
      }

      return false;
    }
  }

  // Remove product from favorites
  async removeFavorite(productId) {
    const id = Number(productId);

    if (!this.checkAuth()) {
      // Not logged in - use localStorage
      let localFavs = this.loadFromLocalStorage();
      localFavs = localFavs.filter((fid) => fid !== id);
      this.saveToLocalStorage(localFavs);
      Toast.fire({ icon: 'info', title: 'Đã xóa khỏi yêu thích' });
      return true;
    }

    try {
      await api.delete(`/favorites/product/${id}`);

      // Update cache
      this.favorites = this.favorites.filter((fid) => fid !== id);
      this.saveToLocalStorage(this.favorites);

      Toast.fire({ icon: 'info', title: 'Đã xóa khỏi yêu thích' });
      return true;
    } catch (err) {
      console.error('Error removing favorite:', err);
      Toast.fire({ icon: 'error', title: 'Không thể xóa khỏi yêu thích' });
      return false;
    }
  }

  // Toggle favorite (smart add/remove)
  async toggleFavorite(productId) {
    const id = Number(productId);

    try {
      const isFav = await this.isFavorite(id);

      if (isFav) {
        await this.removeFavorite(id);
        return false;
      } else {
        await this.addFavorite(id);
        return true;
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      return false;
    }
  }

  // Sync localStorage favorites to API when user logs in
  async syncFromLocalToAPI() {
    if (!this.checkAuth()) {
      console.warn('Cannot sync: User not logged in');
      return;
    }

    try {
      const localFavs = this.loadFromLocalStorage();

      if (localFavs.length === 0) {
        console.log('No local favorites to sync');
        return;
      }

      console.log(`Syncing ${localFavs.length} local favorites to API...`);

      // Add each favorite to API
      for (const productId of localFavs) {
        try {
          await api.post('/favorites', { product_id: productId });
        } catch (err) {
          // Ignore if already exists (409)
          if (err.response?.status !== 409) {
            console.error(`Failed to sync favorite ${productId}:`, err);
          }
        }
      }

      // Refresh from API
      await this.getFavorites();

      console.log('Sync completed');
    } catch (err) {
      console.error('Error syncing favorites:', err);
    }
  }

  // Clear all favorites
  async clearAll() {
    if (!this.checkAuth()) {
      this.saveToLocalStorage([]);
      return true;
    }

    try {
      // Get all favorites
      const favorites = await this.getFavorites();

      // Delete each one
      for (const productId of favorites) {
        try {
          await api.delete(`/favorites/product/${productId}`);
        } catch (err) {
          console.error(`Failed to delete favorite ${productId}:`, err);
        }
      }

      this.favorites = [];
      this.saveToLocalStorage([]);

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
