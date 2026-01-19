import { isFeatureEnabled } from '../config/features.js';
const AppState = {
IDLE: 'idle',
INITIALIZING: 'initializing',
READY: 'ready',
ERROR: 'error',
DESTROYED: 'destroyed'
};
class App {
constructor(config = {}) {
this.config = {
debug: false,
autoInit: true,
modules: [],
...config
};
this.state = AppState.IDLE;
this.modules = new Map();
this.errors = [];
this.startTime = null;
this.readyTime = null;
this.init = this.init.bind(this);
this.destroy = this.destroy.bind(this);
this.handleError = this.handleError.bind(this);
if (typeof window !== 'undefined') {
window.addEventListener('error', this.handleError);
window.addEventListener('unhandledrejection', this.handleError);
}
this.log('App instance created');
}
log(...args) {
if (this.config.debug) {
console.log('[App]', ...args);
}
}
logError(...args) {
console.error('[App]', ...args);
}
register(name, module, options = {}) {
if (this.modules.has(name)) {
this.logError(`Module "${name}" already registered`);
return this;
}
const {
featureFlag = null,
required = false,
priority = 0,
dependencies = []
} = options;
if (featureFlag && !isFeatureEnabled(featureFlag)) {
this.log(`Module "${name}" disabled by feature flag`);
return this;
}
this.modules.set(name, {
instance: module,
options: { featureFlag, required, priority, dependencies },
initialized: false,
error: null
});
this.log(`Module "${name}" registered`);
return this;
}
getModule(name) {
const module = this.modules.get(name);
return module ? module.instance : null;
}
hasModule(name) {
return this.modules.has(name);
}
checkDependencies(dependencies) {
return dependencies.every(dep => {
const module = this.modules.get(dep);
return module && module.initialized;
});
}
async initModule(name) {
const moduleData = this.modules.get(name);
if (!moduleData) {
this.logError(`Module "${name}" not found`);
return false;
}
if (moduleData.initialized) {
this.log(`Module "${name}" already initialized`);
return true;
}
const { instance, options } = moduleData;
if (options.dependencies.length > 0) {
if (!this.checkDependencies(options.dependencies)) {
this.log(`Module "${name}" waiting for dependencies: ${options.dependencies.join(', ')}`);
return false;
}
}
try {
this.log(`Initializing module "${name}"...`);
if (typeof instance.init === 'function') {
await instance.init(this);
}
moduleData.initialized = true;
moduleData.error = null;
this.log(`Module "${name}" initialized successfully`);
this.emit('module:initialized', { name, module: instance });
return true;
} catch (error) {
this.logError(`Failed to initialize module "${name}":`, error);
moduleData.error = error;
this.errors.push({ module: name, error, timestamp: Date.now() });
this.emit('module:error', { name, error });
if (options.required) {
throw new Error(`Required module "${name}" failed to initialize: ${error.message}`);
}
return false;
}
}
async init() {
if (this.state !== AppState.IDLE) {
this.logError('App already initialized');
return;
}
this.state = AppState.INITIALIZING;
this.startTime = performance.now();
this.log('Initializing application...');
this.emit('app:init:start');
try {
const sortedModules = Array.from(this.modules.entries())
.sort((a, b) => b[1].options.priority - a[1].options.priority);
let maxPasses = 3;
let pass = 0;
let remainingModules = sortedModules.map(([name]) => name);
while (remainingModules.length > 0 && pass < maxPasses) {
pass++;
this.log(`Initialization pass ${pass}...`);
const newRemaining = [];
for (const name of remainingModules) {
const success = await this.initModule(name);
if (!success) {
const moduleData = this.modules.get(name);
if (moduleData.options.dependencies.length > 0 && !moduleData.error) {
newRemaining.push(name);
}
}
}
remainingModules = newRemaining;
}
if (remainingModules.length > 0) {
this.logError(`Failed to initialize modules: ${remainingModules.join(', ')}`);
}
this.readyTime = performance.now();
const duration = this.readyTime - this.startTime;
this.state = AppState.READY;
this.log(`Application ready in ${duration.toFixed(2)}ms`);
this.emit('app:ready', {
duration,
modulesInitialized: Array.from(this.modules.values()).filter(m => m.initialized).length,
modulesTotal: this.modules.size
});
} catch (error) {
this.state = AppState.ERROR;
this.logError('Application initialization failed:', error);
this.emit('app:error', { error });
throw error;
}
}
async destroyModule(name) {
const moduleData = this.modules.get(name);
if (!moduleData || !moduleData.initialized) {
return false;
}
try {
this.log(`Destroying module "${name}"...`);
if (typeof moduleData.instance.destroy === 'function') {
await moduleData.instance.destroy();
}
moduleData.initialized = false;
this.log(`Module "${name}" destroyed`);
return true;
} catch (error) {
this.logError(`Failed to destroy module "${name}":`, error);
return false;
}
}
async destroy() {
if (this.state === AppState.DESTROYED) {
return;
}
this.log('Destroying application...');
this.emit('app:destroy:start');
const sortedModules = Array.from(this.modules.entries())
.sort((a, b) => a[1].options.priority - b[1].options.priority);
for (const [name] of sortedModules) {
await this.destroyModule(name);
}
if (typeof window !== 'undefined') {
window.removeEventListener('error', this.handleError);
window.removeEventListener('unhandledrejection', this.handleError);
}
this.state = AppState.DESTROYED;
this.log('Application destroyed');
this.emit('app:destroyed');
}
emit(eventName, detail = {}) {
if (typeof window !== 'undefined') {
window.dispatchEvent(new CustomEvent(eventName, { detail }));
}
}
on(eventName, handler) {
if (typeof window !== 'undefined') {
window.addEventListener(eventName, handler);
}
return this;
}
off(eventName, handler) {
if (typeof window !== 'undefined') {
window.removeEventListener(eventName, handler);
}
return this;
}
handleError(event) {
const error = event.error || event.reason;
this.logError('Unhandled error:', error);
this.errors.push({
error,
timestamp: Date.now(),
type: event.type
});
this.emit('app:unhandled-error', { error, event });
}
getState() {
return {
state: this.state,
modules: Array.from(this.modules.entries()).map(([name, data]) => ({
name,
initialized: data.initialized,
hasError: !!data.error,
options: data.options
})),
errors: this.errors,
uptime: this.readyTime ? performance.now() - this.readyTime : null
};
}
enableDebug() {
this.config.debug = true;
return this;
}
disableDebug() {
this.config.debug = false;
return this;
}
}
if (typeof window !== 'undefined') {
window.App = App;
window.AppState = AppState;
}