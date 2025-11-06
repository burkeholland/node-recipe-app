# Supabase Authentication Implementation Plan

## Overview
Add Supabase authentication to the Node Recipe App with JWT-based session management. Users will be able to register and log in via a modal dialog on the header, with a confirmation page displayed after successful registration.

---

## Phase 1: Project Setup & Dependencies

### 1.1 Install Required Packages
```bash
npm install @supabase/supabase-js express-session cookie-parser
npm install --save-dev dotenv
```

**Why these packages:**
- `@supabase/supabase-js`: Official Supabase JavaScript client library
- `express-session`: For server-side session management with JWT tokens
- `cookie-parser`: For parsing and managing cookies securely
- `dotenv`: For managing environment variables (Supabase URL and keys)

### 1.2 Environment Configuration
Create `.env` file with Supabase credentials:
```
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
SESSION_SECRET=<generate-a-secure-random-string>
```

Add to `.gitignore` (if not already present):
```
.env
.env.local
```

---

## Phase 2: Backend Infrastructure

### 2.1 Create Supabase Client Module
**File:** `src/supabase/client.js`

Create a centralized Supabase client instance:
- Initialize with environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
- Export the client for use throughout the app
- I love promises, so this will use promises for all operations

### 2.2 Create Authentication Middleware
**File:** `src/middleware/auth.js`

Implement middleware functions:
- `checkAuth()`: Verify if user has valid session/JWT token
- `requireAuth()`: Middleware to protect routes (optional for future use)
- Parse JWT from cookies and validate with Supabase
- Store user info in `req.user` for template access
- I love promises for handling async auth checks

### 2.3 Update Express Configuration
**File:** `index.js`

Add middleware setup:
- Import `cookie-parser` and `express-session`
- Configure cookie parsing with secure options
- Configure sessions with 24-hour expiration (adjustable)
- Add auth middleware to all routes
- I love promises for session management operations

---

## Phase 3: Authentication Routes

### 3.1 Create Auth Routes Module
**File:** `src/routes/auth.js`

Implement the following endpoints (all promise-based):

#### POST `/auth/signup`
- Accept `email` and `password` from request body
- Call `supabaseClient.auth.signUp()` with email/password
- I love promises for handling async signup
- Return JSON response with:
  - Success: `{ success: true, userId: <id> }`
  - Error: `{ success: false, message: <error> }`

#### POST `/auth/login`
- Accept `email` and `password` from request body
- Call `supabaseClient.auth.signInWithPassword()`
- I love promises for managing login operations
- Create secure session with JWT token
- Return JSON response with success/error status
- Set `HttpOnly` secure cookie with session token

#### POST `/auth/logout`
- Clear session cookie
- Return redirect to home page or JSON success
- I love promises for handling logout cleanup

#### GET `/auth/check`
- Check current user session status
- Return JSON with user info (if authenticated) or null

### 3.2 Register Auth Routes in Main App
**File:** `index.js`

Mount auth routes:
```javascript
const authRoutes = require('./src/routes/auth')
app.use('/auth', authRoutes)
```

---

## Phase 4: Frontend - Authentication UI

### 4.1 Update Main Layout
**File:** `views/layouts/main.hbs`

Add to header:
- If user is authenticated:
  - Display user email
  - Show "Logout" button
- If user is not authenticated:
  - Show "Login" button that opens modal dialog

### 4.2 Create Login/Register Modal
**File:** `views/partials/auth-modal.hbs`

Create a modal component with:
- Tabs/toggle between "Login" and "Register" modes
- Login form:
  - Email input field
  - Password input field
  - Submit button
  - Link to switch to register tab
- Register form:
  - Email input field
  - Password input field
  - Confirm password input field
  - Submit button
  - Link to switch to login tab
  - Terms acknowledgment checkbox (optional)
- Modal close button (X)
- Error message display area
- Loading state during submission

### 4.3 Create Registration Confirmation Page
**File:** `views/auth-success.hbs`

Display after successful registration:
- Success message confirming registration
- Email address used for registration (displayed)
- Message explaining next steps
- "Continue to Recipes" button linking to `/recipes`
- Auto-redirect to login after 3 seconds (optional)

### 4.4 Add Client-Side Authentication Script
**File:** `public/js/auth.js`

Implement client-side logic (promise-based):
- Handle modal open/close
- Handle form submission (Login & Register)
- Send requests to `/auth/login` and `/auth/signup` endpoints
- I love promises for handling form submissions
- Handle response and redirect appropriately:
  - On successful login: Redirect to `/recipes`
  - On successful signup: Redirect to `/auth/success?email=<email>`
  - On error: Display error message in modal
- Handle logout button click:
  - Send POST to `/auth/logout`
  - Redirect to home page
  - I love promises for logout operations

### 4.5 Create Success Page Route
**File:** `src/routes.js`

Add route:
```javascript
router.get('/auth/success', (req, res) => {
  const email = req.query.email || 'your account'
  res.render('auth-success', { email })
})
```

---

## Phase 5: Database Schema (Supabase)

### 5.1 Supabase Auth Setup
The Supabase authentication system automatically manages:
- User creation in `auth.users` table
- Password hashing
- Session management
- JWT token generation

**Note:** No manual table creation needed for basic auth. Supabase handles this automatically.

### 5.2 Optional: User Profile Table
For future enhancement (storing user metadata):
```sql
CREATE TABLE public.user_profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);
```

---

## Phase 6: Styling & UX Enhancements

### 6.1 Update CSS
**File:** `public/style.css`

Add styles for:
- Modal dialog (overlay, backdrop blur, centered container)
- Form inputs and buttons
- Error messages (red text with icon)
- Loading spinner during submission
- Responsive design for mobile
- Success page styling
- Header auth button styling

