// Main script for blog pages and simple pages
// Loads essential navigation functionality

// Load navigation component
import('./js/ui/navigation-component.js')
  .then(module => {
    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (module.init) {
          module.init();
          console.log('✓ Navigation loaded and initialized');
        } else {
          console.log('✓ Navigation loaded');
        }
      });
    } else {
      // DOM is already ready
      if (module.init) {
        module.init();
        console.log('✓ Navigation loaded and initialized');
      } else {
        console.log('✓ Navigation loaded');
      }
    }
  })
  .catch(error => {
    console.error('Failed to load navigation:', error);
  });

// Load features config
import('./js/config/features.js')
  .then(() => {
    console.log('✓ Features config loaded');
  })
  .catch(error => {
    console.error('Failed to load features config:', error);
  });