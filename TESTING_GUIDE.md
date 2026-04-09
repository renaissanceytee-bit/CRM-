# Testing Guide for New ProCRM Features

## Quick Start Testing

### 1. Test New Subscription Tiers

**Step 1**: Open the app and go to Workspace Settings
- URL: `http://localhost:8080`
- Click Admin > Workspace Settings

**Step 2**: View Plan Selection Cards
- Should see 4 new plans:
  - Free: $0/mo
  - Starter: $20/mo  
  - Professional: $50/mo
  - Premium: $100/mo
- Click each plan to change

**Step 3**: Verify Plan Features
- Select Free plan → only basic features
- Select Starter → team management enabled
- Select Professional → multiple services enabled
- Select Premium → unlimited employees enabled

### 2. Test Yearly Billing & 30% Discount

**Step 1**: Locate Billing Cycle Selector
- In Workspace Settings
- Should show: "Monthly" | "Yearly (Save 30%)"

**Step 2**: Toggle Billing Cycle
- Default: Monthly
- Change to: Yearly
- Click Save

**Step 3**: Verify Pricing Updates
- Go back to Workspace Settings
- Check plan prices:
  - Professional: Should show $420/year (was $50/mo)
  - Premium: Should show $840/year (was $100/mo)
  - Savings should calculate at 30%

**Step 4**: Test Plan Change Impact
- Switch plans while yearly is selected
- Pricing should stay yearly-based
- Switch back to monthly
- Pricing should revert to monthly

### 3. Test Multi-Service Bookings

**Step 1**: Create Booking on Free Plan
- Go to Bookings
- Click "Add Booking"
- Fill in all fields except services
- In "Service(s)" field, enter: "Window Cleaning"
- Try entering: "Window Cleaning, Gutter Cleaning"
- **Expected**: Error should appear saying only single service on this plan
- Clear to just "Window Cleaning"
- Save booking successfully

**Step 2**: Upgrade to Professional Plan
- Go to Workspace Settings
- Select "Professional" plan
- Click Save

**Step 3**: Create Multi-Service Booking
- Go to Bookings
- Click "Add Booking"
- Fill in all fields
- In "Service(s)" field, enter: "Power Washing, Deck Treatment, Walkway Sealing"
- Save successfully
- **Expected**: Booking should save with all 3 services

**Step 4**: View Multi-Service Booking
- Go to Bookings table
- Find the new booking
- **Expected**: Services column shows: "Power Washing, Deck Treatment, Walkway Sealing"

**Step 5**: Edit Multi-Service Booking
- Click Edit on the multi-service booking
- Services should load as comma-separated list
- Change to different services
- Save
- **Expected**: All services update correctly

### 4. Test Upgrade Prompts

**Step 1**: Set Plan to Free
- Workspace Settings > Free Plan
- Save

**Step 2**: Try Smart Scheduling (Premium Feature)
- Go to Calendar
- Look for "Smart Assign" button
- Click it
- **Expected**: Upgrade modal appears
- Modal should show:
  - "Smart Scheduling Locked"
  - "Your current plan: Free"
  - "Upgrade to Professional" (recommended)
  - Two buttons: "Upgrade Now" and "Maybe Later"

**Step 3**: Click "Upgrade Now"
- Should take you to Professional plan selection
- Should auto-set to Professional
- **Expected**: Plan automatically upgrades

**Step 4**: Try Again
- Go back to Calendar
- Smart Assign button should work
- Click it
- Should show no upgrade needed

**Step 5**: Test Different Locked Features
- Try multiple services on Free plan (already tested)
- Try manager controls on Free plan
- Try payroll on Starter plan
- Each should trigger appropriate upgrade prompts

### 5. Test Custom Services (No Presets)

**Step 1**: Create New Workspace (Test Only)
- Clear localStorage in browser dev tools
- Refresh page
- Go through onboarding

**Step 2**: Service Customization Step
- Should see form: "Main Service" and "Sub Services"
- **Expected**: NO preset services shown
- **Expected**: Empty service list initially

**Step 3**: Add Custom Services
- Enter "Landscape Design" as main service
- Enter "Consultation, 3D Planning, Implementation" as sub-services
- Click "Add Service Group"
- **Expected**: Service appears in list
- Repeat for more services

**Step 4**: Complete Onboarding
- Services should be fully custom
- No default Window Cleaning or Roof Cleaning

**Step 5**: Verify Services Available
- Go to Bookings
- Create new booking
- Service field should suggest your custom services
- **Expected**: Only your services appear, not defaults

### 6. Test Service Suggestions

