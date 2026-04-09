# ProCRM - Business Management Platform

A complete, feature-rich CRM and business operations platform for service-based businesses.

## 🎯 Key Features

- **Client Management** - CRUD operations, search, export
- **Employee Management** - Team setup, roles, join codes, payroll
- **Booking & Scheduling** - Calendar views, conflict detection, status tracking
- **Revenue Tracking** - Payment logging, analytics, monthly reports
- **Payroll System** - Automated calculations (Professional+ tier)
- **Team Chat** - Owner-controlled channels, real-time messaging
- **Notifications** - In-app alerts, browser push, daily digests
- **Affiliate Program** - Partner management, commission tracking
- **PWA Support** - Works offline, installable on mobile
- **Role-Based Access** - Admin, Employee, Affiliate roles with different permissions

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start server (development with watch)
npm run dev

# Run tests
npm run test:e2e
npm run test:e2e:headed  # with UI
```

**Default Admin Login:**
- Email: `admin@procrm.local`
- Password: `Admin@12345`

## 📊 Project Status

**✅ COMPLETE:** All core features implemented and tested
- Authentication & authorization
- Full CRUD operations on all entities  
- Team chat with owner channel management
- Notification system with browser push
- Plan tiers with feature gating
- PWA with offline support

**⏳ AWAITING OWNER INPUT:**
- Stripe API keys for payment processing
- SMTP configuration for email notifications

See [PROJECT_COMPLETION_STATUS.md](PROJECT_COMPLETION_STATUS.md) for detailed feature breakdown.

## 📁 Project Structure

```
├── index.html          # Main SPA template
├── app.js              # Frontend logic and routing
├── server.js           # Express backend with APIs
├── style.css           # Application styles (dark/light themes)
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline support)
├── package.json        # Dependencies and scripts
├── tests/              # Playwright E2E test suite
└── docs/               # Documentation and guides
```

## 🔧 Tech Stack

- **Frontend:** Vanilla JS, HTML5, CSS3 (no frameworks)
- **Backend:** Node.js + Express.js
- **Database:** SQLite
- **Auth:** JWT tokens + bcryptjs hashing
- **Testing:** Playwright
- **PWA:** Service Workers

## 🔐 Security Features

- JWT authentication with configurable session timeouts
- Password hashing with bcryptjs
- Legacy password upgrade on login
- CORS headers configured
- Content Security Policy
- Role-based access control

## 📱 Responsive Design

- Desktop (1200px+): Full sidebar layout
- Tablet (768px-1199px): Collapsible sidebar
- Mobile (max 767px): Mobile-optimized navigation

## 🎨 Theme Support

- Dark theme (default)
- Light theme (high contrast, readable)
- Theme preference persists across sessions

## 📊 Key Pages

- **Dashboard** - Business overview, recent bookings
- **Clients** - Client directory with search and export
- **Employees** - Team management and roles
- **Bookings** - Service scheduling with calendar view
- **Schedule** - Weekly calendar view
- **Revenue** - Payment tracking and analytics
- **Payroll** - Automated payroll calculations
- **Team Chat** - Owner-controlled channels for team communication
- **Workspace** - Settings, preferences, integrations
- **Owner Portal** - Admin dashboard and controls
- **Affiliate Portal** - Partner management interface
- **My Portal** - Employee personal dashboard

## 🚀 Deployment

The application is production-ready. To complete setup:

1. Set environment variables:
   ```bash
   JWT_SECRET=your-secure-secret
   STRIPE_SECRET_KEY=your-stripe-key
   SMTP_FROM=notifications@yourdomain.com
   ```

2. Run tests to validate:
   ```bash
   npm run test:e2e
   ```

3. Start the server:
   ```bash
   npm start
   ```

## 📝 API Endpoints

All endpoints require authentication (JWT Bearer token):

```
GET    /api/health
GET    /api/workspace
POST   /api/auth/login
POST   /api/auth/employee-signup

GET    /api/clients
POST   /api/clients
PUT    /api/clients/:id

GET    /api/employees
POST   /api/employees
PUT    /api/employees/:id

GET    /api/bookings
POST   /api/bookings
PUT    /api/bookings/:id

GET    /api/channels
POST   /api/channels
GET    /api/channels/:id/messages
POST   /api/channels/:id/messages

... and more
```

See server.js for complete endpoint documentation.

## 🎓 Development

- No build step required - pure vanilla JS
- Single-page application (SPA)
- Responsive CSS with CSS variables for theming
- Clean separation of concerns

## 📄 License

ProCRM - All rights reserved
