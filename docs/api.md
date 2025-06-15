# Certificate Verification System API Documentation

## Overview

This document provides comprehensive documentation for the Certificate Verification System API. The API follows RESTful principles and provides endpoints for managing certificates, templates, users, and verification.

## Base URL

```
https://your-domain.com/api
```

## Authentication

Most API endpoints require authentication. The API uses JWT (JSON Web Tokens) for authentication.

### Authentication Methods

1. **Bearer Token**: Include the JWT in the Authorization header
   ```
   Authorization: Bearer <token>
   ```

2. **Cookie-based**: For browser-based applications, the token is stored in an HTTP-only cookie

### Getting a Token

To obtain a token, use the login endpoint:

```
POST /auth/login
```

## API Endpoints

### Authentication API

#### Login

Authenticates a user and returns a JWT token.

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN"
  }
}
```

**Status Codes:**
- `200 OK`: Login successful
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded

#### Logout

Logs out the current user by invalidating the token.

```
POST /auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Status Codes:**
- `200 OK`: Logout successful
- `401 Unauthorized`: Not authenticated

#### Get Current User

Returns information about the currently authenticated user.

```
GET /auth/me
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "last_login": "2023-01-01T00:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: Request successful
- `401 Unauthorized`: Not authenticated

#### Register

Registers a new user.

```
POST /auth/signup
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "124",
    "email": "newuser@example.com",
    "name": "Jane Doe",
    "role": "STUDENT"
  }
}
```

**Status Codes:**
- `201 Created`: Registration successful
- `400 Bad Request`: Invalid input
- `409 Conflict`: Email already exists
- `429 Too Many Requests`: Rate limit exceeded

#### Get CSRF Token

Returns a CSRF token for form submission.

```
GET /auth/csrf-token
```

**Response:**
```json
{
  "success": true,
  "csrfToken": "abc123def456",
  "expiresIn": 3600
}
```

**Status Codes:**
- `200 OK`: Request successful
- `500 Internal Server Error`: Error generating token

### Certificates API

#### List Certificates

Returns a list of certificates based on query parameters.

```
GET /certificates
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 10)
- `sort`: Field to sort by (default: created_at)
- `order`: Sort order (asc or desc, default: desc)
- `recipient`: Filter by recipient ID
- `template`: Filter by template ID
- `issuer`: Filter by issuer ID
- `status`: Filter by status (active, revoked, expired)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cert123",
      "recipient_id": "user456",
      "recipient_name": "John Student",
      "template_id": "template789",
      "template_name": "Course Completion",
      "issuer_id": "admin001",
      "issuer_name": "Admin User",
      "verification_code": "ABC123XYZ",
      "issue_date": "2023-01-01T00:00:00Z",
      "expiry_date": "2024-01-01T00:00:00Z",
      "revoked": false,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

**Status Codes:**
- `200 OK`: Request successful
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to view certificates

#### Create Certificate

Creates a new certificate.

```
POST /certificates
```

