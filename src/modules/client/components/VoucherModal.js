import api from '../../../shared/services/api.js';
import Swal from '../../../shared/utils/swal.js';
import { formatCurrency } from '../../../shared/utils/format.js';

export class VoucherModal {
  constructor(onApply) {
    this.onApply = onApply;
    this.vouchers = [];
    this.selectedVoucher = null;
    this.currentSubtotal = 0;
  }

  async loadVouchers() {
    try {
      console.log('🔵 Calling API: GET /vouchers');
      const res = await api.get('/vouchers');
      console.log('📦 Full API Response:', res);
      console.log('📦 Response data:', res.data);

      // Parse response structure
      let voucherList = [];

      // Try triple nested: res.data.data.data
      if (
        res.data &&
        res.data.data &&
        res.data.data.data &&
        Array.isArray(res.data.data.data)
      ) {
        voucherList = res.data.data.data;
        console.log('✅ Parsed from res.data.data.data');
      }
      // Try double nested: res.data.data
      else if (res.data && res.data.data && Array.isArray(res.data.data)) {
        voucherList = res.data.data;
        console.log('✅ Parsed from res.data.data');
      }
      // Try single nested: res.data
      else if (res.data && Array.isArray(res.data)) {
        voucherList = res.data;
        console.log('✅ Parsed from res.data');
      } else {
        console.warn(
          '⚠️ Unknown response structure, trying all data:',
          res.data
        );
        // Try to extract from any structure
        if (res.data?.data) {
          voucherList = Array.isArray(res.data.data) ? res.data.data : [];
        }
      }

      console.log('📋 Raw voucher list BEFORE filter:', voucherList);
      console.log('📋 First voucher sample:', voucherList[0]);

      // FILTER OUT vouchers without start_at - they are not ready to use
      this.vouchers = voucherList.filter(v => {
        if (!v.start_at) {
          console.log('🚫 Filtering out voucher without start_at:', v.code);
          return false;
        }
        return true;
      });

      console.log('✅ Loaded', this.vouchers.length, 'available vouchers (filtered)');
      console.log('📋 Available vouchers:', this.vouchers);

      return this.vouchers;
    } catch (error) {
      console.error('❌ Error loading vouchers:', error);
      console.error('Error details:', error.response?.data || error.message);
      return [];
    }
  }

  validateVoucher(voucher) {
    console.log('✔️ validateVoucher called with:', voucher);
    
    const now = new Date();

    // CRITICAL: Must have start_at field, otherwise not available
    if (!voucher.start_at) {
      console.log('❌ Voucher has no start_at - not available');
      return { valid: false, message: 'Mã chưa thiết lập ngày bắt đầu' };
    }

    // Check expiry - use 'expired_at' field from admin
    if (voucher.expired_at) {
      const expiredDate = new Date(voucher.expired_at);
      if (now > expiredDate) {
        console.log('❌ Voucher expired');
        return { valid: false, message: 'Mã đã hết hạn' };
      }
    }

    // Check start date - use 'start_at' field from admin
    if (voucher.start_at) {
      const startDate = new Date(voucher.start_at);
      if (now < startDate) {
        console.log('❌ Voucher not yet valid');
        return { valid: false, message: 'Mã chưa có hiệu lực' };
      }
    }

    // Check min order value
    const minOrder = voucher.min_order_value || voucher.min_order || voucher.minimum_order_value;
    if (minOrder && this.currentSubtotal < minOrder) {
      console.log('❌ Min order not met:', minOrder, 'vs', this.currentSubtotal);
      return {
        valid: false,
        message: `Đơn hàng tối thiểu ${formatCurrency(minOrder)}`,
      };
    }

    // Check usage limit
    const usageLimit = voucher.usage_limit || voucher.quantity || voucher.max_uses;
    const usedCount = voucher.used_count || voucher.used || 0;
    
    if (usageLimit && usedCount >= usageLimit) {
      console.log('❌ Usage limit reached');
      return { valid: false, message: 'Mã đã hết lượt sử dụng' };
    }

    console.log('✅ Voucher is valid');
    return { valid: true };
  }

