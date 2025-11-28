/**
 * 现代化视差卡片效果 JavaScript
 * 实现滚动视差、3D倾斜、聚焦动画等交互效果
 */

(function() {
  'use strict';

  // ========================================
  // 工具函数
  // ========================================

  /**
   * 节流函数 - 优化性能
   */
  function throttle(func, wait) {
    let timeout;
    let previous = 0;
    return function(...args) {
      const now = Date.now();
      const remaining = wait - (now - previous);

      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        func.apply(this, args);
      } else if (!timeout) {
        timeout = setTimeout(() => {
          previous = Date.now();
          timeout = null;
          func.apply(this, args);
        }, remaining);
      }
    };
  }

  /**
   * 防抖函数
   */
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * 获取元素在视口中的位置
   */
  function getElementViewportPosition(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    return {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      centerY: rect.top + rect.height / 2,
      centerX: rect.left + rect.width / 2,
      percentY: (rect.top + rect.height / 2) / windowHeight,
      percentX: (rect.left + rect.width / 2) / windowWidth,
      isInViewport: rect.top < windowHeight && rect.bottom > 0
    };
  }

  // ========================================
  // 滚动视差效果
  // ========================================

  class ParallaxScroll {
    constructor() {
      this.cards = document.querySelectorAll('.recent-post-item, .article-sort-item');
      this.init();
    }

    init() {
      if (this.cards.length === 0) return;

      // 初始化时检查一次
      this.updateParallax();

      // 滚动时更新（使用节流优化性能）
      window.addEventListener('scroll', throttle(() => {
        this.updateParallax();
      }, 10), { passive: true });

      // 窗口大小改变时更新
      window.addEventListener('resize', debounce(() => {
        this.updateParallax();
      }, 250));
    }

    updateParallax() {
      this.cards.forEach((card, index) => {
        const pos = getElementViewportPosition(card);

        if (!pos.isInViewport) return;

        // 计算视差偏移量（基于元素在视口中的位置）
        const scrollPercentage = 1 - pos.percentY;
        const parallaxOffset = scrollPercentage * 30; // 最大30px偏移

        // 应用视差效果（使用transform以提升性能）
        const baseDelay = index * 0.05; // 每个卡片延迟
        const scale = 1 + (scrollPercentage - 0.5) * 0.02; // 微小缩放效果
        const opacity = Math.min(1, 0.3 + scrollPercentage * 0.7); // 透明度渐变

        card.style.transform = `translateY(${parallaxOffset}px) scale(${scale})`;
        card.style.opacity = opacity;
        card.style.transition = `transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${baseDelay}s, opacity 0.3s ease ${baseDelay}s`;
      });
    }
  }

  // ========================================
  // 3D 倾斜效果（鼠标跟随）
  // ========================================

  class Card3DTilt {
    constructor() {
      this.cards = document.querySelectorAll('.recent-post-item');
      this.maxTilt = 10; // 最大倾斜角度
      this.init();
    }

    init() {
      if (this.cards.length === 0) return;

      this.cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          card.classList.add('card-3d-active');
        });

        card.addEventListener('mousemove', (e) => {
          this.handleMouseMove(e, card);
        });

        card.addEventListener('mouseleave', () => {
          this.handleMouseLeave(card);
        });
      });
    }

    handleMouseMove(e, card) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // 鼠标在卡片内的x坐标
      const y = e.clientY - rect.top;  // 鼠标在卡片内的y坐标

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // 计算旋转角度
      const rotateY = ((x - centerX) / centerX) * this.maxTilt;
      const rotateX = -((y - centerY) / centerY) * this.maxTilt;

      // 应用3D变换
      card.style.setProperty('--rotate-x', `${rotateX}deg`);
      card.style.setProperty('--rotate-y', `${rotateY}deg`);
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
      card.style.transition = 'transform 0.1s ease-out';

      // 添加光泽效果
      this.addGloss(card, x, y, rect);
    }

    handleMouseLeave(card) {
      card.classList.remove('card-3d-active');
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';

      // 移除光泽
      const gloss = card.querySelector('.card-gloss');
      if (gloss) {
        gloss.remove();
      }
    }

    addGloss(card, x, y, rect) {
      let gloss = card.querySelector('.card-gloss');

      if (!gloss) {
        gloss = document.createElement('div');
        gloss.className = 'card-gloss';
        gloss.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          background: radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.15) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: inherit;
        `;
        card.style.position = 'relative';
        card.appendChild(gloss);
      } else {
        gloss.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.15) 0%, transparent 50%)`;
      }

      // 淡入光泽
      requestAnimationFrame(() => {
        gloss.style.opacity = '1';
      });
    }
  }

  // ========================================
  // 滚动动画观察器
  // ========================================

  class ScrollAnimationObserver {
    constructor() {
      this.elements = document.querySelectorAll('.recent-post-item, .article-sort-item, #page-header');
      this.init();
    }

    init() {
      if (!('IntersectionObserver' in window)) {
        // 浏览器不支持IntersectionObserver，直接显示所有元素
        this.elements.forEach(el => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
        return;
      }

      const options = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: [0, 0.1, 0.5, 1.0]
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // 元素进入视口
            entry.target.classList.add('is-visible');

            // 计算进入视口的程度
            const ratio = entry.intersectionRatio;
            entry.target.style.setProperty('--visibility-ratio', ratio);
          } else {
            // 可选：元素离开视口时移除类
            // entry.target.classList.remove('is-visible');
          }
        });
      }, options);

      this.elements.forEach(el => {
        observer.observe(el);
      });
    }
  }

  // ========================================
  // 平滑滚动到顶部
  // ========================================

  class SmoothScrollToTop {
    constructor() {
      this.button = this.createButton();
      this.init();
    }

    createButton() {
      const btn = document.createElement('button');
      btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
      btn.className = 'scroll-to-top';
      btn.setAttribute('aria-label', '返回顶部');
      btn.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
        z-index: 1000;
        pointer-events: none;
      `;

      document.body.appendChild(btn);
      return btn;
    }

    init() {
      // 监听滚动，显示/隐藏按钮
      window.addEventListener('scroll', throttle(() => {
        if (window.pageYOffset > 300) {
          this.button.style.opacity = '1';
          this.button.style.transform = 'translateY(0)';
          this.button.style.pointerEvents = 'auto';
        } else {
          this.button.style.opacity = '0';
          this.button.style.transform = 'translateY(20px)';
          this.button.style.pointerEvents = 'none';
        }
      }, 100), { passive: true });

      // 点击按钮滚动到顶部
      this.button.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });

      // 悬停效果
      this.button.addEventListener('mouseenter', () => {
        this.button.style.transform = 'translateY(0) scale(1.1)';
        this.button.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.6)';
      });

      this.button.addEventListener('mouseleave', () => {
        if (window.pageYOffset > 300) {
          this.button.style.transform = 'translateY(0) scale(1)';
          this.button.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
        }
      });
    }
  }

  // ========================================
  // 页面头部视差效果
  // ========================================

  class HeaderParallax {
    constructor() {
      this.header = document.querySelector('#page-header');
      this.init();
    }

    init() {
      if (!this.header) return;

      window.addEventListener('scroll', throttle(() => {
        const scrolled = window.pageYOffset;
        const parallaxSpeed = 0.5;

        // 视差移动
        this.header.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;

        // 渐变透明度
        const opacity = Math.max(0, 1 - scrolled / 500);
        this.header.style.opacity = opacity;
      }, 10), { passive: true });
    }
  }

  // ========================================
  // 鼠标跟随光标效果（可选）
  // ========================================

  class CursorGlow {
    constructor() {
      this.cursor = this.createCursor();
      this.init();
    }

    createCursor() {
      const cursor = document.createElement('div');
      cursor.className = 'cursor-glow';
      cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(102, 126, 234, 0.4) 0%, transparent 70%);
        pointer-events: none;
        transform: translate(-50%, -50%);
        transition: width 0.2s ease, height 0.2s ease, opacity 0.2s ease;
        opacity: 0;
        z-index: 9999;
        mix-blend-mode: screen;
      `;

      document.body.appendChild(cursor);
      return cursor;
    }

    init() {
      // 仅在桌面设备上启用
      if (window.innerWidth < 768) {
        this.cursor.remove();
        return;
      }

      document.addEventListener('mousemove', (e) => {
        this.cursor.style.left = e.clientX + 'px';
        this.cursor.style.top = e.clientY + 'px';
        this.cursor.style.opacity = '1';
      });

      document.addEventListener('mouseleave', () => {
        this.cursor.style.opacity = '0';
      });

      // 悬停卡片时放大光标
      document.querySelectorAll('.recent-post-item, .article-sort-item').forEach(card => {
        card.addEventListener('mouseenter', () => {
          this.cursor.style.width = '60px';
          this.cursor.style.height = '60px';
        });

        card.addEventListener('mouseleave', () => {
          this.cursor.style.width = '20px';
          this.cursor.style.height = '20px';
        });
      });
    }
  }

  // ========================================
  // 性能监控与优化
  // ========================================

  class PerformanceMonitor {
    constructor() {
      this.preferReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    shouldEnableAnimations() {
      return !this.preferReducedMotion;
    }
  }

  // ========================================
  // 初始化所有效果
  // ========================================

  function init() {
    // 检测用户是否偏好减少动画
    const monitor = new PerformanceMonitor();

    if (!monitor.shouldEnableAnimations()) {
      console.log('用户偏好减少动画，部分效果已禁用');
      return;
    }

    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initEffects);
    } else {
      initEffects();
    }
  }

  function initEffects() {
    // 初始化滚动视差
    new ParallaxScroll();

    // 初始化3D倾斜效果（仅桌面端）
    if (window.innerWidth >= 768) {
      new Card3DTilt();
      // new CursorGlow(); // 可选：启用光标特效
    }

    // 初始化滚动动画观察器
    new ScrollAnimationObserver();

    // 初始化返回顶部按钮
    new SmoothScrollToTop();

    // 初始化页面头部视差
    new HeaderParallax();

    console.log('✨ 视差卡片效果已启动');
  }

  // 启动
  init();

})();
