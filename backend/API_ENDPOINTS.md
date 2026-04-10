# 🌐 ROTARACT CLUB MANAGEMENT SYSTEM - API ENDPOINTS

## Base URL
\`\`\`
http://localhost:5000/api
\`\`\`

---

## 🔐 AUTHENTICATION ROUTES (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register new member | Public |
| POST | `/auth/login` | Member login | Public |
| POST | `/auth/admin-login` | Admin login (Treasurer/President/Secretary) | Public |
| POST | `/auth/logout` | Logout user | Private |
| POST | `/auth/refresh-token` | Refresh access token | Public |
| POST | `/auth/forgot-password` | Request password reset | Public |
| PUT | `/auth/reset-password/:token` | Reset password with token | Public |
| PUT | `/auth/change-password` | Change password (logged in) | Private |
| GET | `/auth/me` | Get current user | Private |
| POST | `/auth/setup-2fa` | Setup 2FA | Private |
| POST | `/auth/verify-2fa` | Verify and enable 2FA | Private |
| POST | `/auth/disable-2fa` | Disable 2FA | Private |

---

## 👤 MEMBER ROUTES (`/api/members`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/members/dashboard` | Get member dashboard data | Private |
| GET | `/members/profile` | Get member profile | Private |
| PUT | `/members/profile` | Update member profile | Private |
| PUT | `/members/profile/photo` | Update profile photo | Private |
| GET | `/members/expenses` | Get member's expense history | Private |
| GET | `/members/expenses/:id` | Get single expense | Private |

---

## 💰 EXPENSE ROUTES (`/api/expenses`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/expenses` | Submit new expense | Private |
| GET | `/expenses/:id` | Get expense by ID | Private |
| GET | `/expenses/all` | Get all expenses (admin) | Admin |
| PUT | `/expenses/:id` | Update expense | Treasurer |
| PUT | `/expenses/:id/approve` | Approve expense | Treasurer |
| PUT | `/expenses/:id/reject` | Reject expense | Treasurer |
| PUT | `/expenses/:id/reimburse` | Mark as reimbursed | Treasurer |
| DELETE | `/expenses/:id` | Delete expense | Treasurer |
| POST | `/expenses/manual` | Add manual expense | Treasurer |

### Query Parameters for GET `/expenses/all`:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `status` - Filter by status (pending/approved/rejected/reimbursed/paid)
- `category` - Filter by category
- `event` - Filter by event ID
- `member` - Filter by member ID
- `month` - Filter by month (1-12)
- `year` - Filter by year
- `rotaractYear` - Filter by Rotaract year (e.g., 2025-2026)

---

## 📅 EVENT ROUTES (`/api/events`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/events` | Get all events | Private |
| GET | `/events/dropdown` | Get events for dropdown | Private |
| GET | `/events/:id` | Get event by ID | Private |
| POST | `/events` | Create new event | Admin |
| PUT | `/events/:id` | Update event | Admin |
| DELETE | `/events/:id` | Delete event | Admin |
| POST | `/events/:id/gallery` | Add gallery images | Admin |

---

## 👨‍💼 ADMIN ROUTES (`/api/admin`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/admin/dashboard` | Get admin dashboard | Admin |
| GET | `/admin/members` | Get all members | Admin |
| GET | `/admin/members/dropdown` | Get members for dropdown | Admin |
| GET | `/admin/members/:id` | Get member by ID | Admin |
| POST | `/admin/members` | Add new member | Admin |
| PUT | `/admin/members/:id` | Update member | Admin |
| PUT | `/admin/members/:id/role` | Change member role | President |
| PUT | `/admin/members/:id/alumni` | Mark as alumni | Admin |
| DELETE | `/admin/members/:id` | Delete member | President |

---

## 👥 BOARD ROUTES (`/api/board`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/board` | Get current board | Public |
| GET | `/board/history` | Get all past boards | Public |
| GET | `/board/:year` | Get board by year | Public |
| POST | `/board` | Create/update board | Admin |
| PUT | `/board/member` | Update board member | Admin |

---

