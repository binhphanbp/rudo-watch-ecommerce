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
    // Backend API: GET /reviews/product/{productId}
    let url = `/reviews/product/${productId}?page=${page}&limit=${limit}`;
    if (rating) url += `&rating=${rating}`;

    const res = await api.get(url);
    return res.data?.data || res.data || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

/**
 * Kiểm tra xem user đã review sản phẩm này chưa
 * @param {number} productId
 * @returns {Promise<Object|null>} - Review object nếu đã review, null nếu chưa
 */
export const checkUserReview = async (productId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    // Gọi API lấy review của user cho sản phẩm này
    const res = await api.get(`/reviews/my-review/${productId}`);
    return res.data?.data || res.data || null;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // Chưa review
    }
    console.error('Error checking user review:', error);
    return null;
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

    if (!reviewData.content || reviewData.content.trim().length === 0) {
      throw new Error('Vui lòng nhập nội dung đánh giá');
    }

    // Backend API expects: product_id, content, rating
    const payload = {
      product_id: parseInt(reviewData.product_id),
      content: reviewData.content.trim(),
      rating: parseInt(reviewData.rating),
    };

    console.log('📤 Submitting review:', payload);
    console.log(
      '🔐 Token:',
      localStorage.getItem('token') ? 'Exists' : 'Missing'
    );
    console.log('📍 API URL:', '/reviews');

    const res = await api.post('/reviews', payload);

    console.log('✅ Review submitted successfully:', res.data);
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error submitting review:', error);
    console.error('Error response:', error.response?.data);

    // Hiển thị lỗi chi tiết từ backend
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Không thể gửi đánh giá';

    throw new Error(errorMessage);
  }
};

/**
 * Cập nhật đánh giá
 * @param {number} reviewId
 * @param {Object} updateData - { rating, content }
 */
export const updateReview = async (reviewId, updateData) => {
  try {
    const payload = {};
    if (updateData.rating) payload.rating = parseInt(updateData.rating);
    if (updateData.content) payload.content = updateData.content.trim();

    const res = await api.put(`/reviews/${reviewId}`, payload);
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
    if (error.response?.status === 400) {
      // Backend trả về 400 khi user đã review rồi
      throw new Error(
        error.response?.data?.data?.error || 'Bạn đã đánh giá sản phẩm này rồi'
      );
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
  checkUserReview,
  submitReview,
  updateReview,
  deleteReview,
  getMyReview,
  calculateRatingStats,
};
