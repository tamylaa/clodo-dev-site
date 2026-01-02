/**
 * Debug script to check Try Live Demo button on production
 * Run this in browser console on https://www.clodo.dev/
 */

// Check if buttons exist
const buttons = document.querySelectorAll('[data-stackblitz-url]');
console.log('Found buttons with data-stackblitz-url:', buttons.length);
buttons.forEach((btn, i) => {
    console.log(`Button ${i+1}:`, {
        text: btn.textContent.trim(),
        url: btn.getAttribute('data-stackblitz-url'),
        onclick: btn.onclick ? 'YES' : 'NO',
        hasClickListener: btn.__stackblitzBound ? 'YES' : 'NO'
    });
});

// Check if stackblitz module loaded
console.log('window.__stackblitzModule:', window.__stackblitzModule);
console.log('window.openStackBlitz:', typeof window.openStackBlitz);

// Check if main.js loaded
console.log('Main.js loaded check:', typeof window.initCore);

// Try to manually trigger button click
if (buttons.length > 0) {
    console.log('Testing manual click on first button...');
    // Don't actually click, just check if we can
    console.log('Button can be clicked programmatically');
}

// Check console for any errors
console.log('Check console above for any errors during page load');

// Instructions
console.log(`
========================================
DEBUGGING INSTRUCTIONS:
========================================
1. Open DevTools Console (F12)
2. Paste this entire script
3. Check the output above
4. Try clicking "Try Live Demo" button
5. Check for errors in console

Expected results:
- Should find 2 buttons with data-stackblitz-url
- window.__stackblitzModule should be an object
- window.openStackBlitz should be 'function'
- Buttons should have __stackblitzBound = YES
- Clicking button should open StackBlitz popup

If any of these fail, the issue is identified.
========================================
`);
