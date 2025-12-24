/**
 * Demo Module
 * 
 * Interactive demo system for showcasing features.
 * Customize the demos object with your own code examples.
 */

// Demo data and functionality - customize these for your product
const demos = {
    api: {
        title: '🚀 API Demo',
        code: `// Example API Endpoint
app.get('/api/users', async (req, res) => {
  const users = await db.select('*').from('users');
  res.json({ users, count: users.length });
});

app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;
  const user = await db('users').insert({
    name, email, created_at: new Date()
  }).returning('*');
  res.status(201).json(user[0]);
});`,
        output: `✅ API Endpoint Created
📍 GET  /api/users     - List all users
📍 POST /api/users     - Create new user

🔒 Features:
• Input validation
• SQL injection protection
• Rate limiting
• Error handling`
    },

    database: {
        title: '🗄️ Database Demo',
        code: `// Database Query Example
const users = await db('users')
  .select('id', 'name', 'email')
  .where('active', true)
  .orderBy('created_at', 'desc')
  .limit(10);

const newUser = await db('users').insert({
  name: 'John Doe',
  email: 'john@example.com'
}).returning('*');`,
        output: `✅ Query Executed
📊 Retrieved 10 active users
👤 Created user: John Doe

🛡️ Security:
• SQL injection prevention
• Data validation
• Type safety`
    },

    deployment: {
        title: '🚀 Deployment Demo',
        code: `# Deploy to production
npm run deploy

# Your app is now:
# • Running globally
# • Auto-scaling
# • Monitored`,
        output: `🚀 Deployment Successful!

🌍 Live URL: https://your-app.example.com
⚡ Response Time: Fast globally
📊 Monitoring: Active

✨ Zero configuration required!`
    },

    security: {
        title: '🔒 Security Demo',
        code: `// Security Features Example
const secureEndpoint = secure(async (req, res) => {
  // Built-in security:
  // • JWT authentication
  // • Role-based access control
  // • Input sanitization
  // • XSS protection
  // • CSRF protection

  return res.json({ secure: true });
});`,
        output: `🔒 Security Features Active

✅ Authentication: JWT
✅ Authorization: RBAC
✅ Data Protection: Encrypted
✅ Network Security: Protected

🛡️ Enterprise-grade security!`
    }
};

let currentDemo = 'intro';
let rating = 0;

function _showDemo(demoType) {
    currentDemo = demoType;
    const demo = demos[demoType];

    document.getElementById('demo-title').textContent = demo.title;
    document.getElementById('demo-output').textContent = demo.output;

    // Show feedback after first interaction
    setTimeout(() => {
        const feedbackSection = document.getElementById('feedback-section');
        if (feedbackSection) {
            feedbackSection.style.display = 'block';
        }
    }, 3000);
}

function _runDemo() {
    if (currentDemo === 'intro') {
        document.getElementById('demo-output').textContent =
            'Please select a demo from the cards above first! 👆';
        return;
    }

    const demo = demos[currentDemo];
    document.getElementById('demo-output').textContent = demo.output;
}

function _setRating(value) {
    rating = value;
    const stars = document.querySelectorAll('.star-rating button');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < value);
    });
    console.log(`Demo rating: ${value}/5`);
}

// Export functions for use in HTML
window._showDemo = _showDemo;
window._runDemo = _runDemo;
window._setRating = _setRating;
