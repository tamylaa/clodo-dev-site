// Demo data and functionality
const demos = {
    api: {
        title: '🚀 RESTful API Demo',
        code: `// Clodo API Endpoint Example
app.get('/api/users', async (req, res) => {
  const users = await db.select('*').from('users');
  res.json({ users, count: users.length });
});

app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;

  // Automatic validation & sanitization
  const user = await db('users').insert({
    name, email, created_at: new Date()
  }).returning('*');

  res.status(201).json(user[0]);
});`,
        output: `✅ API Endpoint Created
📍 GET  /api/users     - List all users
📍 POST /api/users     - Create new user

🔒 Automatic Features:
• Input validation & sanitization
• SQL injection protection
• Rate limiting
• CORS handling
• Error handling

🚀 Deployed globally on Cloudflare Edge`
    },

    database: {
        title: '🗄️ Database Operations Demo',
        code: `// Clodo Database Example
const users = await db('users')
  .select('id', 'name', 'email')
  .where('active', true)
  .orderBy('created_at', 'desc')
  .limit(10);

const newUser = await db('users').insert({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin'
}).returning('*');

// Automatic migrations
await db.migrate.latest();`,
        output: `✅ Database Query Executed
📊 Retrieved 10 active users
👤 Created user: John Doe (admin)

🛡️ Built-in Security:
• SQL injection prevention
• Data validation
• Type safety
• Transaction support
• Automatic backups`
    },

    deployment: {
        title: '🚀 One-Click Deployment Demo',
        code: `# Deploy to Cloudflare (one command)
clodo deploy

# That's it! Your app is now:
# • Running on 200+ global edge locations
# • Auto-scaling with zero cold starts
# • Protected by Cloudflare's security
# • Monitored with real-time analytics`,
        output: `🚀 Deployment Successful!

🌍 Live URL: https://your-app.clodo.dev
⚡ Response Time: <10ms globally
🛡️ Security: Enterprise-grade
📊 Analytics: Real-time dashboard
🔄 Auto-scaling: Unlimited capacity

✨ Zero configuration required!`
    },

    security: {
        title: '🔒 Enterprise Security Demo',
        code: `// Clodo Security Features
const secureEndpoint = clodo.secure(async (req, res) => {
  // Automatic security features:
  // • JWT authentication
  // • Role-based access control
  // • Input sanitization
  // • XSS protection
  // • CSRF protection
  // • Rate limiting

  return res.json({ secure: true });
});

// Multi-tenant isolation
const tenantData = await clodo.isolate(req.tenantId)
  .select('*').from('user_data');`,
        output: `🔒 Security Features Activated

✅ Authentication: JWT + OAuth
✅ Authorization: RBAC (Role-Based Access)
✅ Data Protection: AES-256 encryption
✅ Network Security: DDoS protection
✅ Compliance: SOC 2, GDPR ready
✅ Multi-tenant: Database isolation

🛡️ Enterprise-grade security out-of-the-box!`
    }
};

let currentDemo = 'intro';
let rating = 0;

function showDemo(demoType) {
    currentDemo = demoType;
    const demo = demos[demoType];

    document.getElementById('demo-title').textContent = demo.title;
    document.getElementById('demo-output').textContent = demo.output;

    // Show feedback after first interaction
    setTimeout(() => {
        document.getElementById('feedback-section').style.display = 'block';
    }, 3000);
}

function runDemo() {
    if (currentDemo === 'intro') {
        document.getElementById('demo-output').textContent =
            'Please select a demo from the cards above first! 👆';
        return;
    }

    // Show instant preview first, then offer live execution
    const demo = demos[currentDemo];
    document.getElementById('demo-output').textContent = demo.output;

    // Add live execution option after preview
    setTimeout(() => {
        document.getElementById('demo-output').textContent +=
            '\n\n🚀 Want to run this LIVE?\n' +
            'Click "Try Live Execution" below to open a real development environment!';

        // Add live execution button
        const liveBtn = document.createElement('button');
        liveBtn.className = 'btn';
        liveBtn.style.marginTop = '1rem';
        liveBtn.textContent = '🔥 Try Live Execution';
        liveBtn.onclick = () => {
            const stackblitzUrl = `https://stackblitz.com/github/tamylaa/clodo-dev-site?file=README.md`;
            window.open(stackblitzUrl, '_blank');
        };
        document.querySelector('.interactive-demo').appendChild(liveBtn);
    }, 2000);

    // Show progression CTA after opening sandbox
    setTimeout(() => {
        document.getElementById('progression-cta').style.display = 'block';
    }, 3000);
}

function resetDemo() {
    currentDemo = 'intro';
    document.getElementById('demo-title').textContent = 'Select a demo above to get started!';
    document.getElementById('demo-output').textContent =
`Welcome to Clodo Framework Live Demo!

Experience the power of Clodo with instant previews and real execution.

Click on any demo card above to explore different features, then click "Run Demo" to see:

• Instant preview of the results
• Real code examples you can study
• Option to try live execution in a development environment

Get immediate insight, then dive deeper when ready!`;
}

function showCode() {
    if (currentDemo === 'intro') {
        document.getElementById('demo-output').textContent =
            'Select a demo first to view its code! 👆';
        return;
    }

    const demo = demos[currentDemo];
    document.getElementById('demo-output').textContent = demo.code;
}

// Rating system
document.getElementById('rating-stars').addEventListener('click', (e) => {
    if (e.target.classList.contains('star')) {
        rating = parseInt(e.target.dataset.rating);
        updateStars();
    }
});

function updateStars() {
    document.querySelectorAll('.star').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Feedback form
document.getElementById('feedback-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const feedback = document.getElementById('feedback-text').value;

    // In a real app, this would send to your backend
    console.log('Feedback submitted:', { rating, feedback });

    alert('Thank you for your feedback! 🎉');
    document.getElementById('feedback-section').style.display = 'none';

    // Show committal options modal
    setTimeout(() => {
        showTryModal(); // eslint-disable-line no-undef
    }, 1000);
});

// Progression actions
function openGitpod() {
    window.open('https://gitpod.io/#https://github.com/tamylaa/clodo-dev-site', '_blank');
}

function downloadScripts() {
    // Copy setup commands to clipboard
    const commands = [
        'PowerShell: Invoke-WebRequest -Uri "https://raw.githubusercontent.com/tamylaa/clodo-dev-site/main/setup-clodo.ps1" -OutFile "setup-clodo.ps1"; ./setup-clodo.ps1 my-app',
        'JavaScript: curl -o setup-clodo.js https://raw.githubusercontent.com/tamylaa/clodo-dev-site/main/setup-clodo.js && node setup-clodo.js my-app'
    ];

    navigator.clipboard.writeText(commands.join('\n\n')).then(() => {
        alert('Setup commands copied to clipboard! 💾');
    });
}

function visitDocs() {
    window.open('https://clodo.dev/docs.html', '_blank');
}

// Make functions globally available for modal.js
window.openGitpod = openGitpod;
window.downloadScripts = downloadScripts;
window.visitDocs = visitDocs;