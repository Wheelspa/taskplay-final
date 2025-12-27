# TaskPro - Professional Task Management System

A comprehensive task management application with advanced features including location mapping, click-to-call functionality, and paid user registration.

## Features

### ✅ Core Features Implemented

1. **User Authentication**
   - User registration with Razorpay payment integration (₹499)
   - JWT-based secure login/logout
   - Protected routes and session management

2. **Task Management**
   - Create, Read, Update, Delete tasks
   - Task priorities: High, Medium, Low
   - Task status: Pending, In Progress, Completed
   - Schedule tasks with date and time
   - Postpone or prepone tasks by editing scheduled time

3. **Assignee Management**
   - Assign tasks to team members
   - Store assignee name and phone number
   - Click-to-call functionality (opens phone dialer)

4. **Location Features**
   - Interactive map picker using Leaflet
   - Click on map to select precise location
   - Store location coordinates (latitude/longitude)
   - Location address field
   - View location on map in task details
   - Open location in Google Maps

5. **Dashboard**
   - Task statistics overview
   - Recent tasks display
   - Quick actions panel
   - Professional Swiss Utility design

6. **Task List**
   - Filter by status (pending, in progress, completed)
   - Filter by priority (high, medium, low)
   - View all tasks with details

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - Database for users and tasks
- **Razorpay** - Payment gateway integration
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Leaflet** - Interactive maps
- **Axios** - API requests
- **Shadcn/UI** - Component library
- **Tailwind CSS** - Styling
- **Sonner** - Toast notifications

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB running locally
- Razorpay account (for payment integration)

### Backend Setup

1. Install dependencies:
```bash
cd /app/backend
pip install -r requirements.txt
```

2. Configure environment variables in `/app/backend/.env`:
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
JWT_SECRET="your-secret-key-change-in-production"
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
```

3. Start the backend:
```bash
sudo supervisorctl restart backend
```

### Frontend Setup

1. Install dependencies:
```bash
cd /app/frontend
yarn install
```

2. Environment is pre-configured in `/app/frontend/.env`

3. Start the frontend:
```bash
sudo supervisorctl restart frontend
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user with payment
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Payment
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment signature

### Tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks` - Get all tasks (with filters)
- `GET /api/tasks/{task_id}` - Get task by ID
- `PUT /api/tasks/{task_id}` - Update task
- `DELETE /api/tasks/{task_id}` - Delete task
- `GET /api/tasks/stats/overview` - Get task statistics

## Usage Guide

### Creating a Task

1. Login to your account
2. Click "NEW TASK" button
3. Fill in task details:
   - **Title**: Task name (required)
   - **Description**: Additional details
   - **Assignee Name**: Person responsible
   - **Assignee Phone**: Phone number for click-to-call
   - **Priority**: High/Medium/Low
   - **Status**: Pending/In Progress/Completed
   - **Scheduled Date & Time**: When to do the task
   - **Location**: Click on map to select location
4. Click "CREATE TASK"

### Postponing/Preponing Tasks

1. Open the task detail page
2. Click "EDIT"
3. Change the "Scheduled Date" or "Scheduled Time"
4. Click "UPDATE TASK"

### Using Location Features

1. In the task form, scroll to "Location on Map"
2. Click anywhere on the map to select a location
3. The coordinates will be automatically saved
4. Enter an address in the "Location Address" field
5. In task details, click "OPEN IN MAPS" to view in Google Maps

### Click-to-Call Feature

1. Open any task with an assignee phone number
2. In the "Assignee" section, click the "CALL" button
3. Your device's phone dialer will open with the number

## Payment Integration

### Configuration

To enable paid registration:

1. Sign up for Razorpay account at https://razorpay.com
2. Get your API keys from the dashboard
3. Update `/app/backend/.env` with your keys:
   ```env
   RAZORPAY_KEY_ID="rzp_live_your_key_id"
   RAZORPAY_KEY_SECRET="your_secret_key"
   ```
4. Update `/app/frontend/src/pages/AuthPage.js` with your key:
   ```javascript
   key: "rzp_live_your_key_id"
   ```
5. Restart both backend and frontend

### Test Payment

For testing without actual charges:
- Use Razorpay test mode keys
- Users can register without payment by leaving payment fields empty
- Test cards: 4111 1111 1111 1111

## WhatsApp Integration (Future Enhancement)

Currently, the automatic messaging feature can be implemented using:

1. **Twilio WhatsApp API** - Recommended for production
2. **Email Notifications** - Simpler alternative
3. **Baileys WhatsApp Web** - Requires separate Node.js service

The notification infrastructure is ready - just needs the messaging service integration.

## Design System

The app uses the **Swiss Utility** design system:
- **Typography**: Outfit (headings), Plus Jakarta Sans (body), JetBrains Mono (code)
- **Colors**: Cobalt Blue primary, Signal Orange accent
- **Layout**: Sharp corners, high contrast, flat design
- **Components**: Uppercase labels, precision-focused UI

## Testing

The application has been thoroughly tested:
- ✅ All authentication flows
- ✅ Complete task CRUD operations
- ✅ Location mapping and selection
- ✅ Click-to-call functionality
- ✅ Filter and search features
- ✅ Dashboard statistics
- ✅ Responsive design

Test report available at: `/app/test_reports/iteration_1.json`

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected API routes
- CORS configuration
- Payment signature verification
- Input validation

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations

1. **Payment Integration**: Requires valid Razorpay API keys to process payments
2. **WhatsApp Messaging**: Not yet implemented (planned for future release)
3. **Map Provider**: Uses OpenStreetMap (free tier)

## Future Enhancements

1. **Automatic Notifications**
   - WhatsApp messaging integration
   - Email notifications
   - SMS alerts via Twilio

2. **Advanced Features**
   - Task templates
   - Recurring tasks
   - Task comments and attachments
   - Team collaboration features
   - Task analytics and reports

3. **Mobile App**
   - React Native mobile application
   - Push notifications
   - Offline support

## Support

For issues or questions:
- Check the test report at `/app/test_reports/iteration_1.json`
- Review backend logs: `tail -f /var/log/supervisor/backend.err.log`
- Review frontend logs: `tail -f /var/log/supervisor/frontend.err.log`

## License

This is a custom-built application for task management with integrated payment and location features.

---

**Built with ❤️ using FastAPI, React, and MongoDB**
