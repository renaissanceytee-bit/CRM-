# Service Mafia Launch Checklist

> Legacy checklist note: parts of this document are outdated (branding, pricing discount values, and older feature references). For current go/no-go status and validated test evidence, see `RELEASE_READINESS.md`.

## Features Implemented ✅

### 1. Subscription Tiers ($20, $50, $100)
- **Free Plan**: $0/month
  - 1 user (owner only)
  - Basic CRM, public booking form
  - Simple client reminders
  - Affiliate program access
  
- **Starter Plan**: $20/month
  - Up to 3 employees
  - Team management
  - Payroll automation
  - Basic templates

- **Professional Plan**: $50/month  
  - Up to 10 employees
  - Advanced scheduling & reports
  - Multiple services per booking ⭐
  - Manager controls
  - Smart auto-assignment

- **Premium Plan**: $100/month
  - Unlimited employees
  - All standard features
  - Advanced dispatch board
  - Full manager controls
  - Priority support ready

### 2. Yearly Subscription with 30% Discount
- Users can select monthly or yearly billing cycle
- Yearly pricing calculates 30% savings automatically
  - Starter: $20/mo = $240/yr
  - Yearly: $168/yr (saves 30%)
  - Professional: $50/mo = $600/yr → $420/yr
  - Premium: $100/mo = $1200/yr → $840/yr
- Setting stored in workspace.billingCycle
- Prices display dynamically in UI

### 3. Upgrade Prompts for Feature Limits
- When users try to access locked features:
  - Smart scheduling (Professional+)
  - Multiple services per booking (Professional+)
  - Manager controls (Professional+)
  - Advanced reports (Professional+)
- Modal shows current plan, missing feature, and recommended upgrade
- Suggested plan is the lowest tier with the feature
- Users can upgrade immediately or dismiss

### 4. Multiple Services Per Booking
- Bookings now support array of services: `services: []`
- Backward compatible with single `service` string
- Booking form allows comma-separated services
- Free plan: Single service only
- Professional+ plans: Multiple services supported
- Services display throughout app (bookings table, reminders, etc.)

### 5. Custom Services in Onboarding
- **No preset services**: Removed default Window Cleaning, Roof Cleaning
- Users create all services from scratch
- Service groups with:
  - Main service name
  - Sub-services (optional, comma-separated)
- Fully customizable for any business type
- Supports any industry/service model

## Testing Checklist

### User Flows
- [ ] **New User Setup**
  - [ ] Sign up/login works
  - [ ] Onboarding modal appears
  - [ ] Can create custom services (no presets shown)
  - [ ] Services saved correctly
  - [ ] Default plan is "Free"

- [ ] **Plan Features**
  - [ ] Free plan shows single service field only
  - [ ] Professional plan shows multiple services field
  - [ ] Trying to add 2nd service on Free plan shows upgrade prompt
  - [ ] Upgrade prompt shows correct tier recommendations

- [ ] **Billing Cycle**
  - [ ] Default is Monthly
  - [ ] Can toggle to Yearly in Workspace settings
  - [ ] Yearly prices save correctly
  - [ ] Display correctly shows "save 30%" for yearly
  - [ ] Price calculations are correct

- [ ] **Booking Management**
  - [ ] Create booking with single service (all plans)
  - [ ] Create booking with 2+ services (Professional+ only)
  - [ ] Free plan blocks multiple services with prompt
  - [ ] Edit bookings preserves service array
  - [ ] Services display in bookings table
  - [ ] Services display in reminders/notifications

- [ ] **Service Management**
  - [ ] Add custom services in workspace settings
  - [ ] Create service during onboarding
  - [ ] Services appear in booking suggestions
  - [ ] Can delete service groups
  - [ ] No default services appear

- [ ] **Workspace Settings**
  - [ ] Billing cycle selector visible
  - [ ] Can toggle between Monthly/Yearly
  - [ ] Selection persists on save
  - [ ] Plan selection buttons work
  - [ ] Plan cards show correct pricing
  - [ ] Can auto-confirm on upgrades

