import Swal from '../utils/swal.js';
import api from './api.js';

const CART_KEY = 'rudo_cart';
const CART_SYNC_KEY = 'rudo_cart_last_sync';
const MAX_QTY_PER_ITEM = 10;
const SYNC_DEBOUNCE_MS = 1000; // Đợi 1s sau thao tác cuối mới sync
const SYNC_COOLDOWN_MS = 5000; // Tối thiểu 5s giữa các lần sync

let syncTimeout = null;
let isSyncing = false;

const CartService = {
  // 1. Lấy giỏ hàng từ LocalStorage
  getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
  },

  // 2. Lưu giỏ hàng + Bắn sự kiện + Tự động sync background (nếu đăng nhập)
  saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));

    // Tự động sync sau một lúc (debounce)
    this.scheduleSyncToAPI();
  },

  // 3. Thêm sản phẩm
  add(product, quantity = 1) {
    let cart = this.getCart();
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        product_id: product.product_id || product.id,
        variant_id: product.variant_id || null,
        name: product.name,
        price: parseFloat(product.price),
        image: product.image,
        quantity: quantity,
        stock: product.stock || 999,
        // Thông tin biến thể
        color: product.color || null,
        size: product.size || null,
        variant_name: product.variant_name || '',
      });
    }

    this.saveCart(cart);

    // Thông báo nhỏ góc màn hình
    if (Swal.mixin) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
      Toast.fire({
        icon: 'success',
        title: 'Đã thêm vào giỏ hàng',
      });
    }
  },

  // 4. Xóa sản phẩm
  remove(id) {
    let cart = this.getCart();
    cart = cart.filter((item) => item.id !== id);
    this.saveCart(cart);
  },

  // 5. Cập nhật số lượng (Tăng/Giảm) với giới hạn
  updateQuantity(id, change) {
    let cart = this.getCart();
    const item = cart.find((p) => p.id === id);
    if (!item) return { success: false };

    const newQuantity = item.quantity + change;

    // Giảm về 0 -> xóa
    if (newQuantity <= 0) {
      this.remove(id);
      return { success: true, removed: true };
    }

    // Kiểm tra giới hạn tồn kho
    const stockLimit = item.stock || 999;
    if (newQuantity > stockLimit) {
      return {
        success: false,
        reason: 'stock',
        message: 'Bạn đã chọn số lượng tối đa trong kho',
      };
    }

    // Kiểm tra giới hạn mua lẻ
    if (newQuantity > MAX_QTY_PER_ITEM) {
      return {
        success: false,
        reason: 'limit',
        message: `Giới hạn mua lẻ là ${MAX_QTY_PER_ITEM}. Để đặt số lượng lớn, vui lòng liên hệ hotline để có giá ưu đãi`,
      };
    }

    // Cập nhật thành công
    item.quantity = newQuantity;
    this.saveCart(cart);
    return { success: true };
  },

  // 6. Xóa sạch giỏ (Sau khi thanh toán)
  clear() {
    console.log('🗑️ Clearing cart...');
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(CART_SYNC_KEY);
    window.dispatchEvent(new Event('cart-updated'));
    console.log('✅ Cart cleared');

    // Clear giỏ trên server (silent, không quan tâm fail)
    const token = localStorage.getItem('token');
    if (token) {
      api.delete('/cart/clear').catch(() => {});
    }
  },

  // ========== HYBRID SYNC METHODS ==========

  /**
   * Lên lịch sync lên API (debounced)
   * Chỉ sync nếu:
   * - User đã đăng nhập
   * - Đủ thời gian cooldown (tránh spam API)
   * - Không đang sync
   */
  scheduleSyncToAPI() {
    const token = localStorage.getItem('token');
    if (!token) return; // Chưa đăng nhập -> không sync

    // Cancel timeout cũ nếu có
    if (syncTimeout) clearTimeout(syncTimeout);

    // Đợi 1s sau thao tác cuối cùng mới sync
    syncTimeout = setTimeout(() => {
      this.syncToAPI();
    }, SYNC_DEBOUNCE_MS);
  },

  /**
   * Sync giỏ hàng LocalStorage lên API (background, silent)
   * Dùng optimistic locking để tránh conflict
   */
  async syncToAPI() {
    const token = localStorage.getItem('token');
    if (!token || isSyncing) return;

    // Check cooldown
    const lastSync = localStorage.getItem(CART_SYNC_KEY);
    if (lastSync) {
      const timeSinceSync = Date.now() - parseInt(lastSync);
      if (timeSinceSync < SYNC_COOLDOWN_MS) {
        console.log('⏳ Sync cooldown, skip');
        return;
      }
    }

    isSyncing = true;
    const cart = this.getCart();

    try {
      const syncItems = cart.map((item) => ({
        product_id: Number(item.id) || Number(item.product_id),
        variant_id: Number(item.variant_id) || Number(item.id),
        quantity: Number(item.quantity),
        price: Number(item.price),
      }));

      await api.post('/cart/sync', { items: syncItems });
      localStorage.setItem(CART_SYNC_KEY, Date.now().toString());
      console.log('✅ Cart synced to server');
    } catch (error) {
      console.warn('⚠️ Cart sync failed (silent):', error.message);
      // Không hiển thị lỗi cho user, vì sync là background task
    } finally {
      isSyncing = false;
    }
  },

  /**
   * Tải giỏ hàng từ API về và merge với Local
   * Dùng khi:
   * - User vừa login
   * - Vào trang cart/checkout (để đảm bảo stock mới nhất)
   * - Cần validate trước khi thanh toán
   */
  async syncFromAPI() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('⚠️ No token, skip sync from API');
      return this.getCart();
    }

    try {
      const response = await api.get('/cart');
      const serverCart = response.data?.data?.items || [];
      const localCart = this.getCart();

      console.log('📥 Server cart:', serverCart.length, 'items');
      console.log('📦 Local cart:', localCart.length, 'items');

      if (serverCart.length === 0 && localCart.length > 0) {
        // Server không có gì nhưng local có -> push local lên
        console.log('📤 Pushing local cart to server...');
        await this.syncToAPI();
        return localCart; // ✅ Return local cart
      }

      if (serverCart.length === 0 && localCart.length === 0) {
        // Cả 2 đều rỗng
        console.log('⚠️ Both server and local cart are empty');
        return [];
      }

      // Strategy: Merge server + local, ưu tiên số lượng cao hơn
      const merged = this.mergeCart(localCart, serverCart);

      // Cập nhật local với dữ liệu mới nhất
      localStorage.setItem(CART_KEY, JSON.stringify(merged));
      localStorage.setItem(CART_SYNC_KEY, Date.now().toString());
      window.dispatchEvent(new Event('cart-updated'));

      console.log(
        '✅ Cart synced from server, merged:',
        merged.length,
        'items'
      );
      return merged;
    } catch (error) {
      console.error('❌ Failed to sync from API:', error);
      // Vẫn return local cart nếu API fail
      const localCart = this.getCart();
      console.log('⚠️ Fallback to local cart:', localCart.length, 'items');
      return localCart;
    }
  },

  /**
   * Merge giỏ hàng từ 2 nguồn (local + server)
   * Logic: Cộng dồn số lượng + cập nhật stock/price từ server
   */
  mergeCart(localCart, serverCart) {
    const merged = [];
    const processedIds = new Set();

    // Duyệt server cart trước (có stock/price mới nhất)
    serverCart.forEach((serverItem) => {
      const id = serverItem.product_id || serverItem.id;
      const localItem = localCart.find((item) => item.id === id);

      merged.push({
        id: id,
        product_id: serverItem.product_id || id,
        variant_id: serverItem.variant_id || localItem?.variant_id || null,
        name: serverItem.name || localItem?.name || 'Unknown',
        price: parseFloat(serverItem.price),
        image: serverItem.image || localItem?.image || '',
        quantity: serverItem.quantity + (localItem?.quantity || 0),
        stock: serverItem.stock || 999,
        // Giữ thông tin variant từ local hoặc server
        color: serverItem.color || localItem?.color || null,
        size: serverItem.size || localItem?.size || null,
        variant_name: serverItem.variant_name || localItem?.variant_name || '',
      });

      processedIds.add(id);
    });

    // Thêm những item chỉ có ở local
    localCart.forEach((localItem) => {
      if (!processedIds.has(localItem.id)) {
        merged.push(localItem);
      }
    });

    return merged;
  },

  /**
   * Validate giỏ hàng trước khi checkout
   * - Kiểm tra stock realtime từ API
   * - Cập nhật giá mới nhất
   * @returns {Promise<{valid: boolean, errors: Array, cart: Array}>}
   */
  async validateForCheckout() {
    const token = localStorage.getItem('token');
    if (!token) {
      // Nếu chưa đăng nhập, chỉ validate local
      const cart = this.getCart();
      return { valid: cart.length > 0, errors: [], cart };
    }

    try {
      // Sync và lấy dữ liệu mới nhất từ server
      const cart = await this.syncFromAPI();

      if (!cart || cart.length === 0) {
        return { valid: false, errors: ['Giỏ hàng trống'], cart: [] };
      }

      const errors = [];

      // Validate từng item
      cart.forEach((item) => {
        const itemName = item.name || 'Sản phẩm';
        const stock = item.stock || 0;

        if (item.quantity > stock) {
          errors.push(`${itemName}: Chỉ còn ${stock} sản phẩm trong kho`);
        }
        if (item.quantity > MAX_QTY_PER_ITEM) {
          errors.push(
            `${itemName}: Vượt quá giới hạn mua lẻ (${MAX_QTY_PER_ITEM})`
          );
        }
      });

      return {
        valid: errors.length === 0,
        errors,
        cart,
      };
    } catch (error) {
      console.warn('Validate checkout error:', error);
      // Nếu API fail, vẫn cho phép đặt hàng với local cart
      const localCart = this.getCart();
      return {
        valid: localCart.length > 0,
        errors: [],
        cart: localCart,
      };
    }
  },
};

export default CartService;
