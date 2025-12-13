/**
 * Floating Action Buttons Component
 * 3 nút floating: Phone, Messenger, Back to Top
 */

import { CONTACT_INFO } from '../../../shared/config/contact.js';

class FloatingActions {
  constructor() {
    this.scrollThreshold = 200; // Hiện back-to-top sau 200px
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() {
    const existingWidget = document.getElementById('floating-actions');
    if (existingWidget) return;

    const widget = document.createElement('div');
    widget.id = 'floating-actions';
    widget.innerHTML = `
      <div class="fixed right-5 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-40">
        <!-- Phone Button -->
        <a
          href="tel:${CONTACT_INFO.phone}"
          class="floating-btn floating-phone animate-slide-in-right"
          style="animation-delay: 0s"
          aria-label="Gọi điện thoại"
          title="Hotline: ${CONTACT_INFO.phoneDisplay}"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </a>

        <!-- Messenger Button -->
        <a
          href="https://m.me/${CONTACT_INFO.messengerUsername}"
          target="_blank"
          rel="noopener noreferrer"
          class="floating-btn animate-slide-in-right"
          style="animation-delay: 0.1s"
          aria-label="Chat Facebook Messenger"
          title="Chat với chúng tôi"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.912 1.45 5.51 3.72 7.197V22l3.466-1.903c.925.254 1.903.391 2.914.391 5.523 0 10-4.145 10-9.243C22 6.145 17.523 2 12 2zm.993 12.466l-2.557-2.73-4.992 2.73 5.49-5.827 2.618 2.73 4.932-2.73-5.49 5.827z"/>
          </svg>
        </a>

        <!-- Back to Top Button -->
        <button
          id="back-to-top"
          class="floating-btn floating-back-to-top"
          aria-label="Back to top"
          title="Về đầu trang"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>

      <style>
        /* Floating Action Buttons - Professional Style */
        /* Default: Light Mode - Pure White */
        .floating-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: visible;
          
          /* Always white in light mode */
          background: #ffffff !important;
          color: #0A2A45 !important;
          box-shadow: 0 4px 16px rgba(10, 42, 69, 0.15),
                      0 2px 8px rgba(0, 0, 0, 0.1),
                      0 0 0 1px rgba(10, 42, 69, 0.1);
          border: 1.5px solid rgba(10, 42, 69, 0.12);
        }

        /* Dark mode - both class-based and media query */
        .dark .floating-btn,
        html.dark .floating-btn {
          background: rgba(30, 41, 59, 0.95) !important;
          color: white !important;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5),
                      0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .dark .floating-btn:hover,
        html.dark .floating-btn:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6),
                      0 4px 16px rgba(0, 0, 0, 0.4);
        }

        /* Light mode hover - keep white */
        .floating-btn:hover {
          transform: translateY(-3px) scale(1.08);
          box-shadow: 0 8px 30px rgba(10, 42, 69, 0.25),
                      0 4px 16px rgba(0, 0, 0, 0.15),
                      0 0 0 2px rgba(10, 42, 69, 0.15);
          background: #ffffff !important;
          border-color: #0A2A45;
        }

        .floating-btn:active {
          transform: translateY(0) scale(0.98);
        }

        /* Phone button - pulse ring with brand color */
        .floating-phone::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid #0A2A45;
          transform: translate(-50%, -50%);
          animation: phone-pulse 2.5s ease-out infinite;
          opacity: 0;
        }

        @keyframes phone-pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.6);
            opacity: 0;
          }
        }

        .floating-phone:hover::after {
          border-color: #10b981;
        }

        /* Back to top button */
        .floating-back-to-top {
          opacity: 0;
          transform: translateX(80px);
          pointer-events: none;
        }

        .floating-back-to-top.show {
          opacity: 1;
          transform: translateX(0);
          pointer-events: auto;
        }

        /* Slide in animation */
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(80px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* Responsive */
        @media (max-width: 768px) {
          #floating-actions {
            right: 0.75rem;
          }

          .floating-btn {
            width: 44px;
            height: 44px;
          }

          .floating-btn svg {
            width: 18px;
            height: 18px;
          }
        }

        /* Hide on very small screens to avoid blocking content */
        @media (max-width: 480px) {
          #floating-actions {
            display: none;
          }
        }
      </style>
    `;

    document.body.appendChild(widget);
  }

  attachEvents() {
    // Back to top button
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) {
      console.error('Back to top button not found!');
      return;
    }

    console.log('Back to top button attached');

    // Show/hide based on scroll position
    const handleScroll = () => {
      const scrolled = window.scrollY || window.pageYOffset;

      if (scrolled > this.scrollThreshold) {
        backToTopBtn.classList.add('show');
        // console.log('Back to top shown at:', scrolled);
      } else {
        backToTopBtn.classList.remove('show');
      }
    };

    // Smooth scroll to top
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      console.log('Back to top clicked');
    });

    // Throttle scroll event for performance
    let scrollTimeout;
    const throttledScroll = () => {
      if (scrollTimeout) {
        window.cancelAnimationFrame(scrollTimeout);
      }
      scrollTimeout = window.requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    // Initial check
    setTimeout(() => {
      handleScroll();
      console.log('Initial scroll check:', window.scrollY);
    }, 100);
  }

  /**
   * Update phone number
   * @param {string} phoneNumber - Số điện thoại (format: +84901234567)
   */
  updatePhoneNumber(phoneNumber) {
    const phoneBtn = document.querySelector('.floating-phone');
    if (phoneBtn) {
      phoneBtn.href = `tel:${phoneNumber}`;
    }
  }

  /**
   * Update messenger link
   * @param {string} messengerUsername - Facebook page username
   */
  updateMessengerLink(messengerUsername) {
    const messengerBtn = document.querySelector('[href^="https://m.me/"]');
    if (messengerBtn) {
      messengerBtn.href = `https://m.me/${messengerUsername}`;
    }
  }
}

// Auto initialize
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.floatingActions = new FloatingActions();

    // Có thể config số điện thoại và messenger từ đây
    // window.floatingActions.updatePhoneNumber('+84901234567');
    // window.floatingActions.updateMessengerLink('rudowatch');
  });
}

export default FloatingActions;
