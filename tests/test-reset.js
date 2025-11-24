import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

const form = document.createElement('form');
document.body.appendChild(form);
form.innerHTML = '<input type="text" name="username" value="testuser" required><button type="submit">Submit</button>';

console.log('Before reset:', form.querySelector('[name="username"]').value);
form.reset();
console.log('After reset:', form.querySelector('[name="username"]').value);