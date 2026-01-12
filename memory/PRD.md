# TaskPro - Product Requirements Document

## Original Problem Statement
Build a comprehensive task management application named "TaskPro" with:
- Task scheduling (postponing/preponing)
- Task priorities including "Super Important" with popup alerts
- Click-to-call phone integration
- Interactive map location picker with search
- Paid account creation via Razorpay (currently mocked)
- WhatsApp messaging for tasks (planned)
- Points-based scoring system with achievements
- Penalty system for delayed tasks
- Automatic monthly task clearing
- Calendar view for task overview

## Tech Stack
- **Backend:** FastAPI + MongoDB (motor)
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Maps:** Leaflet (react-leaflet)
- **Calendar:** react-day-picker (via Shadcn Calendar)
- **Auth:** JWT-based authentication

## Current Status
**Last Updated:** January 12, 2026

### Completed Features ✅
1. **User Authentication**
   - Registration with mock payment flow
   - JWT-based login/logout
   - Protected routes

2. **Task Management**
   - Full CRUD operations
   - Priority levels: low, medium, high, super_important
   - Status tracking: pending, in_progress, completed
   - Scheduled date and time slots
   - Location picker with interactive map and search
   - Click-to-call phone links
   - Assignee information

3. **Scoring System**
   - Points awarded on task completion (2-5 based on priority)
   - Daily, monthly, and all-time score tracking
   - -5 penalty for tasks delayed >3 days

4. **Achievement System**
   - Bronze badge at 25 monthly points
   - Silver badge at 50 monthly points
   - Gold badge at 75 monthly points
   - Platinum badge at 100 monthly points
   - Celebration modal on achievement unlock

5. **UI Features**
   - Super Important task popup alerts
   - Quick status change from dashboard
   - Auto-delete completed tasks
   - "Add Task" button in main navigation
   - Autocomplete suggestions from previous tasks

6. **Automatic Monthly Cleanup**
   - All tasks cleared at start of each month
   - Runs on server startup on day 1

7. **Calendar View** (NEW)
   - Full month calendar with task indicators
   - Color-coded dots for priorities (red=super important, orange=high, blue=pending, green=completed)
   - Click any date to see tasks for that day
   - Priority filter dropdown
   - "TODAY" button for quick navigation
   - Monthly overview stats panel
   - Task summary for selected date

### Removed Features
- Manual "Clear Completed Tasks" button (per user request - tasks now auto-clear)

## Page Structure

### Routes
- `/` - Landing page
- `/auth` - Login/Register
- `/dashboard` - Main dashboard with stats and recent tasks
- `/calendar` - Calendar view of all tasks
- `/teams` - Team listing and creation
- `/teams/:teamId` - Team detail with members and tasks
- `/tasks` - Task list page
- `/tasks/new` - Create new task
- `/tasks/:id` - Task detail
- `/tasks/:id/edit` - Edit task

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - List tasks (with status/priority filters)
- `POST /api/tasks` - Create task
- `GET /api/tasks/{id}` - Get single task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/tasks/stats/overview` - Task statistics
- `GET /api/tasks/stats/scores` - Score and achievements
- `GET /api/tasks/suggestions` - Autocomplete data

### Teams
- `GET /api/teams` - List user's teams
- `POST /api/teams` - Create a team
- `GET /api/teams/{id}` - Get team details
- `DELETE /api/teams/{id}` - Delete team (owner only)
- `GET /api/teams/{id}/members` - List team members
- `POST /api/teams/{id}/members` - Add team member
- `DELETE /api/teams/{id}/members/{userId}` - Remove member
- `GET /api/teams/{id}/tasks` - Get team tasks

### Payments (Mocked)
- `POST /api/payment/create-order` - Create payment order
- `POST /api/payment/verify` - Verify payment

## Database Schema

### users
```json
{
  "_id": "user_xxx",
  "email": "string",
  "password": "hashed",
  "name": "string",
  "phone": "string",
  "is_paid": "boolean",
  "created_at": "datetime"
}
```

### tasks
```json
{
  "_id": "task_xxx",
  "title": "string",
  "description": "string",
  "priority": "low|medium|high|super_important",
  "status": "pending|in_progress|completed",
  "scheduled_date": "YYYY-MM-DD",
  "scheduled_time": "HH:MM",
  "assignee_name": "string",
  "assignee_phone": "string",
  "location_lat": "float",
  "location_lng": "float",
  "location_address": "string",
  "created_by": "user_id",
  "created_at": "datetime",
  "completed_at": "datetime",
  "points_earned": "int",
  "penalty_applied": "boolean",
  "penalty_points": "int"
}
```

## Upcoming Tasks (P1)

### Team Collaboration Feature
Technical specs available in `/app/TEAM_COLLABORATION_SPECS.md`
- Team creation and member management
- Role-based permissions (Owner, Admin, Member)
- Assign tasks to teams
- Team dashboard

## Backlog (P2-P3)

### P2 - Medium Priority
- Real Razorpay payment integration
- Task comments and @mentions
- Team activity logs
- Team-based analytics

### P3 - Low Priority
- WhatsApp integration for notifications
- Email notifications
- Export task data
- Dark mode theme

## Known Limitations
1. **Payment Gateway:** Currently mocked. Real Razorpay keys needed for production.
2. **Notifications:** WhatsApp integration not yet implemented.
3. **Backend Structure:** server.py is large (650+ lines), consider refactoring into modules.

## Test Credentials
- Create new user via registration UI
- Mock payment auto-approves with any details
- Test user: newtest@test.com / Test123!