**Request Body:**
```json
{
  "recipient_id": "user456",
  "template_id": "template789",
  "issue_date": "2023-01-01T00:00:00Z",
  "expiry_date": "2024-01-01T00:00:00Z",
  "metadata": {
    "course_name": "Introduction to Programming",
    "grade": "A",
    "credits": 3
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate created successfully",
  "data": {
    "id": "cert124",
    "recipient_id": "user456",
    "template_id": "template789",
    "issuer_id": "admin001",
    "verification_code": "DEF456UVW",
    "issue_date": "2023-01-01T00:00:00Z",
    "expiry_date": "2024-01-01T00:00:00Z",
    "revoked": false,
    "metadata": {
      "course_name": "Introduction to Programming",
      "grade": "A",
      "credits": 3
    },
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

**Status Codes:**
- `201 Created`: Certificate created successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to create certificates
- `404 Not Found`: Template or recipient not found

#### Get Certificate

Returns details of a specific certificate.

```
GET /certificates/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cert123",
    "recipient_id": "user456",
    "recipient_name": "John Student",
    "template_id": "template789",
    "template_name": "Course Completion",
    "issuer_id": "admin001",
    "issuer_name": "Admin User",
    "verification_code": "ABC123XYZ",
    "issue_date": "2023-01-01T00:00:00Z",
    "expiry_date": "2024-01-01T00:00:00Z",
    "revoked": false,
    "revocation_reason": null,
    "metadata": {
      "course_name": "Introduction to Programming",
      "grade": "A",
      "credits": 3
    },
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "download_url": "/api/certificates/cert123/download",
    "verification_url": "/verify/ABC123XYZ"
  }
}
```

**Status Codes:**
- `200 OK`: Request successful
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to view this certificate
- `404 Not Found`: Certificate not found

#### Update Certificate

Updates an existing certificate.

```
PUT /certificates/:id
```

**Request Body:**
```json
{
  "expiry_date": "2025-01-01T00:00:00Z",
  "metadata": {
    "course_name": "Advanced Programming",
    "grade": "A+",
    "credits": 4
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate updated successfully",
  "data": {
    "id": "cert123",
    "recipient_id": "user456",
    "template_id": "template789",
    "issuer_id": "admin001",
    "verification_code": "ABC123XYZ",
    "issue_date": "2023-01-01T00:00:00Z",
    "expiry_date": "2025-01-01T00:00:00Z",
    "revoked": false,
    "metadata": {
      "course_name": "Advanced Programming",
      "grade": "A+",
      "credits": 4
    },
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-02T00:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: Certificate updated successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to update this certificate
- `404 Not Found`: Certificate not found

#### Revoke Certificate

Revokes a certificate.

```
POST /certificates/:id/revoke
```

**Request Body:**
```json
{
  "revocation_reason": "Certificate issued in error"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate revoked successfully",
  "data": {
    "id": "cert123",
    "revoked": true,
    "revocation_reason": "Certificate issued in error",
    "updated_at": "2023-01-03T00:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: Certificate revoked successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to revoke this certificate
- `404 Not Found`: Certificate not found

#### Verify Certificate

Verifies a certificate by its verification code.

```
GET /certificates/verify?code=ABC123XYZ
```

**Query Parameters:**
- `code`: Certificate verification code

**Response:**
```json
{
  "success": true,
  "verified": true,
  "data": {
    "id": "cert123",
    "recipient_name": "John Student",
    "template_name": "Course Completion",
    "issuer_name": "Admin User",
    "issue_date": "2023-01-01T00:00:00Z",
    "expiry_date": "2024-01-01T00:00:00Z",
    "status": "valid",
    "metadata": {
      "course_name": "Introduction to Programming",
      "grade": "A",
      "credits": 3
    }
  }
}
```

**Status Codes:**
- `200 OK`: Request successful
- `404 Not Found`: Certificate not found

### Templates API

#### List Templates

Returns a list of certificate templates.

```
GET /templates
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 10)
- `sort`: Field to sort by (default: created_at)
- `order`: Sort order (asc or desc, default: desc)
- `creator`: Filter by creator ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "template789",
      "name": "Course Completion",
      "description": "Template for course completion certificates",
      "creator_id": "admin001",
      "creator_name": "Admin User",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "preview_url": "/api/templates/template789/preview"
    }
  ],
  "pagination": {
    "total": 20,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

**Status Codes:**
- `200 OK`: Request successful
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to view templates

#### Create Template

Creates a new certificate template.

```
POST /templates
```

**Request Body:**
```json
{
  "name": "Professional Certification",
  "description": "Template for professional certification certificates",
  "html_template": "<div class='certificate'>...</div>",
  "css_styles": ".certificate { ... }",
  "default_metadata": {
    "certification_name": "",
    "certification_level": "",
    "valid_for": "1 year"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Template created successfully",
  "data": {
    "id": "template790",
    "name": "Professional Certification",
    "description": "Template for professional certification certificates",
    "creator_id": "admin001",
    "html_template": "<div class='certificate'>...</div>",
    "css_styles": ".certificate { ... }",
    "default_metadata": {
      "certification_name": "",
      "certification_level": "",
      "valid_for": "1 year"
    },
    "created_at": "2023-01-02T00:00:00Z",
    "updated_at": "2023-01-02T00:00:00Z",
    "preview_url": "/api/templates/template790/preview"
  }
}
```

**Status Codes:**
- `201 Created`: Template created successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to create templates

#### Get Template

Returns details of a specific template.

```
GET /templates/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template789",
    "name": "Course Completion",
    "description": "Template for course completion certificates",
    "creator_id": "admin001",
    "creator_name": "Admin User",
    "html_template": "<div class='certificate'>...</div>",
    "css_styles": ".certificate { ... }",
    "default_metadata": {
      "course_name": "",
      "grade": "",
      "credits": 0
    },
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "preview_url": "/api/templates/template789/preview"
  }
}
```

**Status Codes:**
- `200 OK`: Request successful
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to view this template
- `404 Not Found`: Template not found

#### Update Template

Updates an existing template.

```
PUT /templates/:id
```

**Request Body:**
```json
{
  "name": "Updated Course Completion",
  "description": "Updated template for course completion certificates",
  "html_template": "<div class='certificate'>...</div>",
  "css_styles": ".certificate { ... }",
  "default_metadata": {
    "course_name": "",
    "grade": "",
    "credits": 0,
    "instructor": ""
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Template updated successfully",
  "data": {
    "id": "template789",
    "name": "Updated Course Completion",
    "description": "Updated template for course completion certificates",
    "creator_id": "admin001",
    "html_template": "<div class='certificate'>...</div>",
    "css_styles": ".certificate { ... }",
    "default_metadata": {
      "course_name": "",
      "grade": "",
      "credits": 0,
      "instructor": ""
    },
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-03T00:00:00Z",
    "preview_url": "/api/templates/template789/preview"
  }
}
```

**Status Codes:**
- `200 OK`: Template updated successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to update this template
- `404 Not Found`: Template not found

#### Delete Template

Deletes a template.

```
DELETE /templates/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

**Status Codes:**
- `200 OK`: Template deleted successfully
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to delete this template
- `404 Not Found`: Template not found
- `409 Conflict`: Template is in use by certificates

### Users API

#### List Users

Returns a list of users.

```
GET /users
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 10)
- `sort`: Field to sort by (default: created_at)
- `order`: Sort order (asc or desc, default: desc)
- `role`: Filter by role (ADMIN, STAFF, STUDENT)
- `search`: Search by name or email

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user456",
      "email": "student@example.com",
      "name": "John Student",
      "role": "STUDENT",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "last_login": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