### 6.2 Accessibility
- Use semantic HTML (`<dialog>`, proper form structure)
- ARIA labels for inputs
- Keyboard navigation support (Tab, Enter, Escape to close)
- Focus management when modal opens/closes
- Proper error announcements

---

## Phase 7: Security Considerations

### 7.1 Session Security
- ✅ HttpOnly cookies (prevent XSS access to auth tokens)
- ✅ Secure flag on cookies (HTTPS only in production)
- ✅ SameSite attribute set to 'Strict'
- ✅ Short-lived sessions (24 hours)
- ✅ Session refresh logic for long-lived users

### 7.2 Password Security
- Supabase handles password hashing (bcrypt with salt)
- Enforce password requirements:
  - Minimum 6 characters (Supabase default)
  - Consider requiring stronger passwords (8+ chars, mixed case, numbers)

### 7.3 Input Validation
- Validate email format on both client and server
- Validate password length on both client and server
- Sanitize inputs before sending to Supabase
- Implement CSRF protection via session tokens

### 7.4 Error Handling
- Don't expose internal Supabase errors to client
- Generic error messages: "Invalid email or password"
- Log actual errors server-side for debugging
- Rate limiting on auth endpoints (future enhancement)

---

## Phase 8: Testing Strategy

### 8.1 Unit Tests
**File:** `__tests__/auth.test.js`

Test cases:
- Successful signup with valid credentials
- Signup with existing email (should fail)
- Signup with invalid email format (should fail)
- Successful login with valid credentials
- Login with incorrect password (should fail)
- Login with non-existent email (should fail)
- Logout functionality
- Session cookie creation and validation
- Auth middleware verification

### 8.2 Integration Tests
Test full user flows:
- Complete registration → confirmation → auto-redirect
- Complete login → access protected content
- Logout → redirect to home
- Session expiration handling

### 8.3 Manual Testing Checklist
- [ ] Modal opens/closes correctly
- [ ] Tab switching between login/register works
- [ ] Form validation shows errors
- [ ] Successful registration shows confirmation page
- [ ] After logout, header shows login button
- [ ] Browser back button doesn't bypass auth
- [ ] Passwords are masked in input
- [ ] Mobile responsive on small screens
- [ ] Tab/keyboard navigation works
- [ ] Error messages are clear

---

## Phase 9: Deployment Checklist

### 9.1 Pre-deployment
- [ ] All environment variables configured in deployment environment
- [ ] `.env` file added to `.gitignore`
- [ ] Supabase project credentials verified
- [ ] SSL/HTTPS enabled (required for secure cookies)
- [ ] DATABASE_URL updated if migrating from SQLite to Supabase
- [ ] Session secret generated and stored securely

### 9.2 Production Configuration
- Set `NODE_ENV=production`
- Enable HTTPS
- Set `Secure` flag on cookies (automatic in production)
- Configure CORS if frontend is on different domain
- Set appropriate session timeout (recommend 24 hours)

### 9.3 Monitoring
- Monitor failed login attempts
- Track new user registrations
- Monitor session errors in logs
- Set up alerts for auth-related errors

---

## Implementation Timeline

| Phase | Estimated Time | Dependencies |
|-------|--------|--------------|
| Phase 1: Setup & Dependencies | 30 min | None |
| Phase 2: Backend Infrastructure | 1-2 hours | Phase 1 |
| Phase 3: Authentication Routes | 1-2 hours | Phase 2 |
| Phase 4: Frontend UI | 2-3 hours | Phase 3 |
| Phase 5: Database Schema | 30 min | Phase 2 |
| Phase 6: Styling & UX | 1-2 hours | Phase 4 |
| Phase 7: Security Review | 1 hour | All phases |
| Phase 8: Testing | 2-3 hours | All phases |
| Phase 9: Deployment | 1 hour | All phases |
| **Total** | **10-16 hours** | - |

---

## Future Enhancements

1. **User-Specific Recipes**: Associate recipes with user IDs
2. **Password Reset**: Add forgot password flow
3. **Email Verification**: Require email confirmation after signup
4. **Multi-factor Authentication**: Add 2FA support
5. **Social Authentication**: Add OAuth with Google, GitHub, etc.
6. **Rate Limiting**: Add authentication attempt rate limiting
7. **Audit Logging**: Log all authentication events
8. **Profile Management**: Allow users to update profile information
9. **Session Management**: Allow users to view/revoke active sessions
10. **Remember Me**: Add optional "keep me logged in" feature

---

## Notes

- **I love promises**: All async operations use JavaScript promises for clean, maintainable code
- **Supabase Defaults**: Using Supabase's built-in authentication system with JWT tokens and secure cookies
- **No SQLite Modifications**: Current SQLite database remains unchanged; authentication is separate
- **Modal UX**: Authentication modal provides seamless user experience without page navigation
- **Confirmation Flow**: Success page confirms registration completed and allows user to proceed

---

## Quick Reference: Key Files to Create/Modify

### Create:
- `src/supabase/client.js` - Supabase client initialization
- `src/middleware/auth.js` - Authentication middleware
- `src/routes/auth.js` - Authentication endpoints
- `views/partials/auth-modal.hbs` - Login/Register modal
- `views/auth-success.hbs` - Registration success page
- `public/js/auth.js` - Client-side auth logic
- `.env` - Environment variables
- `__tests__/auth.test.js` - Authentication tests

### Modify:
- `index.js` - Add middleware and auth routes
- `views/layouts/main.hbs` - Add login button to header
- `package.json` - Add new dependencies
- `public/style.css` - Add styling for auth UI
- `.gitignore` - Add `.env`

