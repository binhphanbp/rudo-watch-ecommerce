import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// Plugin để rewrite URL ngắn thành đường dẫn đầy đủ
const rewritePlugin = () => ({
  name: 'rewrite-html-urls',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Các trang client
      const clientPages = [
        'index.html',
        'cart.html',
        'checkout.html',
        'login.html',
        'forgot-password.html',
        'reset-password.html',
        'product-detail.html',
        'products.html',
        'profile.html',
        'news.html',
        'introduce.html',
      ];
      // Các trang admin
      const adminPages = [
        'dashboard.html',
        'product-list.html',
        'product-add.html',
        'users.html',
        'categories.html',
        'brands.html',
        'vouchers.html',
      ];

      // Kiểm tra nếu URL là / (root) -> trang chủ client
      if (req.url === '/') {
        req.url = '/src/pages/client/index.html';
      }
      // Kiểm tra URL admin: /admin hoặc /admin/*.html
      else if (req.url === '/admin' || req.url === '/admin/') {
        req.url = '/src/pages/admin/dashboard.html';
      } else {
        const adminMatch = req.url.match(/^\/admin\/([^?#]+\.html)(.*)$/);
        if (adminMatch && adminPages.includes(adminMatch[1])) {
          req.url = `/src/pages/admin/${adminMatch[1]}${adminMatch[2] || ''}`;
        } else {
          // Kiểm tra URL client: /*.html
          const clientMatch = req.url.match(/^\/([^?#]+\.html)(.*)$/);
          if (clientMatch && clientPages.includes(clientMatch[1])) {
            req.url = `/src/pages/client/${clientMatch[1]}${
              clientMatch[2] || ''
            }`;
          }
        }
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [tailwindcss(), rewritePlugin()],
  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        // Client pages
        main: resolve(__dirname, 'src/pages/client/index.html'),
        cart: resolve(__dirname, 'src/pages/client/cart.html'),
        checkout: resolve(__dirname, 'src/pages/client/checkout.html'),
        login: resolve(__dirname, 'src/pages/client/login.html'),
        product: resolve(__dirname, 'src/pages/client/product-detail.html'),
        products: resolve(__dirname, 'src/pages/client/products.html'),
        profile: resolve(__dirname, 'src/pages/client/profile.html'),
        news: resolve(__dirname, 'src/pages/client/news.html'),
        introduce: resolve(__dirname, 'src/pages/client/introduce.html'),
        // Admin pages
        adminDashboard: resolve(__dirname, 'src/pages/admin/dashboard.html'),
        adminProductsList: resolve(
          __dirname,
          'src/pages/admin/product-list.html'
        ),
        adminProductsAdd: resolve(
          __dirname,
          'src/pages/admin/product-add.html'
        ),
        adminVouchers: resolve(__dirname, 'src/pages/admin/vouchers.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  server: {
    port: 3000,
  },
});