**Status Codes:**
- `200 OK`: Request successful
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to view users

#### Create User

Creates a new user.

```
POST /users
```

**Request Body:**
```json
{
  "email": "newstaff@example.com",
  "password": "password123",
  "name": "New Staff",
  "role": "STAFF"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user457",
    "email": "newstaff@example.com",
    "name": "New Staff",
    "role": "STAFF",
    "created_at": "2023-01-03T00:00:00Z",
    "updated_at": "2023-01-03T00:00:00Z"
  }
}
```

**Status Codes:**
- `201 Created`: User created successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to create users
- `409 Conflict`: Email already exists

#### Get User

Returns details of a specific user.

```
GET /users/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user456",
    "email": "student@example.com",
    "name": "John Student",
    "role": "STUDENT",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "last_login": "2023-01-01T00:00:00Z",
    "certificates": [
      {
        "id": "cert123",
        "template_name": "Course Completion",
        "issue_date": "2023-01-01T00:00:00Z",
        "expiry_date": "2024-01-01T00:00:00Z",
        "status": "valid"
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Request successful
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to view this user
- `404 Not Found`: User not found

#### Update User

Updates an existing user.

```
PUT /users/:id
```

**Request Body:**
```json
{
  "name": "John Student Updated",
  "role": "STAFF"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "user456",
    "email": "student@example.com",
    "name": "John Student Updated",
    "role": "STAFF",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-03T00:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: User updated successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to update this user
- `404 Not Found`: User not found

#### Delete User

Deletes a user.

```
DELETE /users/:id
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Status Codes:**
- `200 OK`: User deleted successfully
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to delete this user
- `404 Not Found`: User not found
- `409 Conflict`: User has associated certificates

### System API

#### Health Check

Returns the health status of the system.

```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400,
  "timestamp": "2023-01-03T00:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "storage": "connected"
  }
}
```

**Status Codes:**
- `200 OK`: System is healthy
- `503 Service Unavailable`: System is unhealthy

#### Metrics

Returns system metrics.

```
GET /metrics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "certificates": {
      "total": 1000,
      "active": 950,
      "revoked": 30,
      "expired": 20,
      "issued_today": 5
    },
    "users": {
      "total": 500,
      "admins": 5,
      "staff": 45,
      "students": 450,
      "active_today": 50
    },
    "verifications": {
      "total_today": 100,
      "successful": 95,
      "failed": 5
    },
    "system": {
      "cpu_usage": 25,
      "memory_usage": 40,
      "disk_usage": 30,
      "requests_per_minute": 60
    }
  }
}
```

**Status Codes:**
- `200 OK`: Request successful
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to view metrics

#### Instances

Returns information about running instances.

```
GET /instances
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_instances": 3,
    "instances": [
      {
        "id": "instance-1",
        "hostname": "app-1",
        "uptime": 86400,
        "version": "1.0.0",
        "status": "healthy",
        "load": {
          "cpu": 25,
          "memory": 40,
          "requests": 20
        }
      },
      {
        "id": "instance-2",
        "hostname": "app-2",
        "uptime": 43200,
        "version": "1.0.0",
        "status": "healthy",
        "load": {
          "cpu": 30,
          "memory": 45,
          "requests": 25
        }
      },
      {
        "id": "instance-3",
        "hostname": "app-3",
        "uptime": 21600,
        "version": "1.0.0",
        "status": "healthy",
        "load": {
          "cpu": 20,
          "memory": 35,
          "requests": 15
        }
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Request successful
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to view instances

#### Database Statistics

Returns database statistics.

```
GET /db-stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tables": {
      "users": {
        "rows": 500,
        "size": "1.2 MB",
        "last_vacuum": "2023-01-01T00:00:00Z"
      },
      "certificates": {
        "rows": 1000,
        "size": "2.5 MB",
        "last_vacuum": "2023-01-01T00:00:00Z"
      },
      "templates": {
        "rows": 20,
        "size": "0.5 MB",
        "last_vacuum": "2023-01-01T00:00:00Z"
      },
      "verification_logs": {
        "rows": 5000,
        "size": "1.8 MB",
        "last_vacuum": "2023-01-01T00:00:00Z"
      }
    },
    "performance": {
      "avg_query_time": 5,
      "slow_queries": 2,
      "connections": 10,
      "max_connections": 100
    },
    "status": {
      "uptime": 86400,
      "version": "14.5",
      "size": "10.5 MB",
      "last_backup": "2023-01-02T00:00:00Z"
    }
  }
}
```

**Status Codes:**
- `200 OK`: Request successful
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to view database statistics

#### Cache Management

Manages the cache.

```
POST /cache
```

**Request Body:**
```json
{
  "action": "clear",
  "key": "certificates:*"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "data": {
    "keys_affected": 10
  }
}
```

**Status Codes:**
- `200 OK`: Request successful
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to manage cache

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `AUTHENTICATION_ERROR`: Authentication failed
- `AUTHORIZATION_ERROR`: Not authorized to perform the action
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists or cannot be modified
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting

The API implements rate limiting to prevent abuse. Rate limits vary by endpoint:

- Authentication endpoints: 10 requests per minute
- Certificate verification endpoints: 30 requests per minute
- User management endpoints: 20 requests per minute
- Template management endpoints: 50 requests per minute
- Default rate limit: 100 requests per minute

Rate limit information is included in the response headers:

```
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 95
X-Rate-Limit-Reset: 2023-01-03T00:01:00Z
```

When a rate limit is exceeded, the API returns a 429 Too Many Requests response with a Retry-After header.

## Pagination

List endpoints support pagination using the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 10)

Pagination information is included in the response:

```json
{
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

## Sorting and Filtering

List endpoints support sorting and filtering using the following query parameters:

- `sort`: Field to sort by (default varies by endpoint)
- `order`: Sort order (asc or desc, default: desc)
- Additional filtering parameters specific to each endpoint

## CORS

The API supports Cross-Origin Resource Sharing (CORS) with the following configuration:

- Allowed origins: Configured via environment variables
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
- Allowed headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token
- Exposed headers: X-Total-Count, X-Rate-Limit-Limit, X-Rate-Limit-Remaining, X-Rate-Limit-Reset
- Credentials: Allowed
- Max age: 3600 seconds

## Versioning

The API does not currently use explicit versioning in the URL. Future versions will be handled through content negotiation using the Accept header.

## OpenAPI Specification

The complete OpenAPI specification is available at:

```
/api/openapi.json
```

You can also view the interactive API documentation using Swagger UI at:

```
/api/docs
```