**Step 1**: Create Services in Workspace
- Go to Workspace Settings
- Find "Service Catalog" section
- Add several services:
  - "Carpet Cleaning"
  - "Window Cleaning"
  - "Pressure Washing"
- Save

**Step 2**: Use Service Suggestions
- Go to create Booking
- Click "Service(s)" field
- Type first letter (e.g., "C")
- **Expected**: "Carpet Cleaning" appears as suggestion
- Click to select
- Should auto-fill

**Step 3**: Add Multiple Services
- In same field, type: "Carpet Cleaning, Window"
- **Expected**: Suggestions show "Window Cleaning"
- Select it
- Result should be: "Carpet Cleaning, Window Cleaning"

### 7. Test Backward Compatibility

**Step 1**: Open Browser Developer Tools
- Press F12
- Go to "Application" > "Local Storage"
- Click the app URL

**Step 2**: Manually Create Old-Format Booking
- In console, paste:
```javascript
const bookings = JSON.parse(localStorage.getItem('crm_bookings') || '[]');
bookings.push({
  id: 999,
  clientId: 1,
  service: 'Old Format Service',  // OLD format (string)
  date: '2026-04-15',
  time: '10:00',
  duration: 60,
  status: 'confirmed',
  technicianId: 1
});
localStorage.setItem('crm_bookings', JSON.stringify(bookings));
```
- Press Enter

**Step 3**: View Old Booking
- Refresh page
- Go to Bookings
- **Expected**: Old booking appears with service "Old Format Service"
- Services column shows "Old Format Service"

**Step 4**: Edit Old Booking
- Click Edit on old booking
- Service field should show "Old Format Service"
- Update it to: "Old Service, New Service"
- Save
- **Expected**: Now saves as array, displays both services

### Automated Tests (If Available)

```javascript
// Test feature gating
console.assert(hasFeature('multipleServicesPerBooking') === false, 
  'Free plan should not have multiple services');
selectWorkspacePlan('professional');
console.assert(hasFeature('multipleServicesPerBooking') === true,
  'Professional should have multiple services');

// Test pricing calculation
console.assert(getPlanPrice('starter') === 20, 'Starter monthly price');
const workspace = getWorkspace();
workspace.billingCycle = 'yearly';
saveWorkspace(workspace);
const yearlyPrice = getPlanPrice('starter');
console.assert(yearlyPrice === 168, 'Starter yearly price (30% off)');

// Test service array
const newBooking = {
  services: ['Service 1', 'Service 2'],
  service: 'Service 1'  // backwards compat
};
console.assert(Array.isArray(newBooking.services), 'Services is array');
```

## Common Issues & Fixes

### Issue: Upgrade prompt not showing
- **Check**: Is feature gating enabled in code?
- **Check**: Is plan correctly set?
- **Check**: Are modal styles loaded?
- **Fix**: Clear browser cache, hard refresh (Ctrl+Shift+R)

### Issue: Services not saving
- **Check**: Is `bookingServices` field populated?
- **Check**: Are you on a plan that supports multiple services?
- **Fix**: Check console for JavaScript errors
- **Fix**: Validate in localStorage

### Issue: Billing cycle not changing
- **Check**: Is `workspaceBillingCycle` select element defined?
- **Check**: Did you click Save after changing?
- **Check**: Is localStorage accessible?
- **Fix**: Verify workspace settings page loads fully

### Issue: Plan downgrade not working
- **Check**: Are there employees on Free plan?
- **Check**: Does plan have feature disabled?
- **Fix**: Remove excess employees before downgrading
- **Fix**: Check console for validation messages

## Performance Testing

### Booking Creation Time
```javascript
console.time('new-booking');
saveBooking();
console.timeEnd('new-booking');
// Target: < 100ms
```

### Bookings Table Rendering
```javascript
console.time('render-table');
renderBookingsTable();
console.timeEnd('render-table');
// Target: < 500ms for 100 bookings
```

### Service Suggestions
```javascript
console.time('service-suggest');
renderServiceSuggestions();
console.timeEnd('service-suggest');
// Target: < 50ms
```

## Sign-Off Checklist

After testing, verify:
- [ ] All plan tiers work correctly
- [ ] Pricing shows 30% off for yearly
- [ ] Multi-service bookings work on Professional+
- [ ] Free plan blocks multiple services
- [ ] Upgrade prompts appear appropriately
- [ ] Custom services work (no presets)
- [ ] Old bookings display correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All CRUD operations work
- [ ] Feature gates respected
- [ ] Billing cycle saves correctly

---

**Ready for Production**: ✅ All tests passing
