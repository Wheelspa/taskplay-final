# TaskPro - Product Requirements Document

## Original Problem Statement
Build a comprehensive task management application named "TaskPro" with:
- Task scheduling (postponing/preponing)
- Task priorities including "Super Important" with popup alerts
- Click-to-call phone integration
- Interactive map location picker with search
- Paid account creation via Razorpay (currently MOCKED)
- WhatsApp messaging for tasks (planned)
- Points-based scoring system with achievements
- Penalty system for delayed tasks
- Automatic monthly task clearing
- Calendar view for task overview
- Team collaboration features
- Voice command task creation
- Task groups for organization

## Tech Stack
- **Backend:** FastAPI + MongoDB (motor)
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Maps:** Leaflet (react-leaflet)
- **Calendar:** react-day-picker (via Shadcn Calendar)
- **Auth:** JWT-based authentication
- **Voice:** Web Speech API (browser native)

## Current Status
**Last Updated:** January 25, 2026

### Completed Features ✅

#### 1. User Authentication & Membership
- Registration with membership plan selection
- Two membership tiers: Basic and Premium
- Monthly and Yearly billing options
- JWT-based login/logout
- Protected routes
- **Premium-only route protection** (Calendar restricted for Basic users)

#### 2. Membership Plans
| Plan | Monthly | Yearly | Features |
|------|---------|--------|----------|
| Basic | ₹90/month | ₹499/year | 50 tasks/month, Basic analytics, Email support |
| Premium | ₹180/month | ₹999/year | Unlimited tasks, Advanced analytics, Team collaboration, Priority support, Custom reports, Calendar view, API access |

- **Payment:** MOCKED (Razorpay integration ready, USE_MOCK_PAYMENT=true)
- **Discount Code:** EARLYBIRD - 50% off (Backend validated, expires Jun 30, 2026)
- Membership status displayed on dashboard with expiration date

#### 3. Task Management
- Full CRUD operations
- Priority levels: low, medium, high, super_important
- Status tracking: pending, in_progress, completed
- Scheduled date and time slots
- Location picker with interactive map and search
- Click-to-call phone links
- Assignee information
- **Task Groups** - Organize tasks into color-coded groups

#### 4. Task Groups Feature ✅ (NEW)
- Create, edit, delete task groups
- Color-coded groups (8 colors available)
- Task count per group
- Group selection dropdown in task creation form
- View tasks by group
- Tasks ungrouped (not deleted) when group is deleted

#### 5. Voice Command Task Creation ✅ (NEW)
- Voice input via Web Speech API
- Frontend NLP parsing for:
  - Priority detection (super important, high, low)
  - Date detection (today, tomorrow, next week)
  - Group detection (matches existing group names)
- Task preview/edit before creation
- Example commands provided in UI

#### 6. Scoring System
- Points awarded on task completion (2-5 based on priority)
- Daily, monthly, and all-time score tracking
- -5 penalty for tasks delayed >3 days

#### 7. Achievement System
- Bronze badge at 25 monthly points
- Silver badge at 50 monthly points
- Gold badge at 75 monthly points
- Platinum badge at 100 monthly points
- Celebration modal on achievement unlock

#### 8. Calendar View (Premium Only) ✅
- Full month calendar with task indicators
- Color-coded dots for priorities
- Click any date to see tasks for that day
- Priority filter dropdown
- "TODAY" button for quick navigation
- **Basic users redirected to /upgrade?feature=calendar**

#### 9. Team Collaboration (MVP)
- Create and view teams
- View team members
- Add/remove team members (owner/admin only)
- Role-based permissions (Owner, Admin, Member)

#### 10. UI Features
- Super Important task popup alerts
- Quick status change from dashboard
- Auto-delete completed tasks
- "Add Task" button in main navigation
- Autocomplete suggestions from previous tasks
- Brand ambassador imagery across app

#### 11. Automatic Monthly Cleanup
- All tasks cleared at start of each month
- Runs on server startup on day 1

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration with membership
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Tasks
- `GET /api/tasks` - List tasks (with filters)
- `POST /api/tasks` - Create task
- `GET /api/tasks/{id}` - Get single task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/tasks/stats/overview` - Task statistics
- `GET /api/tasks/stats/scores` - Score and achievements
- `GET /api/tasks/suggestions` - Autocomplete data

#### Task Groups
- `GET /api/task-groups` - List user's groups
- `POST /api/task-groups` - Create group
- `GET /api/task-groups/{id}` - Get group
- `PUT /api/task-groups/{id}` - Update group
- `DELETE /api/task-groups/{id}` - Delete group
- `GET /api/task-groups/{id}/tasks` - Get tasks in group

#### Teams
- `GET /api/teams` - List user's teams
- `POST /api/teams` - Create a team
- `GET /api/teams/{id}` - Get team details
- `DELETE /api/teams/{id}` - Delete team (owner only)
- `GET /api/teams/{id}/members` - List team members
- `POST /api/teams/{id}/members` - Add team member
- `DELETE /api/teams/{id}/members/{userId}` - Remove member
- `GET /api/teams/{id}/tasks` - Get team tasks

#### Payments & Membership
- `POST /api/payment/create-order` - Create payment order
- `POST /api/payment/verify` - Verify payment
- `GET /api/membership/plans` - Get available plans
- `POST /api/membership/upgrade` - Upgrade membership
- `POST /api/discount/validate` - Validate discount code

### Page Structure

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing page | Public |
| `/auth` | Login/Register | Public |
| `/dashboard` | Main dashboard | Auth |
| `/calendar` | Calendar view | Premium only |
| `/teams` | Team listing | Auth |
| `/teams/:teamId` | Team detail | Auth |
| `/groups` | Task groups | Auth |
| `/tasks` | Task list | Auth |
| `/tasks/new` | Create task | Auth |
| `/tasks/:id` | Task detail | Auth |
| `/tasks/:id/edit` | Edit task | Auth |
| `/upgrade` | Membership upgrade | Auth |

## Upcoming Tasks (P1)

### Full Team Collaboration Feature
Technical specs available in `/app/TEAM_COLLABORATION_SPECS.md`
- Task assignment to team members
- Subtasks
- Comments with @mentions
- Activity log
- Team-based analytics

## Backlog (P2-P3)

### P2 - Medium Priority
- Real Razorpay payment integration
- Task comments and @mentions
- Team activity logs
- Backend refactoring (split server.py into routers)

### P3 - Low Priority
- WhatsApp integration for notifications
- Email notifications
- Export task data
- Dark mode theme

## Known Limitations
1. **Payment Gateway:** MOCKED. Real Razorpay keys needed for production.
2. **Notifications:** WhatsApp integration not implemented.
3. **Backend Structure:** server.py is large (~1300 lines), consider refactoring into modules.

## Test Credentials
- Create new user via registration UI
- Mock payment auto-approves with any details
- Discount code: EARLYBIRD (50% off, valid until Jun 30, 2026)
