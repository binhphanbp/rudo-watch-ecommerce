import api from './api.js';

/**
 * Review Service - Xử lý tất cả API liên quan đến đánh giá sản phẩm
 *
 * NGHIỆP VỤ:
 * - Chỉ user đã mua sản phẩm (đơn hàng completed/delivered) mới được đánh giá
 * - Mỗi user chỉ được đánh giá 1 lần cho 1 sản phẩm
 * - Rating: 1-5 sao
 */

/**
 * Lấy tất cả đánh giá của một sản phẩm
 * @param {number} productId
 * @param {Object} params - { page, limit, rating }
 * @returns {Promise<Array>} - Danh sách reviews
 */
export const getProductReviews = async (productId, params = {}) => {
  try {
    const { page = 1, limit = 10, rating = '' } = params;
    let url = `/reviews?product_id=${productId}&page=${page}&limit=${limit}`;
    if (rating) url += `&rating=${rating}`;

    const res = await api.get(url);
    return res.data?.data || res.data || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

/**
 * Kiểm tra user có quyền review sản phẩm này không
 * @param {number} productId
 * @returns {Promise<Object>} - { canReview: boolean, reason: string, orderId: number }
 */
export const canReview = async (productId) => {
  try {
    // Kiểm tra xem user có đăng nhập không
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        canReview: false,
        reason: 'Bạn cần đăng nhập để đánh giá sản phẩm',
        orderId: null,
      };
    }

    // Gọi API kiểm tra quyền review
    const res = await api.get(`/reviews/can-review/${productId}`);
    const data = res.data?.data || res.data;

    return {
      canReview: data.can_review || false,
      reason: data.reason || data.message || '',
      orderId: data.order_id || null,
      hasReviewed: data.has_reviewed || false,
    };
  } catch (error) {
    console.error('Error checking review permission:', error);

    // Nếu API trả về 401/403 = chưa đăng nhập
    if (error.response?.status === 401) {
      return {
        canReview: false,
        reason: 'Bạn cần đăng nhập để đánh giá sản phẩm',
        orderId: null,
      };
    }

    // Nếu API trả về 400/422 = chưa mua hoặc đã review
    if (error.response?.status === 400 || error.response?.status === 422) {
      return {
        canReview: false,
        reason:
          error.response.data?.message ||
          'Bạn chưa mua sản phẩm này hoặc đã đánh giá rồi',
        orderId: null,
      };
    }

    return {
      canReview: false,
      reason: 'Không thể kiểm tra quyền đánh giá',
      orderId: null,
    };
  }
};

/**
 * Gửi đánh giá sản phẩm
 * @param {Object} reviewData - {
 *   product_id: number,
 *   order_id: number,
 *   rating: number (1-5),
 *   comment: string
 * }
 * @returns {Promise<Object>} - Review đã tạo
 */
export const submitReview = async (reviewData) => {
  try {
    // Validate dữ liệu
    if (!reviewData.product_id) {
      throw new Error('Thiếu thông tin sản phẩm');
    }

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('Đánh giá phải từ 1 đến 5 sao');
    }

    if (!reviewData.comment || reviewData.comment.trim().length === 0) {
      throw new Error('Vui lòng nhập nội dung đánh giá');
    }

    // Gọi API tạo review
    const res = await api.post('/reviews', {
      product_id: reviewData.product_id,
      order_id: reviewData.order_id,
      rating: parseInt(reviewData.rating),
      comment: reviewData.comment.trim(),
    });

    return res.data?.data || res.data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

/**
 * Cập nhật đánh giá (nếu backend hỗ trợ)
 * @param {number} reviewId
 * @param {Object} updateData - { rating, comment }
 */
export const updateReview = async (reviewId, updateData) => {
  try {
    const res = await api.put(`/reviews/${reviewId}`, updateData);
    return res.data?.data || res.data;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

/**
 * Xóa đánh giá (nếu backend hỗ trợ)
 * @param {number} reviewId
 */
export const deleteReview = async (reviewId) => {
  try {
    const res = await api.delete(`/reviews/${reviewId}`);
    return res.data?.data || res.data;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

/**
 * Lấy đánh giá của user cho một sản phẩm cụ thể
 * @param {number} productId
 * @returns {Promise<Object|null>}
 */
export const getMyReview = async (productId) => {
  try {
    const res = await api.get(`/reviews/my-review/${productId}`);
    return res.data?.data || res.data || null;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // Chưa có review
    }
    console.error('Error fetching my review:', error);
    return null;
  }
};

/**
 * Tính toán tổng quan rating của sản phẩm
 * @param {Array} reviews - Danh sách reviews
 * @returns {Object} - { averageRating, totalReviews, ratingBreakdown }
 */
export const calculateRatingStats = (reviews = []) => {
  if (!reviews.length) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRating = 0;

  reviews.forEach((review) => {
    const rating = parseInt(review.rating) || 0;
    if (rating >= 1 && rating <= 5) {
      breakdown[rating]++;
      totalRating += rating;
    }
  });

  return {
    averageRating: (totalRating / reviews.length).toFixed(1),
    totalReviews: reviews.length,
    ratingBreakdown: breakdown,
  };
};

export default {
  getProductReviews,
  canReview,
  submitReview,
  updateReview,
  deleteReview,
  getMyReview,
  calculateRatingStats,
};