## ⚙️ SETTINGS ROUTES (`/api/settings`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/settings` | Get club settings | Public (limited) / Private (full) |
| PUT | `/settings` | Update club settings | Admin |
| PUT | `/settings/logos` | Update logos | Admin |

---

## 📊 REPORT ROUTES (`/api/reports`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reports/financial-summary` | Get financial summary | Admin |
| GET | `/reports/member-wise` | Get member-wise report | Admin |
| GET | `/reports/event-wise` | Get event-wise report | Admin |
| GET | `/reports/leaderboard` | Get contribution leaderboard | Private |
| GET | `/reports/export/pdf` | Export as PDF | Admin |
| GET | `/reports/export/excel` | Export as Excel | Admin |
| GET | `/reports/export/bills` | Download bills as ZIP | Admin |

---

## 📁 ARCHIVE ROUTES (`/api/archive`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/archive` | Get all archives | Admin |
| GET | `/archive/:year` | Get archive by year | Admin |
| POST | `/archive/close-year` | Close current year | Treasurer |
| POST | `/archive/start-new-year` | Start new year | Treasurer |
| POST | `/archive/:year/files` | Add file to archive | Treasurer |

---

## 🌍 PUBLIC ROUTES (`/api/public`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/public/homepage` | Get homepage data | Public |
| GET | `/public/about-rotaract` | Get about Rotaract | Public |
| GET | `/public/about-club` | Get about club | Public |
| GET | `/public/gallery` | Get events gallery | Public |
| GET | `/public/events/:id` | Get event details | Public |
| GET | `/public/contact` | Get contact info | Public |
| GET | `/public/board` | Get current board | Public |

---

## 🔒 SECURITY FEATURES

### Authentication
- JWT-based authentication with access & refresh tokens
- Password hashing with bcrypt (12 rounds)
- Two-Factor Authentication (2FA) with TOTP

### Rate Limiting
- General: 100 requests per 15 minutes
- Auth endpoints: 10 attempts per hour

### Security Headers
- Helmet.js for HTTP security headers
- CORS with configurable origins
- NoSQL injection prevention
- Parameter pollution prevention

### Account Security
- Account lockout after 5 failed attempts (2 hours)
- Password reset with secure tokens
- Session management with refresh tokens

---

## 📝 REQUEST/RESPONSE EXAMPLES

### Register Member
\`\`\`json
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "SecurePass@123"
}
\`\`\`

### Submit Expense
\`\`\`json
POST /api/expenses
Content-Type: multipart/form-data

{
  "event": "event_id",
  "category": "travel_expense",
  "amount": 1500,
  "date": "2025-01-15",
  "paymentMode": "upi",
  "description": "Travel to event venue",
  "bill": [file]
}
\`\`\`

### Response Format
\`\`\`json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
\`\`\`

---

## 🚀 GETTING STARTED

1. Clone the repository
2. Copy `.env.example` to `.env` and configure
3. Install dependencies: `npm install`
4. Start MongoDB
5. Run server: `npm run dev`
6. API available at `http://localhost:5000/api`

---

## 📋 EXPENSE CATEGORIES

- `donation` - Donations
- `personal_contribution` - Personal Contributions
- `travel_expense` - Travel Expenses
- `accommodation` - Accommodation
- `event_material` - Event Materials
- `food_refreshments` - Food & Refreshments
- `miscellaneous` - Miscellaneous

## 📋 EVENT CATEGORIES

- `community_service` - Community Service
- `professional_development` - Professional Development
- `international_service` - International Service
- `club_service` - Club Service
- `fundraising` - Fundraising
- `social` - Social Events
- `installation` - Installation Ceremony
- `other` - Other

## 📋 USER ROLES

- `member` - Regular Member
- `director` - Director
- `secretary` - Secretary (Admin)
- `treasurer` - Treasurer (Admin)
- `president` - President (Admin)
- `alumni` - Alumni
and change home page heading like rotracty club of apollo insitute of hospitail can change cubsetting can change and change above your can change  club setting can change and remove event gallry remove link also not required.  and change data for about of our club data also change ciub setting can change. fix it