import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// Plugin để rewrite URL ngắn thành đường dẫn đầy đủ
const rewritePlugin = () => ({
  name: 'rewrite-html-urls',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const htmlPages = [
        'index.html',
        'cart.html',
        'login.html',
        'product-detail.html',
        'products.html',
        'profile.html',
      ];
      // Kiểm tra nếu URL là /*.html hoặc / (root)
      if (req.url === '/') {
        req.url = '/src/pages/client/index.html';
      } else {
        const match = req.url.match(/^\/([^?#]+\.html)(.*)$/);
        if (match && htmlPages.includes(match[1])) {
          req.url = `/src/pages/client/${match[1]}${match[2] || ''}`;
        }
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [tailwindcss(), rewritePlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/client/index.html'),
        cart: resolve(__dirname, 'src/pages/client/cart.html'),
        login: resolve(__dirname, 'src/pages/client/login.html'),
        product: resolve(__dirname, 'src/pages/client/product-detail.html'),
        products: resolve(__dirname, 'src/pages/client/products.html'),
        profile: resolve(__dirname, 'src/pages/client/profile.html'),
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