  calculateDiscount(voucher, subtotal) {
    console.log('💰 calculateDiscount called with voucher:', voucher);

    // EXACT field names from admin: type = 'percent' or 'money'
    const discountType = voucher.type;
    // For 'percent' use 'discount', for 'money' use 'amount'
    const discountValue = voucher.type === 'percent' ? voucher.discount : voucher.amount;

    console.log('- Type:', discountType);
    console.log('- Value:', discountValue);

    if (discountType === 'percent') {
      const discount = (subtotal * discountValue) / 100;
      console.log('- Calculated percentage discount:', discount);

      // Apply max discount if exists
      const maxDiscount = voucher.max_discount_amount || voucher.max_discount;
      if (maxDiscount && discount > maxDiscount) {
        console.log('- Capped at max:', maxDiscount);
        return maxDiscount;
      }
      return discount;
    } else if (discountType === 'money') {
      // Fixed amount from 'amount' field
      const fixedDiscount = Math.min(discountValue || 0, subtotal);
      console.log('- Fixed discount:', fixedDiscount);
      return fixedDiscount;
    }
    return 0;
  }

  formatDiscount(voucher) {
    console.log('🎨 formatDiscount called with voucher:', voucher);

    // EXACT field names from admin
    const discountType = voucher.type;
    const discountValue = voucher.type === 'percent' ? voucher.discount : voucher.amount;
    const maxDiscount = voucher.max_discount_amount || voucher.max_discount;

    console.log('- Type:', discountType, '| Value:', discountValue);

    if (discountType === 'percent') {
      const text = `Giảm ${discountValue}%`;
      if (maxDiscount) {
        return `${text} (Tối đa ${formatCurrency(maxDiscount)})`;
      }
      return text;
    } else if (discountType === 'money') {
      return `Giảm ${formatCurrency(discountValue || 0)}`;
    }
    return 'Giảm giá';
  }

  formatCondition(voucher) {
    const minOrder =
      voucher.min_order_value ||
      voucher.min_order ||
      voucher.minimum_order_value;

    if (minOrder && minOrder > 0) {
      return `Đơn hàng tối thiểu ${formatCurrency(minOrder)}`;
    }
    return ''; // Return empty string instead of 'Không có điều kiện'
  }

  formatExpiry(voucher) {
    // Show remaining usage limit
    if (voucher.usage_limit) {
      return `Còn ${voucher.usage_limit} lượt`;
    }
    return 'Không giới hạn';
  }

  renderVoucherItem(voucher) {
    const validation = this.validateVoucher(voucher);
    const isDisabled = !validation.valid;

    return `
      <div class="voucher-item border ${
        isDisabled
          ? 'border-gray-200 dark:border-slate-700 opacity-50'
          : 'border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500'
      } rounded-lg p-4 mb-3 transition-colors ${
      isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
    }"
        ${
          isDisabled
            ? ''
            : `onclick="window.voucherModal.selectVoucher('${voucher.code}')"`
        }>
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
            </svg>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-1">
              <h4 class="font-bold text-slate-900 dark:text-white">${this.formatDiscount(
                voucher
              )}</h4>
              ${
                !isDisabled
                  ? `
                <button 
                  class="flex-shrink-0 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  onclick="event.stopPropagation(); window.voucherModal.selectVoucher('${voucher.code}')">
                  Chọn
                </button>
              `
                  : `
                <span class="flex-shrink-0 px-3 py-1 text-xs font-medium text-gray-400 dark:text-gray-600 border border-gray-300 dark:border-gray-700 rounded">
                  Không đủ điều kiện
                </span>
              `
              }
            </div>
            
            ${this.formatCondition(voucher) ? `
            <p class="text-sm ${
              isDisabled
                ? 'text-gray-400 dark:text-gray-600'
                : 'text-gray-600 dark:text-gray-400'
            } mb-1">
              ${this.formatCondition(voucher)}
            </p>
            ` : ''}
            
            ${
              !validation.valid
                ? `
              <p class="text-xs text-red-500 dark:text-red-400 mb-1">
                ${validation.message}
              </p>
            `
                : ''
            }
            
            <div class="flex items-center justify-between gap-2 text-xs">
              <span class="${
                isDisabled
                  ? 'text-gray-400 dark:text-gray-600'
                  : 'text-gray-500 dark:text-gray-500'
              }">${this.formatExpiry(voucher)}</span>
              <div class="flex items-center gap-1">
                <span class="text-gray-400 dark:text-gray-500">Mã:</span>
                <span class="font-mono font-medium ${
                  isDisabled
                    ? 'text-gray-400 dark:text-gray-600'
                    : 'text-blue-600 dark:text-blue-400'
                }">${voucher.code}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getModalHTML() {
    return `
      <div class="fixed inset-0 z-50 hidden" id="voucher-modal-overlay">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" onclick="window.voucherModal.close()"></div>
        
