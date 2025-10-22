// Basic JavaScript for clodo.dev
document.addEventListener('DOMContentLoaded', function() {
    // Fetch GitHub stars count
    fetch('https://api.github.com/repos/tamylaa/clodo-framework')
        .then(response => response.json())
        .then(data => {
            const starCount = document.getElementById('star-count');
            if (starCount && data.stargazers_count !== undefined) {
                starCount.textContent = data.stargazers_count;
            }
        })
        .catch(error => {
            console.log('Could not fetch GitHub stars:', error);
            const starCount = document.getElementById('star-count');
            if (starCount) {
                starCount.textContent = '0';
            }
        });

    // Handle contact form submission (placeholder)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Contact form submitted! (This is a placeholder - will be connected to API in next phase)');
            contactForm.reset();
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});