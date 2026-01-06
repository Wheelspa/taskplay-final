# Team Collaboration - Quick Reference Guide

## Database Collections Summary

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| `teams` | Store team info | name, owner_id, member_count |
| `team_members` | Track membership | team_id, user_id, role, permissions |
| `tasks` (updated) | Team tasks | team_id, assigned_to[], watchers[] |
| `task_comments` | Task discussions | task_id, content, mentions[] |
| `activity_logs` | Audit trail | team_id, action_type, action_details |
| `notifications` | User alerts | user_id, type, read, priority |

## Role Permissions Quick Ref

| Permission | Owner | Admin | Member |
|-----------|-------|-------|--------|
| Create Tasks | ✅ | ✅ | ✅ |
| Assign Tasks | ✅ | ✅ | ❌ |
| Delete Tasks | ✅ | ✅ | ❌ |
| Manage Members | ✅ | ✅ | ❌ |
| View Analytics | ✅ | ✅ | ❌ |
| Delete Team | ✅ | ❌ | ❌ |

## API Endpoints Checklist

### Teams (7 endpoints)
- [ ] `POST /api/teams` - Create team
- [ ] `GET /api/teams` - List user's teams
- [ ] `GET /api/teams/:id` - Get team details
- [ ] `PUT /api/teams/:id` - Update team
- [ ] `DELETE /api/teams/:id` - Delete team
- [ ] `GET /api/teams/:id/analytics` - Team stats
- [ ] `GET /api/teams/:id/activity` - Activity log

### Members (4 endpoints)
- [ ] `POST /api/teams/:id/members` - Add member
- [ ] `GET /api/teams/:id/members` - List members
- [ ] `PUT /api/teams/:id/members/:user_id` - Update role
- [ ] `DELETE /api/teams/:id/members/:user_id` - Remove member

### Team Tasks (3 endpoints)
- [ ] `GET /api/teams/:id/tasks` - List team tasks
- [ ] `POST /api/teams/:id/tasks` - Create team task
- [ ] `PUT /api/teams/:id/tasks/:task_id/assign` - Assign task

### Comments (4 endpoints)
- [ ] `POST /api/tasks/:id/comments` - Add comment
- [ ] `GET /api/tasks/:id/comments` - List comments
- [ ] `PUT /api/tasks/:id/comments/:comment_id` - Edit comment
- [ ] `DELETE /api/tasks/:id/comments/:comment_id` - Delete comment

### Notifications (3 endpoints)
- [ ] `GET /api/notifications` - List notifications
- [ ] `PUT /api/notifications/:id/read` - Mark as read
- [ ] `POST /api/notifications/mark-all-read` - Mark all read

**Total: 21 new endpoints**

## Frontend Components Needed

### Pages
- [ ] `TeamsListPage.js` - Show all teams
- [ ] `TeamDashboard.js` - Team overview
- [ ] `TeamTasksPage.js` - Kanban board
- [ ] `TeamMembersPage.js` - Member management
- [ ] `TeamSettingsPage.js` - Team settings
- [ ] `TeamAnalyticsPage.js` - Stats & insights

### Components
- [ ] `CreateTeamModal.js` - Team creation dialog
- [ ] `TeamCard.js` - Team display card
- [ ] `MemberList.js` - List of members with roles
- [ ] `InviteMemberModal.js` - Invite dialog
- [ ] `RoleSelector.js` - Role dropdown
- [ ] `TaskAssignmentMulti.js` - Multi-user picker
- [ ] `CommentSection.js` - Comments with mentions
- [ ] `ActivityFeed.js` - Activity timeline
- [ ] `NotificationBell.js` - Notification icon with count
- [ ] `NotificationList.js` - Notification dropdown

## Implementation Order

### Day 1-2: Backend Foundation
1. Create database collections
2. Implement Team CRUD
3. Add role-based permissions
4. Test with Postman

### Day 3-4: Member Management
1. Member add/remove APIs
2. Role management
3. Permission checks
4. Email invitation system

### Day 5-6: Team Tasks
1. Update Task model
2. Multi-user assignment
3. Team task filtering
4. Task assignment API

### Day 7-8: Frontend Core
1. Teams list page
2. Create team flow
3. Team dashboard
4. Member management UI

### Day 9-10: Collaboration
1. Comments API
2. Activity logs
3. Comment UI with @mentions
4. Activity feed display

