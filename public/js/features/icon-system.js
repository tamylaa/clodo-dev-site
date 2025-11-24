/**
 * Icon System - Replaces emoji with accessible SVG icons
 * Provides consistent, scalable icons throughout the site
 */

class IconSystem {
  constructor() {
    this.iconCache = new Map();
    this.init();
  }

  async init() {
    // Load icon definitions
    await this.loadIconDefinitions();
    // Replace emoji in the DOM
    this.replaceEmojiInDOM();
  }

  async loadIconDefinitions() {
    const _iconMap = {
      '🎯': 'target',
      '💡': 'lightbulb',
      '🚀': 'rocket',
      '✨': 'celebration',
      '🗺️': 'map',
      '✅': 'check-circle',
      '🚧': 'construction',
      '📋': 'clipboard',
      '🏗️': 'building',
      '⚡': 'lightning',
      '🌍': 'globe',
      '🌐': 'globe',
      '🏢': 'enterprise',
      '💰': 'dollar',
      '📈': 'trending-up',
      '📊': 'bar-chart',
      '🔒': 'lock',
      '🔧': 'tools',
      '🤖': 'robot',
      '📱': 'smartphone',
      '🔄': 'refresh',
      '💻': 'computer',
      '🏃‍♂️': 'runner',
      '🐳': 'database',
      '💾': 'database',
      '🔗': 'link',
      '🎪': 'celebration',
      '🎭': 'celebration'
    };

    // Preload common icons
    const commonIcons = ['target', 'lightbulb', 'rocket', 'check-circle', 'construction', 'lightning', 'globe', 'lock', 'trending-up'];
    await Promise.all(commonIcons.map(icon => this.loadIcon(icon)));
  }

  async loadIcon(iconName) {
    if (this.iconCache.has(iconName)) {
      return this.iconCache.get(iconName);
    }

    try {
      const response = await fetch(`/icons/${iconName}.svg`);
      const svgText = await response.text();
      this.iconCache.set(iconName, svgText);
      return svgText;
    } catch (error) {
      console.warn(`Failed to load icon: ${iconName}`, error);
      return null;
    }
  }

  createIconElement(iconName, options = {}) {
    const {
      size = 20,
      className = 'icon',
      ariaLabel = null,
      _role = null
    } = options;

    const wrapper = document.createElement('span');
    wrapper.className = `icon-wrapper ${className}`;
    wrapper.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${this.iconCache.get(iconName) || ''}</svg>`;

    if (ariaLabel) {
      wrapper.setAttribute('aria-label', ariaLabel);
      wrapper.setAttribute('role', 'img');
    }

    return wrapper;
  }

  replaceEmojiInDOM() {
    const emojiMap = {
      '🎯': 'target',
      '💡': 'lightbulb',
      '🚀': 'rocket',
      '✨': 'celebration',
      '🗺️': 'map',
      '✅': 'check-circle',
      '🚧': 'construction',
      '📋': 'clipboard',
      '🏗️': 'building',
      '⚡': 'lightning',
      '🌍': 'globe',
      '🌐': 'globe',
      '🏢': 'enterprise',
      '💰': 'dollar',
      '📈': 'trending-up',
      '📊': 'bar-chart',
      '🔒': 'lock',
      '🔧': 'tools',
      '🤖': 'robot',
      '📱': 'smartphone',
      '🔄': 'refresh'
    };

    // Find all text nodes containing emoji
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return Object.keys(emojiMap).some(emoji => node.textContent.includes(emoji))
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        }
      }
    );

    const nodesToReplace = [];
    let node;
    while ((node = walker.nextNode())) {
      nodesToReplace.push(node);
    }

    // Replace emoji in text nodes
    nodesToReplace.forEach(textNode => {
      let html = textNode.textContent;
      let hasEmoji = false;

      Object.entries(emojiMap).forEach(([emoji, iconName]) => {
        if (html.includes(emoji)) {
          hasEmoji = true;
          const iconHtml = `<span class="icon-wrapper" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${this.iconCache.get(iconName) || ''}</svg></span>`;
          html = html.replace(new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), iconHtml);
        }
      });

      if (hasEmoji) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const parent = textNode.parentNode;
        while (tempDiv.firstChild) {
          parent.insertBefore(tempDiv.firstChild, textNode);
        }
        parent.removeChild(textNode);
      }
    });
  }

  // Utility method to get icon HTML
  getIconHtml(iconName, size = 20) {
    return `<span class="icon-wrapper" aria-hidden="true"><svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${this.iconCache.get(iconName) || ''}</svg></span>`;
  }
}

// Initialize icon system when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.iconSystem = new IconSystem();
  });
} else {
  window.iconSystem = new IconSystem();
}