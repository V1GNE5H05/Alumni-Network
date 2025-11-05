# 🎓 MSEC Alumni Network

A comprehensive web platform for Mepco Schlenk Engineering College alumni to connect, collaborate, and contribute to the college community.

## ✨ Features

### 👥 User Management
- **Alumni Registration & Login** with secure authentication
- **JWT Token-Based Sessions** for secure API access
- **Password Reset via Email** with secure token generation
- **Profile Management** with photo upload
- **Role-Based Access Control** (Admin/Alumni)

### 💬 Communication
- **Real-Time Chat System** for alumni networking
- **Post Feed** for sharing updates and achievements
- **Event Announcements** with RSVP functionality
- **Email Notifications** for important updates

### 💼 Career & Opportunities
- **Job Postings** by alumni and companies
- **Internship Opportunities** for current students
- **Mentorship Programs** connecting seniors with juniors

### 🎉 Events & Fundraising
- **Event Management** with registration tracking
- **Fundraising Campaigns** for college development
- **Gallery** showcasing alumni events and achievements

### 🔒 Security Features
- ✅ **bcrypt Password Hashing** (10 rounds)
- ✅ **JWT Authentication** with 24-hour expiration
- ✅ **Rate Limiting** (100 requests/15 min, 5 login attempts)
- ✅ **Input Validation** with Joi schemas
- ✅ **XSS Protection** via sanitization
- ✅ **Password Strength Requirements** (8+ chars, mixed case, numbers, special chars)
- ✅ **Secure Password Reset** with 1-hour token expiration

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local or Atlas)
- **Gmail Account** (for email functionality)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/V1GNE5H05/Alumni-Network.git
cd alumni-arish
```

2. **Install dependencies:**
```bash
cd server
npm install
```

3. **Configure environment variables:**
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your credentials
# Required: MONGODB_URI, EMAIL_USER, EMAIL_PASS, JWT_SECRET
```

4. **Start MongoDB:**
```bash
# If using local MongoDB
mongod
```

5. **Run the server:**
```bash
npm start
```

6. **Access the application:**
```
http://localhost:5000
```

---

## 📧 Email Configuration

The system requires email configuration for password reset functionality.

### Gmail Setup (5 minutes):

1. **Enable 2-Step Verification:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "2-Step Verification"

2. **Generate App Password:**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" → "Other (Custom name)"
   - Copy the 16-character password

3. **Update `.env` file:**
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
BASE_URL=http://localhost:5000
```

4. **Restart the server** and look for:
```
✅ Email service is ready
```

📖 **Detailed Guide:** [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)

---

## 📁 Project Structure

```
alumni-arish/
├── server/                    # Backend Node.js server
│   ├── config/               # Database configuration
│   ├── routes/               # API routes
│   │   ├── auth.js          # Authentication (login, password reset)
│   │   ├── alumni.js        # Alumni profile management
│   │   ├── events.js        # Event management
│   │   ├── jobs.js          # Job postings
│   │   ├── fundraising.js   # Fundraising campaigns
│   │   └── ...
│   ├── middleware/          # Auth, validation, error handling
│   ├── utils/              # Helper functions & email service
│   └── server.js           # Main server file
├── login/                  # Login & authentication pages
│   ├── login_page.html
│   ├── forgot_password.html
│   └── reset_password.html
├── home page/             # Main dashboard
├── alumni profile/        # Profile management
├── job_posting/          # Job board
├── event page/          # Events section
├── fund1/              # Fundraising
├── chat/              # Real-time chat
├── gallery/          # Photo gallery
└── admin/           # Admin dashboard
```

---

## 🔑 Key Technologies

### Backend:
- **Node.js** + **Express.js** - Web server framework
- **MongoDB** - NoSQL database
- **JWT** - Secure token authentication
- **bcrypt** - Password hashing
- **nodemailer** - Email service
- **Joi** - Input validation
- **express-rate-limit** - DDoS protection

### Frontend:
- **HTML5** + **CSS3** + **JavaScript**
- **Responsive Design** for mobile compatibility
- **Real-time Updates** via WebSocket

---

## 📊 Database Schema

### Collections:
- **users** - Alumni accounts (username, email, hashed password, role)
- **posts** - News feed posts
- **events** - Event listings with registrations
- **jobs** - Job postings and applications
- **fundraising** - Donation campaigns
- **chat_messages** - Real-time chat history
- **alumni_profiles** - Extended profile information

---

## 🛡️ API Endpoints

### Authentication
- `POST /api/login` - User login (returns JWT token)
- `POST /api/register` - New user registration
- `POST /api/forgot-password` - Request password reset email
- `POST /api/reset-password/:token` - Reset password with token

### Alumni Management
- `GET /api/alumni/:id` - Get alumni profile
- `PUT /api/alumni/profile` - Update profile
- `POST /api/alumni/change-password` - Change password

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event (admin)
- `POST /api/events/:id/register` - Register for event

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Post new job
- `GET /api/jobs/:id` - Get job details

### Fundraising
- `GET /api/fundraising` - List campaigns
- `POST /api/fundraising/contribute` - Make donation

---

## 👨‍💼 Admin Features

### Admin Dashboard (`/admin/admin_portal.html`)
- User management (add/remove users)
- Content moderation (posts, jobs, events)
- Fundraising campaign management
- Analytics and statistics

### Default Admin Credentials:
```
Username: admin
Password: admin123
```
⚠️ **Change this in production!**

---

## 🔧 Configuration

### Environment Variables (`.env`)
```bash
# Server
PORT=5000
BASE_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/alumni_network

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
```

---

## 🧪 Testing

### Test Password Reset Flow:
1. Navigate to `/login/forgot_password.html`
2. Enter your registered email
3. Check inbox for reset link
4. Click link to reset password
5. Login with new password

### Test Rate Limiting:
```bash
# Try 6+ login attempts rapidly
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test","password":"wrong"}'
```
Should return: `429 Too Many Requests`

---

## 📈 Future Enhancements

### High Priority:
- [ ] Email verification on registration
- [ ] WebSocket real-time chat notifications
- [ ] Profile picture upload to Cloudinary
- [ ] Advanced job search filters
- [ ] Event calendar view

### Medium Priority:
- [ ] Notification system (in-app + email)
- [ ] Alumni directory with advanced search
- [ ] Export data to Excel/PDF
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

### Low Priority:
- [ ] Mentorship matching algorithm
- [ ] Alumni success stories blog
- [ ] Integration with LinkedIn
- [ ] Dark mode
- [ ] Multi-language support

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if MongoDB is running
mongosh

# Check if port 5000 is available
netstat -ano | findstr :5000

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Email not working
```bash
# Verify .env configuration
cat server/.env

# Test email manually
node -e "require('./server/utils/email').testEmailConfig()"
```

### Database connection issues
```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/alumni_network

# Check MongoDB service status (Windows)
net start MongoDB
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

## 👥 Team

**Mepco Schlenk Engineering College**  
Alumni Network Development Team

---

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Email: support@mseceducation.in (if configured)
- Check documentation in `docs/` folder

---

## 🌟 Acknowledgments

- MSEC Administration for supporting this initiative
- All contributors and alumni who provided feedback
- Open-source community for the amazing tools

---

**Built with ❤️ for MSEC Alumni Community**