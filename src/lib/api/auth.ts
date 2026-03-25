import api from '@/lib/api';
import type { IApiResponse, IAuthResponse, ILoginRequest, IRegisterRequest, IUser } from '@/types';

export const authApi = {
  // Đăng nhập
  login: (data: ILoginRequest) =>
    api.post<IApiResponse<IAuthResponse>>('/login', data),

  // Đăng ký
  register: (data: IRegisterRequest) =>
    api.post<IApiResponse<IAuthResponse>>('/register', data),

  // Lấy thông tin profile
  getProfile: () =>
    api.get<IApiResponse<IUser>>('/profile'),

  // Cập nhật profile
  updateProfile: (data: Partial<IUser>) =>
    api.put<IApiResponse<IUser>>('/profile', data),

  // Đổi mật khẩu
  changePassword: (data: { current_password: string; new_password: string; new_password_confirmation: string }) =>
    api.put<IApiResponse<null>>('/change-password', data),

  // Quên mật khẩu
  forgotPassword: (email: string) =>
    api.post<IApiResponse<null>>('/forgot-password', { email }),

  // Reset mật khẩu
  resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
    api.post<IApiResponse<null>>('/reset-password', data),
};
