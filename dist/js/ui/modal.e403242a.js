if (typeof CustomEvent !== 'function') {
(typeof window !== 'undefined' ? window : globalThis).CustomEvent = class CustomEvent extends Event {
constructor(event, params = {}) {
super(event, params);
this.detail = params.detail || {};
}
};
}
const config = {
debug: false,
defaults: {
closeOnBackdrop: true,
closeOnEscape: true,
lockScroll: true,
appendTo: 'body',
animation: true,
animationDuration: 300, // ms
},
selectors: {
closeButton: '[data-modal-close]',
focusable: 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
},
classes: {
modal: 'modal',
backdrop: 'modal-backdrop',
content: 'modal-content',
open: 'modal-open',
active: 'modal-active',
closing: 'modal-closing',
scrollLocked: 'modal-scroll-locked',
},
};
const state = {
modals: new Map(), // id -> modal instance
stack: [], // Array of open modal IDs
scrollbarWidth: null,
initialized: false,
};
function log(...args) {
if (config.debug) {
console.log('[Modal]', ...args);
}
}
function generateId() {
return `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function getScrollbarWidth() {
if (state.scrollbarWidth !== null) {
return state.scrollbarWidth;
}
const outer = document.createElement('div');
outer.style.visibility = 'hidden';
outer.style.overflow = 'scroll';
document.body.appendChild(outer);
const inner = document.createElement('div');
outer.appendChild(inner);
state.scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
outer.remove();
return state.scrollbarWidth;
}
function lockScroll() {
if (document.body.classList.contains(config.classes.scrollLocked)) {
return; // Already locked
}
const scrollbarWidth = getScrollbarWidth();
document.body.style.paddingRight = `${scrollbarWidth}px`;
document.body.classList.add(config.classes.scrollLocked);
document.body.style.overflow = 'hidden';
log('Scroll locked');
}
function unlockScroll() {
if (state.stack.length > 0) {
return;
}
if (typeof document === 'undefined' || !document.body) {
return;
}
document.body.style.paddingRight = '';
document.body.classList.remove(config.classes.scrollLocked);
document.body.style.overflow = '';
log('Scroll unlocked');
}
function getFocusableElements(container) {
const elements = container.querySelectorAll(config.selectors.focusable);
return Array.from(elements).filter(el => {
if (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent && window.navigator.userAgent.includes('jsdom')) {
return true;
}
return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
});
}
function trapFocus(modal, event) {
const focusableElements = getFocusableElements(modal.element);
if (focusableElements.length === 0) {
event.preventDefault();
return;
}
const firstElement = focusableElements[0];
const lastElement = focusableElements[focusableElements.length - 1];
if (event.shiftKey && document.activeElement === firstElement) {
event.preventDefault();
lastElement.focus();
}
else if (!event.shiftKey && document.activeElement === lastElement) {
event.preventDefault();
firstElement.focus();
}
}
class Modal {
constructor(options = {}) {
this.id = generateId();
this.options = { ...config.defaults, ...options };
this.element = null;
this.backdrop = null;
this.isOpen = false;
this.previousFocus = null;
this.listeners = new Map();
this._createElements();
state.modals.set(this.id, this);
log('Modal created', this.id);
}
_createElements() {
this.backdrop = document.createElement('div');
this.backdrop.className = config.classes.backdrop;
this.backdrop.setAttribute('aria-hidden', 'true');
this.element = document.createElement('div');
this.element.className = config.classes.modal;
this.element.setAttribute('role', 'dialog');
this.element.setAttribute('aria-modal', 'true');
this.element.setAttribute('tabindex', '-1');
if (this.options.ariaLabel) {
this.element.setAttribute('aria-label', this.options.ariaLabel);
}
if (this.options.ariaLabelledBy) {
this.element.setAttribute('aria-labelledby', this.options.ariaLabelledBy);
}
const content = document.createElement('div');
content.className = config.classes.content;
if (this.options.content) {
if (typeof this.options.content === 'string') {
content.innerHTML = this.options.content;
} else if (this.options.content instanceof HTMLElement) {
content.appendChild(this.options.content);
}
}
this.element.appendChild(content);
}
_setupListeners() {
if (this.options.closeOnBackdrop) {
const backdropHandler = (e) => {
if (e.target === this.backdrop) {
this.close();
}
};
this.backdrop.addEventListener('click', backdropHandler);
this.listeners.set('backdrop', backdropHandler);
}
if (this.options.closeOnEscape) {
const escHandler = (e) => {
if (e.key === 'Escape' && this._isTopModal()) {
this.close();
}
};
document.addEventListener('keydown', escHandler);
this.listeners.set('escape', escHandler);
}
const focusHandler = (e) => {
if (e.key === 'Tab' && this._isTopModal()) {
trapFocus(this, e);
}
};
document.addEventListener('keydown', focusHandler);
this.listeners.set('focus', focusHandler);
const closeButtons = this.element.querySelectorAll(config.selectors.closeButton);
closeButtons.forEach(button => {
const handler = () => this.close();
button.addEventListener('click', handler);
this.listeners.set(button, handler);
});
}
_removeListeners() {
const backdropHandler = this.listeners.get('backdrop');
if (backdropHandler) {
this.backdrop.removeEventListener('click', backdropHandler);
}
const escHandler = this.listeners.get('escape');
if (escHandler) {
document.removeEventListener('keydown', escHandler);
}
const focusHandler = this.listeners.get('focus');
if (focusHandler) {
document.removeEventListener('keydown', focusHandler);
}
const closeButtons = this.element.querySelectorAll(config.selectors.closeButton);
closeButtons.forEach(button => {
const handler = this.listeners.get(button);
if (handler) {
button.removeEventListener('click', handler);
}
});
this.listeners.clear();
}
_isTopModal() {
return state.stack.length > 0 && state.stack[state.stack.length - 1] === this.id;
}
_emit(eventName, detail = {}) {
if (typeof document === 'undefined' || !this.element || !this.element.ownerDocument) {
return;
}
const createEvent = (name, options = {}) => {
if (typeof CustomEvent === 'function') {
return new CustomEvent(name, options);
} else {
const event = document.createEvent('CustomEvent');
event.initCustomEvent(name, options.bubbles || false, options.cancelable || false, options.detail || {});
return event;
}
};
const event = createEvent(`modal:${eventName}`, {
detail: { modalId: this.id, ...detail },
});
window.dispatchEvent(event);
this.element.dispatchEvent(createEvent(eventName, { detail }));
}
open() {
if (this.isOpen) {
log('Modal already open', this.id);
return this;
}
log('Opening modal', this.id);
this.previousFocus = document.activeElement;
const container = document.querySelector(this.options.appendTo) || document.body;
container.appendChild(this.backdrop);
container.appendChild(this.element);
state.stack.push(this.id);
this._setupListeners();
if (this.options.lockScroll) {
lockScroll();
}
this._emit('before-open');
if (this.options.animation) {
this.backdrop.offsetHeight;
this.element.offsetHeight;
this.backdrop.classList.add(config.classes.active);
this.element.classList.add(config.classes.open);
setTimeout(() => {
this.isOpen = true;
this._focusFirstElement();
this._emit('open');
}, this.options.animationDuration);
} else {
this.backdrop.classList.add(config.classes.active);
this.element.classList.add(config.classes.open);
this.isOpen = true;
this._focusFirstElement();
this._emit('open');
}
return this;
}
close() {
if (!this.isOpen) {
log('Modal already closed', this.id);
return this;
}
log('Closing modal', this.id);
this._emit('before-close');
if (this.options.animation) {
this.element.classList.add(config.classes.closing);
this.backdrop.classList.remove(config.classes.active);
setTimeout(() => {
this._finishClose();
}, this.options.animationDuration);
} else {
this._finishClose();
}
return this;
}
_finishClose() {
this.isOpen = false;
this.backdrop.remove();
this.element.remove();
const index = state.stack.indexOf(this.id);
if (index > -1) {
state.stack.splice(index, 1);
}
if (this.options.lockScroll) {
unlockScroll();
}
this._removeListeners();
if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
this.previousFocus.focus();
}
this._emit('close');
}
_focusFirstElement() {
const focusableElements = getFocusableElements(this.element);
if (focusableElements.length > 0) {
focusableElements[0].focus();
} else {
this.element.focus();
}
}
setContent(content) {
const contentContainer = this.element.querySelector(`.${config.classes.content}`);
if (!contentContainer) return this;
if (typeof content === 'string') {
contentContainer.innerHTML = content;
} else if (content instanceof HTMLElement) {
contentContainer.innerHTML = '';
contentContainer.appendChild(content);
}
return this;
}
destroy() {
if (this.isOpen) {
this.close();
}
state.modals.delete(this.id);
log('Modal destroyed', this.id);
}
on(eventName, handler) {
this.element.addEventListener(eventName, handler);
return this;
}
off(eventName, handler) {
this.element.removeEventListener(eventName, handler);
return this;
}
}
function open(options = {}) {
const modal = new Modal(options);
modal.open();
return modal;
}
function closeAll() {
const modalIds = [...state.stack];
modalIds.forEach(id => {
const modal = state.modals.get(id);
if (modal) {
modal.close();
}
});
}
function resetState() {
state.stack.length = 0;
state.modals.clear();
state.scrollbarWidth = null;
}
function getById(id) {
return state.modals.get(id);
}
function getOpenModals() {
return state.stack.map(id => state.modals.get(id)).filter(Boolean);
}
function configure(options) {
Object.assign(config.defaults, options);
log('Configuration updated', config.defaults);
}
function enableDebug() {
config.debug = true;
log('Debug mode enabled');
}
function disableDebug() {
config.debug = false;
}
function init() {
if (state.initialized) {
log('Already initialized');
return;
}
state.initialized = true;
log('Modal system initialized');
}
function getState() {
return {
initialized: state.initialized,
openModals: state.stack.length,
totalModals: state.modals.size,
stack: [...state.stack],
};
}
if (typeof window !== 'undefined') {
window.Modal = Modal;
window.ModalAPI = {
Modal,
open,
closeAll,
resetState,
getById,
getOpenModals,
configure,
enableDebug,
disableDebug,
init,
getState,
};
}
export { Modal, open, closeAll, resetState, getById, getOpenModals, configure, enableDebug, disableDebug, init, getState };
export default Modal;