// GitHub integration - loaded after page load
async function fetchGitHubStars() {
    const starElements = document.querySelectorAll('#star-count, #github-stars');

    try {
        // Add loading state
        starElements.forEach(element => {
            element.setAttribute('aria-live', 'polite');
            element.setAttribute('aria-busy', 'true');
            element.classList.add('state-loading');
            element.innerHTML = '<span class="spinner spinner--sm" aria-hidden="true"></span>';
        });

        const response = await fetch('https://api.github.com/repos/tamylaa/clodo-framework', {
            timeout: 5000 // 5 second timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.stargazers_count !== undefined && data.stargazers_count >= 0) {
            const formattedCount = data.stargazers_count.toLocaleString();
            starElements.forEach(element => {
                element.setAttribute('aria-busy', 'false');
                element.classList.remove('state-loading');
                element.classList.add('state-success');
                element.textContent = formattedCount;
            });

            // Cache the result
            localStorage.setItem('github-stars-cache', formattedCount);
        } else {
            throw new Error('Invalid star count data');
        }
    } catch (error) {
        console.warn('Could not fetch GitHub stars:', error.message);
        // Fallback to cached or default value
        const fallbackValue = localStorage.getItem('github-stars-cache') || '—';
        starElements.forEach(element => {
            element.setAttribute('aria-busy', 'false');
            element.classList.remove('state-loading');
            element.classList.add('state-error');
            element.textContent = fallbackValue;
        });

        // Cache the fallback for future use
        if (fallbackValue !== '—') {
            localStorage.setItem('github-stars-cache', fallbackValue);
        }
    }
}

// Initialize GitHub integration when this module loads
// fetchGitHubStars();

// Exports for unit tests (Node/CommonJS environment)
/* eslint-disable no-undef */
if (typeof module === 'object' && module && typeof module.exports === 'object') {
    module.exports = {
        fetchGitHubStars
    };
}
/* eslint-enable no-undef */