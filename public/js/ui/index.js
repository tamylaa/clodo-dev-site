/**
 * UI Modules Index
 * 
 * Central export point for all UI component modules.
 * UI modules handle interactive components and visual feedback.
 * 
 * Usage:
 *   import { Navigation, Modal, Tabs } from './ui/index.js';
 */

// UI Components
import NavigationComponent from './navigation-component.js';
import Modal from './modal.js';
import Tabs from './tabs.js';
import Tooltip from './tooltip.js';

export { NavigationComponent, Modal, Tabs, Tooltip };

// Future UI modules (to be implemented):
// export { default as Accordion } from './accordion.js';
// export { default as Animations } from './animations.js';
// export { default as Dropdown } from './dropdown.js';
// export { default as Toast } from './toast.js';

export default {
  NavigationComponent,
  Modal,
  Tabs,
};