### Functionality Tests
- [ ] Dashboard renders correctly
- [ ] Clients CRUD works
- [ ] Employees management available on paid plans
- [ ] Bookings create with services array
- [ ] Public booking form works
- [ ] Calendar displays services correctly
- [ ] Payroll works on Professional+
- [ ] Manager controls hidden until Professional+
- [ ] Team management locked until Starter+
- [ ] Export/import functions work
- [ ] Notifications system functions
- [ ] Revenue tracking works
- [ ] Reminders queue functions

### UI/UX Tests
- [ ] All plan tier buttons render correctly
- [ ] Pricing displays dynamically (monthly/yearly)
- [ ] Upgrade modals appear appropriately
- [ ] Form fields validate properly
- [ ] Error messages are helpful
- [ ] Success messages confirm actions
- [ ] Responsive design works on mobile
- [ ] Service suggestions appear in bookings
- [ ] No console errors (F12 developer tools)

### Edge Cases
- [ ] User with old bookings (single service string)
  - [ ] Bookings display correctly
  - [ ] Can edit old bookings
  - [ ] Services array created on save
- [ ] Switching from yearly to monthly
  - [ ] Prices calculate correctly
  - [ ] Billing date updates
- [ ] Downgrading from premium to free
  - [ ] Excess employees flagged
  - [ ] Can't save until they're removed
- [ ] Creating/editing with no services
  - [ ] Error validation works
  - [ ] Clear error messages

### Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Performance
- [ ] Page loads in < 2 seconds
- [ ] Bookings table scrolls smoothly
- [ ] Calendar renders quickly
- [ ] No significant memory leaks
- [ ] Database queries efficient
- [ ] CSV exports complete

## Pre-Launch Tasks

### Documentation
- [ ] Update README with new pricing
- [ ] Document billing cycle feature
- [ ] Create upgrade guide for users
- [ ] Document multiple services feature
- [ ] Add FAQ about pricing
- [ ] Create troubleshooting guide

### Backend/Data
- [ ] Database migrations run cleanly
- [ ] Old data migrates correctly
- [ ] Service field → services array conversion works
- [ ] Backup created before launch
- [ ] Restore procedure tested

### Marketing/Communications
- [ ] Announcement prepared for existing users
- [ ] Pricing page updated
- [ ] Sales deck updated with tiers
- [ ] Email template for upgrade prompts
- [ ] FAQ for new features
- [ ] Social media announcement ready

### Support Readiness
- [ ] Support team trained on new features
- [ ] Help docs created
- [ ] Video tutorials for:
  - [ ] Setting up custom services
  - [ ] Creating multi-service bookings
  - [ ] Changing billing cycle
  - [ ] Upgrading plans
- [ ] Support email configured
- [ ] Feedback form ready

### Monitoring
- [ ] Error tracking configured
- [ ] Usage analytics enabled
- [ ] Performance monitoring active
- [ ] Backup systems verified
- [ ] Rollback plan documented

## Launch Day

### Morning
- [ ] Final backup of production database
- [ ] Team briefing completed
- [ ] Support team standing by
- [ ] Monitoring dashboards open
- [ ] Communication channels ready

### During
- [ ] Monitor error logs
- [ ] Watch for support tickets
- [ ] Check conversion rates if applicable
- [ ] Verify all features working
- [ ] Have rollback ready

### Post-Launch
- [ ] Announce new features
- [ ] Answer initial questions
- [ ] Fix any urgent bugs found
- [ ] Collect user feedback
- [ ] Monitor for 24 hours

## Success Metrics

- [ ] 100% feature implementation complete
- [ ] All tests passing
- [ ] Zero critical bugs on launch
- [ ] User feedback positive
- [ ] Upgrade rate meets expectations
- [ ] Performance baseline established
- [ ] No data loss reported
- [ ] Support team handling load
- [ ] System stability maintained

## Post-Launch (First Week)

- [ ] Monitor all error logs daily
- [ ] Respond to all feedback
- [ ] Fix any reported bugs
- [ ] Optimize based on usage patterns
- [ ] Add usage analytics reporting
- [ ] Plan Phase 2 features
- [ ] Schedule retrospective

---

**Launch Date**: [DATE]
**Status**: Ready for Testing
**Last Updated**: [TODAY]
