const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Task Management API',
    version: '1.0.0',
    description: 'REST API for Task Management Platform',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'password123' },
                  role: { type: 'string', enum: ['admin', 'member'], example: 'member' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User registered successfully' },
          409: { description: 'Email already exists' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful, returns JWT token' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Get current logged-in user',
        tags: ['Auth'],
        responses: {
          200: { description: 'Current user data' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/dashboard': {
      get: {
        summary: 'Get dashboard statistics',
        tags: ['Dashboard'],
        responses: {
          200: { description: 'Dashboard stats' }
        }
      }
    },
    '/users': {
      get: {
        summary: 'Get all users (Admin only)',
        tags: ['Users'],
        responses: {
          200: { description: 'List of users' },
          403: { description: 'Admin only' }
        }
      }
    },
    '/users/{id}/deactivate': {
      patch: {
        summary: 'Deactivate a user (Admin only)',
        tags: ['Users'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: { description: 'User deactivated' }
        }
      }
    },
    '/tasks': {
      get: {
        summary: 'Get all tasks (with filters & pagination)',
        tags: ['Tasks'],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['todo', 'in-progress', 'review', 'done'] } },
          { in: 'query', name: 'priority', schema: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] } },
          { in: 'query', name: 'assignee', schema: { type: 'string' } },
          { in: 'query', name: 'sortBy', schema: { type: 'string', enum: ['dueDate', 'dueDate_desc', 'priority', 'createdAt'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } }
        ],
        responses: {
          200: { description: 'List of tasks with pagination' }
        }
      },
      post: {
        summary: 'Create a new task',
        tags: ['Tasks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  assignee: { type: 'string' },
                  status: { type: 'string', enum: ['todo', 'in-progress', 'review', 'done'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                  dueDate: { type: 'string', format: 'date' },
                  labels: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Task created' }
        }
      }
    },
    '/tasks/{id}': {
      get: {
        summary: 'Get a single task by ID',
        tags: ['Tasks'],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Task data' },
          404: { description: 'Task not found' }
        }
      },
      put: {
        summary: 'Update a task',
        tags: ['Tasks'],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Task updated' }
        }
      },
      delete: {
        summary: 'Delete a task (soft delete)',
        tags: ['Tasks'],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Task deleted' }
        }
      }
    },
    '/tasks/{taskId}/comments': {
      get: {
        summary: 'Get all comments for a task',
        tags: ['Comments'],
        parameters: [
          { in: 'path', name: 'taskId', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'List of comments' }
        }
      },
      post: {
        summary: 'Add a comment to a task',
        tags: ['Comments'],
        parameters: [
          { in: 'path', name: 'taskId', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Comment added' }
        }
      }
    },
    '/tasks/{taskId}/comments/{commentId}': {
      put: {
        summary: 'Update a comment',
        tags: ['Comments'],
        parameters: [
          { in: 'path', name: 'taskId', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'commentId', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Comment updated' }
        }
      },
      delete: {
        summary: 'Delete a comment',
        tags: ['Comments'],
        parameters: [
          { in: 'path', name: 'taskId', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'commentId', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Comment deleted' }
        }
      }
    },
    '/tasks/{taskId}/history': {
      get: {
        summary: 'Get task history',
        tags: ['History'],
        parameters: [
          { in: 'path', name: 'taskId', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'List of history logs' }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
