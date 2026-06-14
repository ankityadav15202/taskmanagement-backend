# Task Management Platform — Backend API

A production-grade REST API for a task management platform (Jira/Trello-like), built with Node.js, Express, and MongoDB.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit
- **Docs**: Swagger / OpenAPI 3.0
- **Logging**: morgan
- **Testing**: Jest + Supertest

---

## Project Structure

```
src/
├── config/
│   ├── db.js              # MongoDB connection
│   └── swagger.js         # Swagger config
├── controllers/           # Route handlers (thin layer)
│   ├── authController.js
│   ├── taskController.js
│   ├── commentController.js
│   ├── dashboardController.js
│   └── userController.js
├── middleware/
│   ├── auth.js            # JWT protect + adminOnly
│   ├── errorHandler.js    # Global error handler
│   └── validate.js        # express-validator result handler
├── models/
│   ├── User.js
│   ├── Task.js
│   └── Comment.js
├── routes/
│   ├── authRoutes.js
│   ├── taskRoutes.js
│   └── userRoutes.js
├── services/              # Business logic layer
│   ├── authService.js
│   ├── taskService.js
│   ├── commentService.js
│   └── dashboardService.js
└── server.js              # App entry point
tests/
└── authService.test.js
```

---

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd task-management-backend
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanagement
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Run

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

### 4. Run Tests

```bash
npm test
```

---

## API Documentation

After starting the server, visit:
```
http://localhost:5000/api/docs
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login + get JWT | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks` | List tasks (filters + pagination) | ✅ |
| POST | `/api/tasks` | Create task | ✅ |
| GET | `/api/tasks/:id` | Get task by ID | ✅ |
| PUT | `/api/tasks/:id` | Update task | ✅ |
| DELETE | `/api/tasks/:id` | Soft delete task | ✅ |
| GET | `/api/tasks/:id/history` | Get audit log / task history | ✅ |

**Query params for GET /api/tasks:**
- `search` — full-text search on title/description
- `status` — `todo` | `in-progress` | `review` | `done`
- `priority` — `low` | `medium` | `high` | `critical`
- `assignee` — user ID
- `sortBy` — `dueDate` | `dueDate_desc` | `priority`
- `page` — page number (default: 1)
- `limit` — items per page (default: 10)

### Comments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks/:taskId/comments` | Get comments for task | ✅ |
| POST | `/api/tasks/:taskId/comments` | Add comment | ✅ |
| PUT | `/api/tasks/:taskId/comments/:commentId` | Edit own comment | ✅ |
| DELETE | `/api/tasks/:taskId/comments/:commentId` | Delete own comment | ✅ |

### Dashboard & Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard` | Get stats & metrics | ✅ |
| GET | `/api/users` | Get all users | Admin |
| PATCH | `/api/users/:id/deactivate` | Deactivate user | Admin |

---

## Database Design

### Users Collection
```js
{
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: 'admin' | 'member',
  isActive: Boolean,
  timestamps: true
}
```

### Tasks Collection
```js
{
  title: String,
  description: String,
  status: 'todo' | 'in-progress' | 'review' | 'done',
  priority: 'low' | 'medium' | 'high' | 'critical',
  assignee: ObjectId (ref: User),
  createdBy: ObjectId (ref: User),
  dueDate: Date,
  labels: [String],
  isDeleted: Boolean (soft delete),
  timestamps: true
}
// Indexes: status, priority, assignee, createdBy, dueDate, text(title+description)
```

### Comments Collection
```js
{
  task: ObjectId (ref: Task),
  author: ObjectId (ref: User),
  text: String,
  isEdited: Boolean,
  isDeleted: Boolean,
  timestamps: true
}
// Indexes: task + createdAt, author
```

### Task History Collection
```js
{
  task: ObjectId (ref: Task),
  user: ObjectId (ref: User),
  action: 'create' | 'update',
  changes: [
    {
      field: String,
      oldValue: Mixed,
      newValue: Mixed
    }
  ],
  createdAt: Date
}
// Indexes: task + createdAt
```

---

## Architecture Decisions

### Controller → Service Pattern
Controllers are thin — they only handle HTTP request/response. All business logic lives in services. This makes the code testable, reusable, and easy to reason about.

### Soft Deletes
Tasks and comments use `isDeleted: true` instead of hard deletes. A Mongoose `pre-find` middleware auto-excludes deleted records. This supports potential audit/recovery needs.

### Role-Based Access
- **Admin**: Full access to all tasks, users, assignments
- **Member**: Can only see/update tasks they created or were assigned to. Members are also permitted to list users and reassign tasks (but cannot modify the task creator `createdBy` field).

### JWT Authentication
Stateless JWT tokens stored in the Authorization header (Bearer token). No sessions or cookies needed — works cleanly with SPAs and mobile apps.

### Pagination
All list endpoints support `page` and `limit` query params and return `pagination` metadata in the response.

### Swagger/OpenAPI Documentation
Centralized OpenAPI specification resides in `src/config/swagger.js`. Route handler JSDoc tags have been cleaned up and unified into a single configuration file for maintenance and readability.

---

## Tradeoffs

| Decision | Tradeoff |
|----------|----------|
| No refresh tokens | Simpler auth but tokens can't be revoked before expiry |
| Soft deletes | Data safety at the cost of slightly more complex queries |
| No Redis caching | Simpler setup; can be added for dashboard/stats later |
| Plain JS (not TypeScript) | Faster to build; TS migration is straightforward |

---

## Security Features

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT validation on all protected routes
- Input sanitization via express-validator
- Rate limiting (100 req / 15 min per IP)
- Helmet.js for secure HTTP headers
- CORS configured for specific origins
- Request body size limit (10kb)
- MongoDB injection protection via Mongoose

---

## Health Check

```
GET /health
```
Returns server status and timestamp.
