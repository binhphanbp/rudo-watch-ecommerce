import Swal from '../utils/swal.js'; // Đảm bảo đã có file src/utils/swal.js

const CART_KEY = 'rudo_cart';

const CartService = {
  // 1. Lấy giỏ hàng từ LocalStorage
  getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
  },

  // 2. Lưu giỏ hàng + Bắn sự kiện để Header cập nhật số lượng
  saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    // Dispatch sự kiện custom để file main.js lắng nghe và update số trên header
    window.dispatchEvent(new Event('cart-updated'));
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
        name: product.name,
        price: parseFloat(product.price),
        image: product.image,
        quantity: quantity,
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

  // 5. Cập nhật số lượng (Tăng/Giảm)
  updateQuantity(id, change) {
    let cart = this.getCart();
    const item = cart.find((p) => p.id === id);
    if (item) {
      item.quantity += change;
      if (item.quantity <= 0) {
        this.remove(id); // Nếu giảm về 0 thì xóa luôn
      } else {
        this.saveCart(cart);
      }
    }
  },

  // 6. Xóa sạch giỏ (Sau khi thanh toán)
  clear() {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event('cart-updated'));
  },
};

export default CartService;
