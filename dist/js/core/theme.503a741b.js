class ThemeManager {
constructor() {
this.THEME_KEY = 'clodo-theme';
this.currentTheme = document.documentElement.getAttribute('data-theme') || 
this.getStoredTheme() || 
this.getSystemPreference();
}
getSystemPreference() {
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
return 'dark';
}
return 'light';
}
getStoredTheme() {
try {
return localStorage.getItem(this.THEME_KEY);
} catch (e) {
console.warn('[ThemeManager] localStorage not available', e);
return null;
}
}
saveTheme(theme) {
try {
localStorage.setItem(this.THEME_KEY, theme);
} catch (e) {
console.warn('[ThemeManager] Could not save theme', e);
}
}
applyTheme(theme) {
document.documentElement.setAttribute('data-theme', theme);
this.currentTheme = theme;
this.saveTheme(theme);
this.updateToggleButton();
}
toggle() {
const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
this.applyTheme(newTheme);
}
updateToggleButton() {
const toggleBtn = document.getElementById('theme-toggle');
if (!toggleBtn) return;
const lightIcon = toggleBtn.querySelector('.theme-icon--light');
const darkIcon = toggleBtn.querySelector('.theme-icon--dark');
if (this.currentTheme === 'dark') {
if (lightIcon) lightIcon.style.display = 'none';
if (darkIcon) darkIcon.style.display = 'inline';
} else {
if (lightIcon) lightIcon.style.display = 'inline';
if (darkIcon) darkIcon.style.display = 'none';
}
}
setupListeners() {
const toggleBtn = document.getElementById('theme-toggle');
if (!toggleBtn) {
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => this.setupListeners());
}
return;
}
toggleBtn.addEventListener('click', () => this.toggle());
}
init() {
this.setupListeners();
this.updateToggleButton();
console.log('[ThemeManager] Initialized with theme:', this.currentTheme);
}
}
function initTheme() {
const theme = new ThemeManager();
theme.init();
return theme;
}
if (typeof window !== 'undefined') {
window.ThemeManager = ThemeManager;
window.initTheme = initTheme;
}