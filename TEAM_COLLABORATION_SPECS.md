# Team Collaboration Feature - Technical Specifications

## Table of Contents
1. [Database Schema](#database-schema)
2. [API Contracts](#api-contracts)
3. [Data Models](#data-models)
4. [Business Logic](#business-logic)
5. [Security & Permissions](#security--permissions)
6. [Error Handling](#error-handling)

---

## 1. Database Schema

### 1.1 Teams Collection
```javascript
{
  _id: "team_<timestamp>",
  name: String,                    // Required, max 100 chars
  description: String,             // Optional, max 500 chars
  logo_url: String,                // Optional, URL to team logo
  owner_id: String,                // User ID, Required
  created_at: ISOString,           // Auto-generated
  updated_at: ISOString,           // Auto-updated
  is_active: Boolean,              // Default: true
  settings: {
    allow_member_invite: Boolean,  // Default: false
    task_visibility: String,       // "all" | "assigned_only"
    require_task_approval: Boolean // Default: false
  }
}
```

**Indexes:**
- `owner_id` (ascending)
- `created_at` (descending)
- `is_active` (ascending)

**Sample Document:**
```json
{
  "_id": "team_1704123456789",
  "name": "Marketing Team",
  "description": "Digital marketing and content creation",
  "logo_url": "https://example.com/logos/marketing.png",
  "owner_id": "user_1704123400000",
  "created_at": "2025-01-02T10:30:00.000Z",
  "updated_at": "2025-01-02T10:30:00.000Z",
  "is_active": true,
  "settings": {
    "allow_member_invite": false,
    "task_visibility": "all",
    "require_task_approval": false
  }
}
```

---

### 1.2 Team Members Collection
```javascript
{
  _id: "tm_<timestamp>",
  team_id: String,                 // Required, foreign key to teams
  user_id: String,                 // Required, foreign key to users
  role: String,                    // "owner" | "admin" | "member"
  joined_at: ISOString,            // Auto-generated
  invited_by: String,              // User ID who invited
  status: String,                  // "active" | "invited" | "inactive"
  permissions: {
    can_create_tasks: Boolean,     // Default based on role
    can_assign_tasks: Boolean,
    can_delete_tasks: Boolean,
    can_manage_members: Boolean,
    can_view_analytics: Boolean
  }
}
```

**Indexes:**
- `team_id, user_id` (compound unique)
- `team_id, status` (compound)
- `user_id, status` (compound)

**Role-Based Default Permissions:**
```javascript
// Owner
{
  can_create_tasks: true,
  can_assign_tasks: true,
  can_delete_tasks: true,
  can_manage_members: true,
  can_view_analytics: true
}

// Admin
{
  can_create_tasks: true,
  can_assign_tasks: true,
  can_delete_tasks: true,
  can_manage_members: true,
  can_view_analytics: true
}

// Member
{
  can_create_tasks: true,
  can_assign_tasks: false,
  can_delete_tasks: false,
  can_manage_members: false,
  can_view_analytics: false
}
```

**Sample Document:**
```json
{
  "_id": "tm_1704123460000",
  "team_id": "team_1704123456789",
  "user_id": "user_1704123400000",
  "role": "owner",
  "joined_at": "2025-01-02T10:30:00.000Z",
  "invited_by": null,
  "status": "active",
  "permissions": {
    "can_create_tasks": true,
    "can_assign_tasks": true,
    "can_delete_tasks": true,
    "can_manage_members": true,
    "can_view_analytics": true
  }
}
```

---

### 1.3 Updated Tasks Collection
```javascript
{
  _id: "task_<timestamp>",
  // ... existing fields ...
  
  // NEW FIELDS FOR TEAMS:
  team_id: String,                 // Optional, null for personal tasks
  assigned_to: [String],           // Array of user_ids, replaces single assignee
  watchers: [String],              // Array of user_ids who watch this task
  created_by_team_member: Boolean, // Was task created within team context?
  
  // Keep legacy fields for backward compatibility
  assignee_name: String,           // Optional, for non-team tasks
  assignee_phone: String,          // Optional, for non-team tasks
}
```

**Additional Indexes:**
- `team_id, status` (compound)
- `assigned_to` (multi-key index)
- `team_id, priority` (compound)

**Sample Document:**
```json
{
  "_id": "task_1704123470000",
  "title": "Create Q1 Marketing Report",
  "description": "Compile metrics and insights",
  "priority": "high",
  "status": "in_progress",
  "team_id": "team_1704123456789",
  "assigned_to": ["user_1704123400000", "user_1704123410000"],
  "watchers": ["user_1704123420000"],
  "created_by": "user_1704123400000",
  "created_by_team_member": true,
  "created_at": "2025-01-02T10:35:00.000Z",
  "scheduled_date": "2025-01-10",
  "scheduled_time": "14:00"
}
```

---

### 1.4 Task Comments Collection
```javascript
{
  _id: "comment_<timestamp>",
  task_id: String,                 // Required, foreign key to tasks
  user_id: String,                 // Required, commenter
  content: String,                 // Required, max 2000 chars
  mentions: [String],              // Array of user_ids mentioned with @
  created_at: ISOString,           // Auto-generated
  updated_at: ISOString,           // Auto-updated if edited
  is_edited: Boolean,              // Default: false
  parent_comment_id: String,       // Optional, for threaded replies
  attachments: [{
    type: String,                  // "image" | "file" | "link"
    url: String,
    name: String,
    size: Number                   // In bytes
  }]
}
```

**Indexes:**
- `task_id, created_at` (compound)
- `user_id` (ascending)
- `mentions` (multi-key index)

**Sample Document:**
```json
{
  "_id": "comment_1704123480000",
  "task_id": "task_1704123470000",
  "user_id": "user_1704123400000",
  "content": "Great progress! @user_1704123410000 please review the metrics section.",
  "mentions": ["user_1704123410000"],
  "created_at": "2025-01-02T11:00:00.000Z",
  "updated_at": "2025-01-02T11:00:00.000Z",
  "is_edited": false,
  "parent_comment_id": null,
  "attachments": []
}
```

---

### 1.5 Activity Logs Collection
```javascript
{
  _id: "activity_<timestamp>",
  team_id: String,                 // Optional, null for personal tasks
  task_id: String,                 // Optional, null for team-level activities
  user_id: String,                 // Required, who performed the action
  action_type: String,             // See action types below
  action_details: Object,          // Flexible object with action-specific data
  created_at: ISOString,           // Auto-generated
  metadata: {
    ip_address: String,            // Optional
    user_agent: String             // Optional
  }
}
```

**Action Types:**
- Team: `team_created`, `team_updated`, `team_deleted`
- Members: `member_added`, `member_removed`, `role_changed`
- Tasks: `task_created`, `task_assigned`, `task_updated`, `task_completed`, `task_deleted`
- Comments: `comment_added`, `comment_edited`, `comment_deleted`
- Status: `status_changed`, `priority_changed`, `deadline_changed`

**Indexes:**
- `team_id, created_at` (compound, descending)
- `task_id, created_at` (compound, descending)
- `user_id, created_at` (compound, descending)

**Sample Document:**
```json
{
  "_id": "activity_1704123490000",
  "team_id": "team_1704123456789",
  "task_id": "task_1704123470000",
  "user_id": "user_1704123400000",
  "action_type": "task_assigned",
  "action_details": {
    "task_title": "Create Q1 Marketing Report",
    "assigned_to": ["user_1704123400000", "user_1704123410000"],
    "assigned_by_name": "John Doe"
  },
  "created_at": "2025-01-02T10:35:00.000Z",
  "metadata": {
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
  }
}
```

---

### 1.6 Notifications Collection
```javascript
{
  _id: "notif_<timestamp>",
  user_id: String,                 // Required, recipient
  type: String,                    // See notification types below
  title: String,                   // Required, notification title
  message: String,                 // Required, notification body
  link: String,                    // Optional, deep link to relevant page
  read: Boolean,                   // Default: false
  read_at: ISOString,              // Timestamp when marked as read
  created_at: ISOString,           // Auto-generated
  priority: String,                // "low" | "normal" | "high" | "urgent"
  metadata: {
    team_id: String,               // Optional
    task_id: String,               // Optional
    actor_id: String,              // User who triggered notification
    actor_name: String
  }
}
```

**Notification Types:**
- `team_invitation`
- `team_member_added`
- `team_member_removed`
- `task_assigned`
- `task_updated`
- `task_completed`
- `comment_mention`
- `comment_reply`
- `deadline_approaching`
- `task_overdue`

**Indexes:**
- `user_id, read, created_at` (compound, descending)
- `user_id, type` (compound)

**Sample Document:**
```json
{
  "_id": "notif_1704123500000",
  "user_id": "user_1704123410000",
  "type": "task_assigned",
  "title": "New Task Assigned",
  "message": "John Doe assigned you to 'Create Q1 Marketing Report'",
  "link": "/tasks/task_1704123470000",
  "read": false,
  "read_at": null,
  "created_at": "2025-01-02T10:35:00.000Z",
  "priority": "normal",
  "metadata": {
    "team_id": "team_1704123456789",
    "task_id": "task_1704123470000",
    "actor_id": "user_1704123400000",
    "actor_name": "John Doe"
  }
}
```

---

## 2. API Contracts

### 2.1 Team Management APIs

#### POST /api/teams
Create a new team.

**Request:**
```json
{
  "name": "Marketing Team",
  "description": "Digital marketing and content creation",
  "logo_url": "https://example.com/logo.png"
}
```

**Response (201):**
```json
{
  "id": "team_1704123456789",
  "name": "Marketing Team",
  "description": "Digital marketing and content creation",
  "logo_url": "https://example.com/logo.png",
  "owner_id": "user_1704123400000",
  "created_at": "2025-01-02T10:30:00.000Z",
  "member_count": 1
}
```

**Errors:**
- `400`: Invalid input (name required, too long, etc.)
- `401`: Unauthorized
- `403`: User not allowed to create teams (unpaid account, etc.)

---

#### GET /api/teams
Get all teams user is a member of.

**Query Parameters:**
- `status` (optional): "active" | "inactive" | "all" (default: "active")
- `role` (optional): "owner" | "admin" | "member" (filter by user's role)

**Response (200):**
```json
{
  "teams": [
    {
      "id": "team_1704123456789",
      "name": "Marketing Team",
      "description": "Digital marketing",
      "logo_url": "https://example.com/logo.png",
      "owner_id": "user_1704123400000",
      "created_at": "2025-01-02T10:30:00.000Z",
      "member_count": 5,
      "user_role": "owner",
      "unread_count": 3
    }
  ],
  "total": 1
}
```

---

#### GET /api/teams/:team_id
Get team details.

**Response (200):**
```json
{
  "id": "team_1704123456789",
  "name": "Marketing Team",
  "description": "Digital marketing and content creation",
  "logo_url": "https://example.com/logo.png",
  "owner_id": "user_1704123400000",
  "created_at": "2025-01-02T10:30:00.000Z",
  "updated_at": "2025-01-02T10:30:00.000Z",
  "member_count": 5,
  "task_count": 12,
  "completed_task_count": 8,
  "user_role": "owner",
  "user_permissions": {
    "can_create_tasks": true,
    "can_assign_tasks": true,
    "can_delete_tasks": true,
    "can_manage_members": true,
    "can_view_analytics": true
  }
}
```

**Errors:**
- `404`: Team not found
- `403`: User not a member of team

---

#### PUT /api/teams/:team_id
Update team details.

**Request:**
```json
{
  "name": "Updated Team Name",
  "description": "New description",
  "logo_url": "https://example.com/new-logo.png"
}
```

**Response (200):**
```json
{
  "id": "team_1704123456789",
  "name": "Updated Team Name",
  "description": "New description",
  "logo_url": "https://example.com/new-logo.png",
  "updated_at": "2025-01-02T11:00:00.000Z"
}
```

**Permissions:** Owner or Admin only

**Errors:**
- `403`: Insufficient permissions
- `404`: Team not found

---

#### DELETE /api/teams/:team_id
Delete a team (soft delete).

**Response (200):**
```json
{
  "message": "Team deleted successfully",
  "deleted_at": "2025-01-02T11:00:00.000Z"
}
```

**Permissions:** Owner only

**Business Logic:**
- Soft delete (set `is_active: false`)
- Archive all team tasks
- Remove all team members
- Cannot be undone

---

### 2.2 Team Member Management APIs

#### POST /api/teams/:team_id/members
Add a member to the team.

**Request:**
```json
{
  "user_email": "newmember@example.com",
  "role": "member"
}
```

**Response (201):**
```json
{
  "member": {
    "user_id": "user_1704123410000",
    "user_name": "Jane Smith",
    "user_email": "newmember@example.com",
    "role": "member",
    "joined_at": "2025-01-02T11:00:00.000Z",
    "status": "active"
  },
  "notification_sent": true
}
```

**Permissions:** Owner or Admin

**Business Logic:**
- If user doesn't exist, send invitation email
- If user exists, add immediately and notify
- Create notification for new member
- Log activity

**Errors:**
- `400`: Invalid email or role
- `403`: Insufficient permissions
- `404`: Team not found
- `409`: User already a member

---

#### GET /api/teams/:team_id/members
Get all team members.

**Query Parameters:**
- `role` (optional): Filter by role
- `status` (optional): "active" | "invited" | "inactive"

**Response (200):**
```json
{
  "members": [
    {
      "user_id": "user_1704123400000",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "role": "owner",
      "joined_at": "2025-01-02T10:30:00.000Z",
      "status": "active",
      "task_count": 5,
      "completed_tasks": 3
    },
    {
      "user_id": "user_1704123410000",
      "user_name": "Jane Smith",
      "user_email": "jane@example.com",
      "role": "member",
      "joined_at": "2025-01-02T11:00:00.000Z",
      "status": "active",
      "task_count": 2,
      "completed_tasks": 1
    }
  ],
  "total": 2
}
```

---

#### PUT /api/teams/:team_id/members/:user_id
Update member role.

**Request:**
```json
{
  "role": "admin"
}
```

**Response (200):**
```json
{
  "user_id": "user_1704123410000",
  "role": "admin",
  "updated_at": "2025-01-02T11:30:00.000Z"
}
```

**Permissions:** Owner only (cannot change own role)

**Errors:**
- `400`: Invalid role or trying to change own role
- `403`: Insufficient permissions
- `404`: Team or member not found

---

#### DELETE /api/teams/:team_id/members/:user_id
Remove a member from the team.

**Response (200):**
```json
{
  "message": "Member removed successfully",
  "removed_at": "2025-01-02T11:30:00.000Z"
}
```

**Permissions:** Owner or Admin (Admin can't remove Owner)

**Business Logic:**
- Unassign all team tasks from this member
- Notify the removed member
- Log activity
- Owner cannot be removed (must transfer ownership first)

---

### 2.3 Team Task APIs

#### GET /api/teams/:team_id/tasks
Get all tasks for a team.

**Query Parameters:**
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `assigned_to` (optional): Filter by assignee user_id
- `sort` (optional): "created_at" | "priority" | "deadline"
- `order` (optional): "asc" | "desc"

**Response (200):**
```json
{
  "tasks": [
    {
      "id": "task_1704123470000",
      "title": "Create Q1 Marketing Report",
      "description": "Compile metrics",
      "priority": "high",
      "status": "in_progress",
      "assigned_to": [
        {
          "user_id": "user_1704123400000",
          "user_name": "John Doe"
        },
        {
          "user_id": "user_1704123410000",
          "user_name": "Jane Smith"
        }
      ],
      "created_by": "user_1704123400000",
      "created_at": "2025-01-02T10:35:00.000Z",
      "scheduled_date": "2025-01-10",
      "comment_count": 3,
      "watcher_count": 1
    }
  ],
  "total": 1,
  "stats": {
    "total": 12,
    "pending": 4,
    "in_progress": 5,
    "completed": 3
  }
}
```

---

#### POST /api/teams/:team_id/tasks
Create a task within a team.

**Request:**
```json
{
  "title": "New Team Task",
  "description": "Task description",
  "priority": "high",
  "assigned_to": ["user_1704123400000", "user_1704123410000"],
  "scheduled_date": "2025-01-15",
  "scheduled_time": "14:00",
  "watchers": ["user_1704123420000"]
}
```

**Response (201):**
```json
{
  "id": "task_1704123480000",
  "title": "New Team Task",
  "team_id": "team_1704123456789",
  "assigned_to": ["user_1704123400000", "user_1704123410000"],
  "created_at": "2025-01-02T12:00:00.000Z"
}
```

**Permissions:** Members with `can_create_tasks` permission

**Business Logic:**
- Validate assignees are team members
- Create notifications for assigned members
- Log activity
- Add creator as watcher automatically

---

#### PUT /api/teams/:team_id/tasks/:task_id/assign
Assign/reassign task to team members.

**Request:**
```json
{
  "assigned_to": ["user_1704123400000", "user_1704123410000"],
  "notify": true
}
```

**Response (200):**
```json
{
  "task_id": "task_1704123470000",
  "assigned_to": ["user_1704123400000", "user_1704123410000"],
  "notifications_sent": 2
}
```

**Permissions:** Members with `can_assign_tasks` permission

---

### 2.4 Comments APIs

#### POST /api/tasks/:task_id/comments
Add a comment to a task.

**Request:**
```json
{
  "content": "Great work! @user_1704123410000 please review.",
  "parent_comment_id": null
}
```

**Response (201):**
```json
{
  "id": "comment_1704123480000",
  "task_id": "task_1704123470000",
  "user_id": "user_1704123400000",
  "user_name": "John Doe",
  "content": "Great work! @user_1704123410000 please review.",
  "mentions": ["user_1704123410000"],
  "created_at": "2025-01-02T11:00:00.000Z",
  "is_edited": false
}
```

**Business Logic:**
- Parse @mentions from content
- Create notifications for mentioned users
- Log activity

---

#### GET /api/tasks/:task_id/comments
Get all comments for a task.

**Query Parameters:**
- `sort` (optional): "oldest" | "newest" (default: "oldest")

**Response (200):**
```json
{
  "comments": [
    {
      "id": "comment_1704123480000",
      "user_id": "user_1704123400000",
      "user_name": "John Doe",
      "content": "Great work!",
      "mentions": [],
      "created_at": "2025-01-02T11:00:00.000Z",
      "is_edited": false,
      "replies": []
    }
  ],
  "total": 1
}
```

---

#### PUT /api/tasks/:task_id/comments/:comment_id
Edit a comment.

**Request:**
```json
{
  "content": "Updated comment text"
}
```

**Response (200):**
```json
{
  "id": "comment_1704123480000",
  "content": "Updated comment text",
  "updated_at": "2025-01-02T11:30:00.000Z",
  "is_edited": true
}
```

**Permissions:** Comment author only

---

#### DELETE /api/tasks/:task_id/comments/:comment_id
Delete a comment.

**Response (200):**
```json
{
  "message": "Comment deleted successfully"
}
```

**Permissions:** Comment author, Team Owner, or Team Admin

---

### 2.5 Activity & Notifications APIs

#### GET /api/teams/:team_id/activity
Get activity log for a team.

**Query Parameters:**
- `limit` (optional): Number of items (default: 50, max: 100)
- `offset` (optional): For pagination
- `action_type` (optional): Filter by action type

**Response (200):**
```json
{
  "activities": [
    {
      "id": "activity_1704123490000",
      "user_id": "user_1704123400000",
      "user_name": "John Doe",
      "action_type": "task_assigned",
      "action_details": {
        "task_title": "Create Q1 Report",
        "assigned_to_names": ["Jane Smith", "Bob Johnson"]
      },
      "created_at": "2025-01-02T10:35:00.000Z"
    }
  ],
  "total": 1,
  "has_more": false
}
```

---

#### GET /api/notifications
Get user notifications.

**Query Parameters:**
- `read` (optional): true | false | "all" (default: "all")
- `type` (optional): Filter by notification type
- `limit` (optional): Default 20, max 100

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "notif_1704123500000",
      "type": "task_assigned",
      "title": "New Task Assigned",
      "message": "John Doe assigned you to 'Create Q1 Marketing Report'",
      "link": "/tasks/task_1704123470000",
      "read": false,
      "created_at": "2025-01-02T10:35:00.000Z",
      "priority": "normal",
      "metadata": {
        "team_id": "team_1704123456789",
        "actor_name": "John Doe"
      }
    }
  ],
  "total": 1,
  "unread_count": 1
}
```

---

#### PUT /api/notifications/:notification_id/read
Mark notification as read.

**Response (200):**
```json
{
  "id": "notif_1704123500000",
  "read": true,
  "read_at": "2025-01-02T12:00:00.000Z"
}
```

---

#### POST /api/notifications/mark-all-read
Mark all notifications as read.

**Response (200):**
```json
{
  "marked_count": 5,
  "message": "All notifications marked as read"
}
```

---

### 2.6 Analytics APIs

#### GET /api/teams/:team_id/analytics
Get team analytics and insights.

**Query Parameters:**
- `period` (optional): "week" | "month" | "quarter" (default: "month")

**Response (200):**
```json
{
  "team_id": "team_1704123456789",
  "period": "month",
  "stats": {
    "total_tasks": 25,
    "completed_tasks": 18,
    "in_progress_tasks": 5,
    "pending_tasks": 2,
    "completion_rate": 72,
    "avg_completion_time_hours": 48,
    "overdue_tasks": 1
  },
  "member_stats": [
    {
      "user_id": "user_1704123400000",
      "user_name": "John Doe",
      "assigned_tasks": 10,
      "completed_tasks": 8,
      "completion_rate": 80,
      "points_earned": 35
    }
  ],
  "priority_breakdown": {
    "super_important": 3,
    "high": 8,
    "medium": 10,
    "low": 4
  },
  "recent_activity_count": 45,
  "top_contributors": [
    {
      "user_id": "user_1704123400000",
      "user_name": "John Doe",
      "contribution_score": 95
    }
  ]
}
```

**Permissions:** Members with `can_view_analytics` permission

---

## 3. Data Models (Pydantic)

### Python Models

```python
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict
from datetime import datetime

# Team Models
class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = None

class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = None

class TeamResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    logo_url: Optional[str]
    owner_id: str
    created_at: str
    updated_at: Optional[str]
    member_count: int
    task_count: Optional[int] = 0
    user_role: Optional[str] = None

# Member Models
class MemberAdd(BaseModel):
    user_email: EmailStr
    role: str = Field("member", pattern="^(owner|admin|member)$")

class MemberRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(owner|admin|member)$")

class MemberResponse(BaseModel):
    user_id: str
    user_name: str
    user_email: str
    role: str
    joined_at: str
    status: str
    task_count: Optional[int] = 0
    completed_tasks: Optional[int] = 0

# Task Models (Extended)
class TeamTaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    priority: str = Field("medium", pattern="^(super_important|high|medium|low)$")
    assigned_to: List[str] = Field(default_factory=list)
    watchers: List[str] = Field(default_factory=list)
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_address: Optional[str] = None

class TaskAssign(BaseModel):
    assigned_to: List[str] = Field(..., min_items=1)
    notify: bool = True

# Comment Models
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_comment_id: Optional[str] = None

class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

class CommentResponse(BaseModel):
    id: str
    task_id: str
    user_id: str
    user_name: str
    content: str
    mentions: List[str]
    created_at: str
    updated_at: Optional[str]
    is_edited: bool
    parent_comment_id: Optional[str]

# Notification Models
class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    link: Optional[str]
    read: bool
    created_at: str
    priority: str
    metadata: Dict

# Activity Models
class ActivityResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    action_type: str
    action_details: Dict
    created_at: str
```

---

## 4. Business Logic

### 4.1 Team Creation Logic

```python
async def create_team(team_data: TeamCreate, current_user: dict):
    # 1. Validate user can create teams (check payment status, limits, etc.)
    if not current_user.get("is_paid"):
        raise HTTPException(403, "Paid account required to create teams")
    
    # 2. Check team name uniqueness for this user
    existing = await db.teams.find_one({
        "owner_id": current_user["id"],
        "name": team_data.name,
        "is_active": True
    })
    if existing:
        raise HTTPException(409, "Team name already exists")
    
    # 3. Create team document
    team_id = f"team_{datetime.now(timezone.utc).timestamp()}"
    team_doc = {
        "_id": team_id,
        "name": team_data.name,
        "description": team_data.description,
        "logo_url": team_data.logo_url,
        "owner_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
        "settings": {
            "allow_member_invite": False,
            "task_visibility": "all",
            "require_task_approval": False
        }
    }
    await db.teams.insert_one(team_doc)
    
    # 4. Add owner as first member
    member_doc = {
        "_id": f"tm_{datetime.now(timezone.utc).timestamp()}",
        "team_id": team_id,
        "user_id": current_user["id"],
        "role": "owner",
        "joined_at": datetime.now(timezone.utc).isoformat(),
        "invited_by": None,
        "status": "active",
        "permissions": get_role_permissions("owner")
    }
    await db.team_members.insert_one(member_doc)
    
    # 5. Log activity
    await log_activity(
        team_id=team_id,
        user_id=current_user["id"],
        action_type="team_created",
        action_details={"team_name": team_data.name}
    )
    
    return team_doc
```

---

### 4.2 Member Addition Logic

```python
async def add_team_member(team_id: str, member_data: MemberAdd, current_user: dict):
    # 1. Verify team exists and user has permission
    team = await get_team_or_404(team_id)
    user_membership = await get_user_membership(team_id, current_user["id"])
    
    if not user_membership["permissions"]["can_manage_members"]:
        raise HTTPException(403, "Insufficient permissions")
    
    # 2. Find user by email
    target_user = await db.users.find_one({"email": member_data.user_email}, {"_id": 0})
    if not target_user:
        # Send invitation email (implement email service)
        await send_team_invitation(team, member_data.user_email)
        return {"status": "invitation_sent"}
    
    # 3. Check if already a member
    existing = await db.team_members.find_one({
        "team_id": team_id,
        "user_id": target_user["id"],
        "status": {"$in": ["active", "invited"]}
    })
    if existing:
        raise HTTPException(409, "User already a member")
    
    # 4. Add member
    member_doc = {
        "_id": f"tm_{datetime.now(timezone.utc).timestamp()}",
        "team_id": team_id,
        "user_id": target_user["id"],
        "role": member_data.role,
        "joined_at": datetime.now(timezone.utc).isoformat(),
        "invited_by": current_user["id"],
        "status": "active",
        "permissions": get_role_permissions(member_data.role)
    }
    await db.team_members.insert_one(member_doc)
    
    # 5. Create notification for new member
    await create_notification(
        user_id=target_user["id"],
        type="team_member_added",
        title="Added to Team",
        message=f"{current_user['name']} added you to {team['name']}",
        link=f"/teams/{team_id}",
        metadata={
            "team_id": team_id,
            "actor_id": current_user["id"],
            "actor_name": current_user["name"]
        }
    )
    
    # 6. Log activity
    await log_activity(
        team_id=team_id,
        user_id=current_user["id"],
        action_type="member_added",
        action_details={
            "new_member_name": target_user["name"],
            "new_member_email": target_user["email"],
            "role": member_data.role
        }
    )
    
    return member_doc
```

---

### 4.3 Task Assignment Logic

```python
async def assign_task_to_members(team_id: str, task_id: str, assignment: TaskAssign, current_user: dict):
    # 1. Verify permissions
    user_membership = await get_user_membership(team_id, current_user["id"])
    if not user_membership["permissions"]["can_assign_tasks"]:
        raise HTTPException(403, "Insufficient permissions")
    
    # 2. Verify task belongs to team
    task = await db.tasks.find_one({"_id": task_id, "team_id": team_id})
    if not task:
        raise HTTPException(404, "Task not found")
    
    # 3. Verify all assignees are team members
    for user_id in assignment.assigned_to:
        membership = await db.team_members.find_one({
            "team_id": team_id,
            "user_id": user_id,
            "status": "active"
        })
        if not membership:
            raise HTTPException(400, f"User {user_id} is not a team member")
    
    # 4. Update task
    await db.tasks.update_one(
        {"_id": task_id},
        {
            "$set": {
                "assigned_to": assignment.assigned_to,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # 5. Create notifications if requested
    if assignment.notify:
        for user_id in assignment.assigned_to:
            user = await db.users.find_one({"_id": user_id}, {"_id": 0})
            await create_notification(
                user_id=user_id,
                type="task_assigned",
                title="New Task Assigned",
                message=f"{current_user['name']} assigned you to '{task['title']}'",
                link=f"/tasks/{task_id}",
                priority="normal",
                metadata={
                    "team_id": team_id,
                    "task_id": task_id,
                    "actor_id": current_user["id"],
                    "actor_name": current_user["name"]
                }
            )
    
    # 6. Log activity
    assignee_names = []
    for user_id in assignment.assigned_to:
        user = await db.users.find_one({"_id": user_id}, {"_id": 0, "name": 1})
        assignee_names.append(user["name"])
    
    await log_activity(
        team_id=team_id,
        task_id=task_id,
        user_id=current_user["id"],
        action_type="task_assigned",
        action_details={
            "task_title": task["title"],
            "assigned_to_names": assignee_names
        }
    )
    
    return {"task_id": task_id, "assigned_to": assignment.assigned_to}
```

---

## 5. Security & Permissions

### 5.1 Role-Based Access Control

```python
def get_role_permissions(role: str) -> dict:
    permissions_map = {
        "owner": {
            "can_create_tasks": True,
            "can_assign_tasks": True,
            "can_delete_tasks": True,
            "can_manage_members": True,
            "can_view_analytics": True,
            "can_delete_team": True,
            "can_transfer_ownership": True
        },
        "admin": {
            "can_create_tasks": True,
            "can_assign_tasks": True,
            "can_delete_tasks": True,
            "can_manage_members": True,
            "can_view_analytics": True,
            "can_delete_team": False,
            "can_transfer_ownership": False
        },
        "member": {
            "can_create_tasks": True,
            "can_assign_tasks": False,
            "can_delete_tasks": False,
            "can_manage_members": False,
            "can_view_analytics": False,
            "can_delete_team": False,
            "can_transfer_ownership": False
        }
    }
    return permissions_map.get(role, permissions_map["member"])
```

### 5.2 Permission Checks

```python
async def check_team_permission(team_id: str, user_id: str, permission: str) -> bool:
    membership = await db.team_members.find_one({
        "team_id": team_id,
        "user_id": user_id,
        "status": "active"
    })
    
    if not membership:
        return False
    
    return membership["permissions"].get(permission, False)

# Dependency for protected endpoints
async def require_team_permission(
    team_id: str,
    permission: str,
    current_user: dict = Depends(get_current_user)
):
    has_permission = await check_team_permission(team_id, current_user["id"], permission)
    if not has_permission:
        raise HTTPException(403, f"Permission '{permission}' required")
    return current_user
```

### 5.3 Data Privacy Rules

1. **Team Data:** Only accessible to team members
2. **Task Data:** 
   - Team tasks: Visible to all team members
   - Comments: Visible to all team members
   - Personal tasks: Only owner can see
3. **Member Data:** 
   - Basic info (name, email) visible to all team members
   - Contact info visible only if user allows
4. **Analytics:** Only accessible with `can_view_analytics` permission

---

## 6. Error Handling

### 6.1 Standard Error Responses

```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to perform this action",
    "status": 403,
    "details": {
      "required_permission": "can_manage_members",
      "user_role": "member"
    }
  }
}
```

### 6.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | No valid authentication |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permission |
| `TEAM_NOT_FOUND` | 404 | Team doesn't exist |
| `MEMBER_NOT_FOUND` | 404 | Member doesn't exist in team |
| `TASK_NOT_FOUND` | 404 | Task doesn't exist |
| `INVALID_INPUT` | 400 | Validation failed |
| `DUPLICATE_MEMBER` | 409 | User already in team |
| `DUPLICATE_TEAM_NAME` | 409 | Team name already exists |
| `TEAM_LIMIT_REACHED` | 403 | User reached max teams |
| `MEMBER_LIMIT_REACHED` | 403 | Team reached max members |

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Database collections setup
- [ ] Team CRUD APIs
- [ ] Basic member management
- [ ] Permission system

### Phase 2: Tasks (Week 2)
- [ ] Team task creation
- [ ] Multi-user assignment
- [ ] Team task dashboard
- [ ] Task filtering

### Phase 3: Collaboration (Week 3)
- [ ] Comments system
- [ ] Activity logs
- [ ] Notifications
- [ ] @mentions

### Phase 4: Polish (Week 4)
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Search & filters
- [ ] Performance optimization

---

## 8. Frontend Routes

```
/teams                      # List all teams
/teams/new                  # Create team modal/page
/teams/:id                  # Team dashboard
/teams/:id/tasks            # Team tasks (Kanban view)
/teams/:id/members          # Team members
/teams/:id/settings         # Team settings (owner/admin only)
/teams/:id/analytics        # Team analytics
/tasks/:id                  # Task detail with comments
```

---

## 9. Testing Checklist

### Unit Tests
- [ ] Team creation with valid/invalid data
- [ ] Member role permission checks
- [ ] Task assignment validation
- [ ] Comment mention parsing

### Integration Tests
- [ ] Complete team creation flow
- [ ] Member invitation and acceptance
- [ ] Task assignment and notification
- [ ] Comment creation with mentions

### E2E Tests
- [ ] User creates team and invites members
- [ ] Owner assigns task to multiple members
- [ ] Members collaborate via comments
- [ ] Admin manages team settings

---

This completes the technical specifications. Ready to proceed with implementation?