        <!-- Modal -->
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              
              <!-- Header -->
              <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
                <h3 class="text-xl font-bold text-slate-900 dark:text-white">Chọn mã khuyến mãi</h3>
                <button onclick="window.voucherModal.close()" class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Body -->
              <div class="p-5 max-h-[60vh] overflow-y-auto">
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nhập mã khuyến mãi
                  </label>
                  <div class="flex gap-2">
                    <input 
                      type="text" 
                      id="manual-voucher-code"
                      placeholder="Nhập mã khuyến mãi"
                      class="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white uppercase"
                      onkeypress="if(event.key==='Enter') window.voucherModal.applyManualCode()"
                    />
                    <button 
                      onclick="window.voucherModal.applyManualCode()"
                      class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                      Áp dụng
                    </button>
                  </div>
                </div>

                <div class="mb-3">
                  <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ưu đãi của bạn</h4>
                  <div id="voucher-list">
                    <div class="flex items-center justify-center py-8">
                      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </div>
                </div>

                <p id="voucher-modal-footer-text" class="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                  Chưa chọn mã giảm giá
                </p>
              </div>

              <!-- Footer -->
              <div class="p-5 border-t border-gray-200 dark:border-slate-700">
                <button 
                  onclick="window.voucherModal.apply()"
                  class="w-full px-6 py-3 bg-[#0A2A45] dark:bg-blue-600 hover:bg-[#153e60] dark:hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md">
                  Đồng ý
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    `;
  }

  async show(currentSubtotal = 0) {
    this.currentSubtotal = currentSubtotal;
    console.log(
      '🔵 VoucherModal.show() called with subtotal:',
      currentSubtotal
    );

    // Get or create modal container
    let modalContainer = document.getElementById('voucher-modal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'voucher-modal';
      document.body.appendChild(modalContainer);
    }

    // Always inject/update modal HTML
    modalContainer.innerHTML = this.getModalHTML();

    // Load vouchers
    console.log('🔵 Loading vouchers...');
    await this.loadVouchers();
    console.log('✅ Loaded', this.vouchers.length, 'vouchers');
    this.render();

    // Show modal overlay
    const overlay = document.getElementById('voucher-modal-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      console.log('✅ Modal displayed');
    } else {
      console.error('❌ Modal overlay not found!');
    }
  }

  close() {
    const overlay = document.getElementById('voucher-modal-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
      console.log('✅ Modal closed');
    }
  }

  render() {
    const list = document.getElementById('voucher-list');
    if (!list) {
      console.error('❌ voucher-list element not found');
      return;
    }

    if (this.vouchers.length === 0) {
      list.innerHTML = `
        <div class="text-center py-8">
          <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
          </svg>
          <p class="text-gray-500 dark:text-gray-400 font-medium mb-1">Không có mã giảm giá khả dụng</p>
          <p class="text-sm text-gray-400 dark:text-gray-500">Bạn có thể nhập mã thủ công ở trên</p>
        </div>
      `;
      return;
    }

    console.log('🎨 Rendering', this.vouchers.length, 'vouchers');
    list.innerHTML = this.vouchers
      .map((v) => this.renderVoucherItem(v))
      .join('');
  }

  selectVoucher(code) {
    const voucher = this.vouchers.find((v) => v.code === code);
    if (!voucher) return;

    const validation = this.validateVoucher(voucher);
    if (!validation.valid) {
      return Swal.fire({
        icon: 'warning',
        title: 'Không thể áp dụng',
        text: validation.message,
        confirmButtonText: 'Đã hiểu',
      });
    }

    this.selectedVoucher = voucher;

    // Highlight selected
    document.querySelectorAll('.voucher-item').forEach((item) => {
      item.classList.remove(
        'border-blue-500',
        'dark:border-blue-500',
        'bg-blue-50',
        'dark:bg-blue-900/10'
      );
    });

    event.currentTarget.classList.add(
      'border-blue-500',
      'dark:border-blue-500',
      'bg-blue-50',
      'dark:bg-blue-900/10'
    );

    // Update footer text
    const footerText = document.getElementById('voucher-modal-footer-text');
    if (footerText) {
      footerText.textContent = `Đã chọn: ${
        voucher.code
      } - ${this.formatDiscount(voucher)}`;
      footerText.classList.remove('text-gray-500', 'dark:text-gray-400');
      footerText.classList.add(
        'text-blue-600',
        'dark:text-blue-400',
        'font-medium'
      );
    }
  }

  async applyManualCode() {
    const input = document.getElementById('manual-voucher-code');
    const code = input.value.trim().toUpperCase();

    if (!code) {
      return Swal.fire({
        icon: 'warning',
        title: 'Vui lòng nhập mã',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
      });
    }

    try {
      console.log('🔵 Searching for voucher code:', code);

      // Find voucher in already loaded and filtered list
      const voucher = this.vouchers.find(v => v.code === code);

      if (!voucher) {
        console.log('❌ Voucher not found in available list');
        return Swal.fire({
          icon: 'error',
          title: 'Mã không hợp lệ',
          text: 'Mã khuyến mãi không tồn tại hoặc không khả dụng',
          confirmButtonText: 'Đã hiểu',
        });
      }

      console.log('✅ Voucher found:', voucher);

      // Validate voucher with current subtotal
      const validation = this.validateVoucher(voucher);
      if (!validation.valid) {
        return Swal.fire({
          icon: 'warning',
          title: 'Không thể áp dụng',
          text: validation.message,
          confirmButtonText: 'Đã hiểu',
        });
      }

      // Calculate discount
      const discount = this.calculateDiscount(voucher, this.currentSubtotal);
      voucher.discount_amount = discount;

      // Apply voucher
      this.selectedVoucher = voucher;
      this.onApply(voucher);
      this.close();

      Swal.fire({
        icon: 'success',
        title: 'Áp dụng thành công!',
        text: `Đã áp dụng mã ${code}`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      console.error('❌ Error applying voucher:', error);

      return Swal.fire({
        icon: 'error',
        title: 'Có lỗi xảy ra',
        text: 'Vui lòng thử lại sau',
        confirmButtonText: 'Đã hiểu',
      });
    }
  }

  apply() {
    if (this.selectedVoucher) {
      const discount = this.calculateDiscount(
        this.selectedVoucher,
        this.currentSubtotal
      );

      const voucherData = {
        ...this.selectedVoucher,
        discount_amount: discount,
      };

      this.onApply(voucherData);
      this.close();
    } else {
      // Close without applying
      this.close();
    }
  }
}

// Global instance
window.voucherModal = null;

export function initVoucherModal(onApply) {
  window.voucherModal = new VoucherModal(onApply);
  return window.voucherModal;
}