### Day 11-12: Notifications
1. Notification creation logic
2. Notification API
3. Notification bell UI
4. Real-time updates (optional)

### Day 13-14: Analytics & Polish
1. Analytics API
2. Analytics dashboard
3. Performance optimization
4. Bug fixes & testing

## Key Business Rules

### Teams
- Owner cannot be removed (must transfer ownership first)
- Team name must be unique per user
- Soft delete teams (set `is_active: false`)
- Max 50 members per team (configurable)

### Members
- Email-based invitation
- Owner can change anyone's role
- Admin can manage members but not change Owner
- Member can only view assigned tasks (if `task_visibility: "assigned_only"`)

### Tasks
- Assigned users must be team members
- Creator auto-added as watcher
- Personal tasks (`team_id: null`) remain private
- Team tasks visible to all members

### Comments
- @mentions create notifications
- Only author can edit
- Owner/Admin can delete any comment
- Support threaded replies

### Notifications
- Created for: assignments, mentions, role changes, invitations
- Auto-mark read after 30 days (cleanup job)
- Email notifications for critical actions (optional)

## Testing Commands

```bash
# Create team
curl -X POST http://localhost:8001/api/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Team", "description": "Testing"}'

# Add member
curl -X POST http://localhost:8001/api/teams/team_123/members \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_email": "member@test.com", "role": "member"}'

# Create team task
curl -X POST http://localhost:8001/api/teams/team_123/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Team Task", "assigned_to": ["user_1", "user_2"]}'

# Add comment
curl -X POST http://localhost:8001/api/tasks/task_123/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Great work @user_123!"}'
```

## Environment Variables

Add to `/app/backend/.env`:
```env
MAX_TEAMS_PER_USER=10
MAX_MEMBERS_PER_TEAM=50
ENABLE_EMAIL_INVITATIONS=true
NOTIFICATION_RETENTION_DAYS=30
```

## Migration Steps

### Database Migration
```javascript
// Run these in MongoDB shell or migration script

// 1. Add indexes
db.teams.createIndex({ "owner_id": 1 })
db.teams.createIndex({ "created_at": -1 })
db.team_members.createIndex({ "team_id": 1, "user_id": 1 }, { unique: true })
db.team_members.createIndex({ "user_id": 1, "status": 1 })
db.task_comments.createIndex({ "task_id": 1, "created_at": 1 })
db.activity_logs.createIndex({ "team_id": 1, "created_at": -1 })
db.notifications.createIndex({ "user_id": 1, "read": 1, "created_at": -1 })

// 2. Update existing tasks to add new fields
db.tasks.updateMany(
  { team_id: { $exists: false } },
  { 
    $set: { 
      team_id: null,
      assigned_to: [],
      watchers: [],
      created_by_team_member: false
    } 
  }
)
```

## Security Checklist

- [ ] All team endpoints check membership
- [ ] Permission checks on every action
- [ ] Task data filtered by team membership
- [ ] Comments only visible to team members
- [ ] Activity logs restricted to team
- [ ] Notifications only for relevant users
- [ ] Rate limiting on invitation emails
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (N/A for MongoDB)
- [ ] XSS prevention in comments

## Performance Considerations

### Database
- Index on compound fields (team_id, user_id)
- Limit activity log queries to last 30 days
- Cache team member lists (5 min TTL)
- Paginate long lists (tasks, comments, activity)

### Frontend
- Lazy load team list
- Virtual scrolling for large task lists
- Debounce search inputs
- Optimize re-renders with React.memo
- Use React Query for caching

### API
- Batch notification creation
- Background jobs for email sending
- Compress response payloads
- Use connection pooling

## Deployment Notes

### Phase 1 (MVP)
- Deploy team creation & basic membership
- Enable for paid users only
- Monitor database performance
- Collect user feedback

### Phase 2 (Full Feature)
- Deploy comments & notifications
- Add analytics dashboard
- Enable for all users
- Scale infrastructure if needed

## Monitoring Metrics

- Team creation rate
- Active teams count
- Average members per team
- Task completion rate per team
- Comment activity rate
- Notification delivery rate
- API response times
- Database query performance

## Support & Documentation

- [ ] API documentation (Swagger/OpenAPI)
- [ ] User guide for team features
- [ ] Admin guide for permissions
- [ ] Video tutorial for team setup
- [ ] FAQ section
- [ ] Troubleshooting guide

---

**Ready to start implementation? Begin with Phase 1: Backend Foundation!**
