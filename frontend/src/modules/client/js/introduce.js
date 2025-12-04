// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    });
  });

  // Animate numbers on scroll
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px',
  };

  const animateNumbers = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const counters = entry.target.querySelectorAll('.text-5xl, .text-6xl');
        counters.forEach((counter) => {
          const target = counter.textContent;
          const isPercentage = target.includes('%');
          const isPlusSign = target.includes('+');
          const numericValue = parseInt(target.replace(/[^0-9]/g, ''));

          if (!numericValue) return;

          let current = 0;
          const increment = numericValue / 50;
          const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
              counter.textContent = target;
              clearInterval(timer);
            } else {
              const display = Math.floor(current);
              counter.textContent = isPlusSign
                ? `${display}${target.includes('K') ? 'K' : ''}+`
                : isPercentage
                ? `${display}%`
                : display;
            }
          }, 30);
        });
        observer.unobserve(entry.target);
      }
    });
  };

  const observer = new IntersectionObserver(animateNumbers, observerOptions);
  const statsSection = document.querySelector('.py-20.bg-\\[\\#0A2A45\\]');
  if (statsSection) {
    observer.observe(statsSection);
  }

  // Add parallax effect to hero section
  const heroSection = document.querySelector('section.relative.h-\\[600px\\]');
  if (heroSection) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const heroImg = heroSection.querySelector('img');
      if (heroImg && scrolled < 800) {
        heroImg.style.transform = `translateY(${scrolled * 0.5}px)`;
      }
    });
  }

  // Fade in animation on scroll
  const fadeElements = document.querySelectorAll(
    '.grid > div, article, .space-y-4 > p'
  );
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(20px)';
          entry.target.style.transition =
            'opacity 0.6s ease, transform 0.6s ease';

          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 100);

          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  fadeElements.forEach((el) => fadeObserver.observe(el));

  // Timeline animation
  const timelineItems = document.querySelectorAll('.space-y-12 > div');
  const timelineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateX(-50px)';
          entry.target.style.transition = `opacity 0.8s ease ${
            index * 0.2
          }s, transform 0.8s ease ${index * 0.2}s`;

          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateX(0)';
          }, 100);

          timelineObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  timelineItems.forEach((item) => timelineObserver.observe(item));
});
