# CRM API & Webhooks Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Webhooks](#webhooks)
5. [Error Handling](#error-handling)
6. [Rate Limits](#rate-limits)

---

## Introduction

This document provides comprehensive documentation for the CRM API and Webhooks system. The API allows you to programmatically interact with the CRM system, while webhooks enable real-time notifications of events.

### Base URL

```
https://[region]-[project-id].cloudfunctions.net
```

### API Version

Current API version: `v1`

### Content Type

All API requests and responses use `application/json` content type.

---

## Authentication

### API Key Authentication

All API endpoints require authentication using an API key. The API key must be included in the `Authorization` header.

#### Header Format

```
Authorization: Bearer <api-key>
```

#### Example

```http
GET /apiGetOrganizationServices HTTP/1.1
Host: us-central1-your-project.cloudfunctions.net
Authorization: Bearer your-api-key-here
Content-Type: application/json
```

#### Obtaining an API Key

API keys are managed through the CRM admin portal. Users with `MANAGE_ORGANIZATION` permission can create and revoke API keys for their organization.

#### Security Best Practices

- **Never expose API keys** in client-side code or public repositories
- **Rotate API keys** regularly
- **Revoke unused keys** immediately
- **Use HTTPS** for all API requests

---

## API Endpoints

### Services

#### List Services

Retrieve all services for the authenticated organization.

**Endpoint:** `GET /apiListServices`

**Headers:**
- `Authorization: Bearer <api-key>` (required)
- `Content-Type: application/json`

**Query Parameters:** None

**Response:**

```json
{
  "success": true,
  "services": [
    {
      "id": "service-123",
      "organizationId": "org-456",
      "ownerType": "member",
      "ownerId": "member-789",
      "name": "Consultation",
      "description": "30-minute consultation",
      "price": 100.00,
      "duration": 30,
      "image": "https://example.com/image.jpg",
      "order": 1,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing API key
- `500 Internal Server Error` - Server error

---

#### Get Service

Retrieve a specific service by ID.

**Endpoint:** `GET /apiGetService`

**Headers:**
- `Authorization: Bearer <api-key>` (required)
- `Content-Type: application/json`

**Query Parameters:**
- `serviceId` (string, required) - The ID of the service to retrieve

**Example Request:**

```http
GET /apiGetService?serviceId=service-123 HTTP/1.1
Authorization: Bearer your-api-key-here
```

**Response:**

```json
{
  "success": true,
  "service": {
    "id": "service-123",
    "organizationId": "org-456",
    "ownerType": "member",
    "ownerId": "member-789",
    "name": "Consultation",
    "description": "30-minute consultation",
    "price": 100.00,
    "duration": 30,
    "image": "https://example.com/image.jpg",
    "order": 1,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Missing or invalid serviceId
- `401 Unauthorized` - Invalid or missing API key
- `404 Not Found` - Service not found
- `500 Internal Server Error` - Server error

---

#### Create Service

Create a new service for the organization.

**Endpoint:** `POST /apiCreateService`

**Headers:**
- `Authorization: Bearer <api-key>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "ownerType": "member",
  "ownerId": "member-789",
  "name": "Consultation",
  "description": "30-minute consultation",
  "price": 100.00,
  "duration": 30,
  "image": "https://example.com/image.jpg",
  "order": 1
}
```

**Request Body Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ownerType` | string | Yes | Owner type: `"member"` or `"organization"` |
| `ownerId` | string | Yes | ID of the owner (member or organization) |
| `name` | string | Yes | Service name |
| `description` | string | No | Service description |
| `price` | number | Yes | Service price |
| `duration` | number | Yes | Service duration in minutes |
| `image` | string | No | URL to service image |
| `order` | number | No | Display order |

**Response:**

```json
{
  "success": true,
  "serviceId": "service-123"
}
```

**Status Codes:**
- `201 Created` - Service created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid or missing API key
- `500 Internal Server Error` - Server error

---

#### Update Service

Update an existing service.

**Endpoint:** `PUT /apiUpdateService`

**Headers:**
- `Authorization: Bearer <api-key>` (required)
- `Content-Type: application/json`

**Query Parameters:**
- `serviceId` (string, required) - The ID of the service to update

**Request Body:**

```json
{
  "name": "Updated Consultation",
  "price": 150.00,
  "duration": 45
}
```

**Request Body Schema:**

All fields are optional. Only include fields you want to update.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Service name |
| `description` | string | No | Service description |
| `price` | number | No | Service price |
| `duration` | number | No | Service duration in minutes |
| `image` | string | No | URL to service image |
| `order` | number | No | Display order |

**Response:**

```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Service updated successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid or missing API key
- `404 Not Found` - Service not found
- `500 Internal Server Error` - Server error

---

#### Delete Service

Delete a service.

**Endpoint:** `DELETE /apiDeleteService`

**Headers:**
- `Authorization: Bearer <api-key>` (required)
- `Content-Type: application/json`

**Query Parameters:**
- `serviceId` (string, required) - The ID of the service to delete

**Response:**

```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Service deleted successfully
- `400 Bad Request` - Missing serviceId
- `401 Unauthorized` - Invalid or missing API key
- `404 Not Found` - Service not found
- `500 Internal Server Error` - Server error

---

### Appointments

#### List Appointments

Retrieve appointments for the organization with optional filters.

**Endpoint:** `GET /apiListAppointments`

**Headers:**
- `Authorization: Bearer <api-key>` (required)
- `Content-Type: application/json`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `"pending"`, `"completed"`, `"cancelled"` |
| `customerId` | string | No | Filter by customer ID |
| `serviceId` | string | No | Filter by service ID |
| `startDate` | string | No | Filter by start date (ISO 8601 format) |
| `endDate` | string | No | Filter by end date (ISO 8601 format) |

**Example Request:**

```http
GET /apiListAppointments?status=pending&startDate=2024-01-01T00:00:00Z HTTP/1.1
Authorization: Bearer your-api-key-here
```

**Response:**

```json
{
  "success": true,
  "appointments": [
    {
      "id": "appt-123",
      "organizationId": "org-456",
      "assigneeType": "member",
      "assigneeId": "member-789",
      "customerId": "customer-101",
      "serviceId": "service-123",
      "title": "Consultation",
      "description": "Initial consultation",
      "startTime": "2024-01-20T10:00:00Z",
      "duration": 30,
      "fee": 100.00,
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Invalid or missing API key
- `500 Internal Server Error` - Server error

---

#### Get Appointment

Retrieve a specific appointment by ID.

**Endpoint:** `GET /apiGetAppointment`

**Headers:**
- `Authorization: Bearer <api-key>` (required)
- `Content-Type: application/json`

**Query Parameters:**
- `appointmentId` (string, required) - The ID of the appointment to retrieve

**Response:**

```json
{
  "success": true,
  "appointment": {
    "id": "appt-123",
    "organizationId": "org-456",
    "assigneeType": "member",
    "assigneeId": "member-789",
    "customerId": "customer-101",
    "serviceId": "service-123",
    "title": "Consultation",
    "description": "Initial consultation",
    "startTime": "2024-01-20T10:00:00Z",
    "duration": 30,
    "fee": 100.00,
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Missing or invalid appointmentId
- `401 Unauthorized` - Invalid or missing API key
- `404 Not Found` - Appointment not found
- `500 Internal Server Error` - Server error

---

#### Create Appointment

Create a new appointment.

**Endpoint:** `POST /apiCreateAppointment`

**Headers:**
- `Authorization: Bearer <api-key>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "assigneeType": "member",
  "assigneeId": "member-789",
  "customerId": "customer-101",
  "serviceId": "service-123",
  "title": "Consultation",
  "description": "Initial consultation",
  "startTime": "2024-01-20T10:00:00Z",
  "duration": 30,
  "fee": 100.00,
  "status": "pending"
}
```

**Request Body Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assigneeType` | string | Yes | Assignee type: `"member"` or `"organization"` |
| `assigneeId` | string | Yes | ID of the assignee |
| `customerId` | string | Yes | ID of the customer |
| `serviceId` | string | Yes | ID of the service |
| `title` | string | Yes | Appointment title |
| `description` | string | Yes | Appointment description |
| `startTime` | string | Yes | Start time (ISO 8601 format) |
| `duration` | number | Yes | Duration in minutes |
| `fee` | number | No | Appointment fee |
| `status` | string | Yes | Status: `"pending"`, `"completed"`, `"cancelled"` |

**Response:**

```json
{
  "success": true,
  "appointmentId": "appt-123"
}
```

**Status Codes:**
- `201 Created` - Appointment created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid or missing API key
- `500 Internal Server Error` - Server error

---

#### Update Appointment

Update an existing appointment.

**Endpoint:** `PUT /apiUpdateAppointment`

**Headers:**
- `Authorization: Bearer <api-key>` (required)
- `Content-Type: application/json`

**Query Parameters:**
- `appointmentId` (string, required) - The ID of the appointment to update

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "title": "Updated Consultation",
  "status": "completed",
  "fee": 150.00
}
```

**Response:**

```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Appointment updated successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid or missing API key
- `404 Not Found` - Appointment not found
- `500 Internal Server Error` - Server error

---

#### Delete Appointment

Delete an appointment.

**Endpoint:** `DELETE /apiDeleteAppointment`

**Headers:**
- `Authorization: Bearer <api-key>` (required)
- `Content-Type: application/json`

**Query Parameters:**
- `appointmentId` (string, required) - The ID of the appointment to delete

**Response:**

```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Appointment deleted successfully
- `400 Bad Request` - Missing appointmentId
- `401 Unauthorized` - Invalid or missing API key
- `404 Not Found` - Appointment not found
- `500 Internal Server Error` - Server error

---

#### Book Appointment

Book an appointment (public endpoint for widget integration).

**Endpoint:** `POST /apiBookAppointment`

**Headers:**
- `Authorization: Bearer <api-key>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "serviceId": "service-123",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "startTime": "2024-01-20T10:00:00Z",
  "assigneeId": "member-789",
  "additionalCustomerFields": {
    "company": "Acme Corp",
    "notes": "First-time customer"
  }
}
```

**Request Body Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceId` | string | Yes | ID of the service |
| `customerEmail` | string | Yes | Customer email address |
| `customerName` | string | Yes | Customer name |
| `customerPhone` | string | Yes | Customer phone number |
| `startTime` | string | Yes | Start time (ISO 8601 format) |
| `assigneeId` | string | Yes | ID of the assignee |
| `additionalCustomerFields` | object | No | Additional customer fields |

**Response:**

```json
{
  "success": true,
  "appointmentId": "appt-123",
  "confirmationDetails": {
    "appointmentId": "appt-123",
    "startTime": "2024-01-20T10:00:00Z",
    "duration": 30,
    "serviceName": "Consultation"
  }
}
```

**Status Codes:**
- `200 OK` - Appointment booked successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid or missing API key
- `500 Internal Server Error` - Server error

---

#### Get Available Timeslots

Get available timeslots for a service on a specific date.

**Endpoint:** `POST /apiGetAvailableTimeslots`

**Headers:**
- `Authorization: Bearer <api-key>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "serviceId": "service-123",
  "date": "2024-01-20"
}
```

**Request Body Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceId` | string | Yes | ID of the service |
| `date` | string | Yes | Date in YYYY-MM-DD format |

**Response:**

```json
{
  "success": true,
  "timeslots": [
    {
      "startTime": "2024-01-20T09:00:00Z",
      "endTime": "2024-01-20T09:30:00Z",
      "available": true
    },
    {
      "startTime": "2024-01-20T09:30:00Z",
      "endTime": "2024-01-20T10:00:00Z",
      "available": true
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid or missing API key
- `500 Internal Server Error` - Server error

---

#### Get Organization Services

Get all services for the organization (public endpoint for widget integration).

**Endpoint:** `GET /apiGetOrganizationServices`

**Headers:**
- `Authorization: Bearer <api-key>` (required)
- `Content-Type: application/json`

**Response:**

```json
{
  "success": true,
  "services": [
    {
      "id": "service-123",
      "name": "Consultation",
      "description": "30-minute consultation",
      "price": 100.00,
      "duration": 30,
      "image": "https://example.com/image.jpg"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing API key
- `500 Internal Server Error` - Server error

---

## Webhooks

Webhooks allow you to receive real-time notifications when events occur in your CRM system. Webhooks are sent via HTTP POST requests to your specified callback URL.

### Setting Up Webhooks

Webhooks are configured through the CRM admin portal using the `createWebhookSubscription` callable function. Users with `MANAGE_ORGANIZATION` permission can create webhook subscriptions.

### Webhook Subscription

#### Create Webhook Subscription

**Function:** `createWebhookSubscription` (Firebase Callable Function)

**Authentication:** Firebase Auth (requires `MANAGE_ORGANIZATION` permission)

**Request:**

```json
{
  "organizationId": "org-456",
  "eventTypes": [
    "customer.created",
    "customer.updated",
    "appointment.created"
  ],
  "callbackUrl": "https://your-domain.com/webhooks"
}
```

**Request Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `organizationId` | string | Yes | Organization ID |
| `eventTypes` | string[] | Yes | Array of event types to subscribe to (min 1) |
| `callbackUrl` | string | Yes | HTTPS URL to receive webhooks (must be valid URL) |

**Response:**

```json
{
  "webhookSubscription": {
    "id": "sub-123",
    "eventTypes": [
      "customer.created",
      "customer.updated",
      "appointment.created"
    ],
    "callbackUrl": "https://your-domain.com/webhooks",
    "status": "active",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Note:** When a webhook subscription is created, a secret is generated and sent to your callback URL via POST request. You must store this secret securely as it will be used to verify webhook signatures.

**Initial Secret Delivery:**

When you create a webhook subscription, the system will POST the secret to your callback URL:

```http
POST https://your-domain.com/webhooks HTTP/1.1
Content-Type: application/json

{
  "secret": "base64-encoded-secret-here",
  "eventTypes": [
    "customer.created",
    "customer.updated",
    "appointment.created"
  ]
}
```

**Important:** Your endpoint must respond with a `2xx` status code to confirm receipt of the secret. If your endpoint fails to respond successfully, the webhook subscription creation will fail.

---

### Webhook Events

#### Available Event Types

| Event Type | Description |
|------------|-------------|
| `customer.created` | Triggered when a new customer is created |
| `customer.updated` | Triggered when a customer is updated |
| `customer.deleted` | Triggered when a customer is deleted |
| `appointment.created` | Triggered when a new appointment is created |
| `appointment.updated` | Triggered when an appointment is updated |
| `appointment.deleted` | Triggered when an appointment is deleted |
| `service.created` | Triggered when a new service is created |
| `service.updated` | Triggered when a service is updated |
| `service.deleted` | Triggered when a service is deleted |
| `member.created` | Triggered when a new member is created |
| `member.updated` | Triggered when a member is updated |
| `member.deleted` | Triggered when a member is deleted |
| `invite.created` | Triggered when a new invite is created |
| `invite.updated` | Triggered when an invite is updated |
| `invite.deleted` | Triggered when an invite is deleted |

---

### Webhook Payload

All webhook payloads follow the same structure:

```json
{
  "event": "customer.created",
  "data": {
    // Entity-specific data (see below)
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

**Payload Schema:**

| Field | Type | Description |
|-------|------|-------------|
| `event` | string | The event type (e.g., `"customer.created"`) |
| `data` | object | The entity data (varies by event type) |
| `timestamp` | string | ISO 8601 timestamp of when the event occurred |

---

### Webhook Headers

Each webhook request includes the following headers:

| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` |
| `X-Webhook-Signature` | HMAC SHA256 signature of the payload |
| `X-Webhook-Event` | The event type (e.g., `customer.created`) |

---

### Webhook Security

#### Signature Verification

All webhooks are signed using HMAC SHA256. You must verify the signature to ensure the webhook is authentic and hasn't been tampered with.

**Verification Process:**

1. Extract the `X-Webhook-Signature` header from the request
2. Compute the HMAC SHA256 of the request body using your webhook secret
3. Compare the computed signature with the header value (use constant-time comparison)

**Example (Node.js):**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}

// Usage
const signature = req.headers['x-webhook-signature'];
const isValid = verifyWebhookSignature(req.body, signature, webhookSecret);

if (!isValid) {
  return res.status(401).send('Invalid signature');
}
```

**Example (Python):**

```python
import hmac
import hashlib
import json

def verify_webhook_signature(payload, signature, secret):
    computed_signature = hmac.new(
        secret.encode('utf-8'),
        json.dumps(payload).encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Use constant-time comparison
    return hmac.compare_digest(signature, computed_signature)

# Usage
signature = request.headers.get('X-Webhook-Signature')
is_valid = verify_webhook_signature(request.json, signature, webhook_secret)

if not is_valid:
    return {'error': 'Invalid signature'}, 401
```

---

### Event-Specific Payloads

#### Customer Events

**Customer Created/Updated/Deleted:**

```json
{
  "event": "customer.created",
  "data": {
    "id": "customer-101",
    "organizationId": "org-456",
    "email": "customer@example.com",
    "customFields": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890"
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

#### Appointment Events

**Appointment Created/Updated/Deleted:**

```json
{
  "event": "appointment.created",
  "data": {
    "id": "appt-123",
    "organizationId": "org-456",
    "assigneeType": "member",
    "assigneeId": "member-789",
    "customerId": "customer-101",
    "serviceId": "service-123",
    "title": "Consultation",
    "description": "Initial consultation",
    "startTime": "2024-01-20T10:00:00Z",
    "duration": 30,
    "fee": 100.00,
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

#### Service Events

**Service Created/Updated/Deleted:**

```json
{
  "event": "service.created",
  "data": {
    "id": "service-123",
    "organizationId": "org-456",
    "ownerType": "member",
    "ownerId": "member-789",
    "name": "Consultation",
    "description": "30-minute consultation",
    "price": 100.00,
    "duration": 30,
    "image": "https://example.com/image.jpg",
    "order": 1,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

#### Member Events

**Member Created/Updated/Deleted:**

```json
{
  "event": "member.created",
  "data": {
    "id": "member-789",
    "organizationId": "org-456",
    "name": "Jane Smith",
    "roleIds": ["role-1", "role-2"],
    "image": "https://example.com/avatar.jpg",
    "description": "Senior Consultant",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

#### Invite Events

**Invite Created/Updated/Deleted:**

```json
{
  "event": "invite.created",
  "data": {
    "id": "invite-456",
    "inviterId": "user-123",
    "inviteeEmail": "newmember@example.com",
    "organizationId": "org-456",
    "roleIds": ["role-1"],
    "status": "pending",
    "validFor": 7,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

### Webhook Best Practices

1. **Always verify signatures** - Never process webhooks without verifying the signature
2. **Respond quickly** - Your endpoint should respond within 5 seconds
3. **Handle duplicates** - Webhooks may be delivered multiple times; implement idempotency
4. **Use HTTPS** - Webhooks are only sent to HTTPS URLs
5. **Store secrets securely** - Never log or expose webhook secrets
6. **Implement retry logic** - If your endpoint fails, webhooks may be retried
7. **Log webhook events** - Keep logs of received webhooks for debugging

---

### Webhook Response

Your webhook endpoint should respond with a `2xx` status code to indicate successful processing. Any other status code may result in retry attempts.

**Recommended Response:**

```json
{
  "received": true
}
```

---

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "details": {
    // Optional: Additional error details
  }
}
```

### HTTP Status Codes

| Status Code | Description |
|------------|-------------|
| `200 OK` | Request successful |
| `201 Created` | Resource created successfully |
| `400 Bad Request` | Invalid request data or parameters |
| `401 Unauthorized` | Invalid or missing API key |
| `404 Not Found` | Resource not found |
| `405 Method Not Allowed` | HTTP method not allowed for endpoint |
| `500 Internal Server Error` | Server error |

### Common Error Scenarios

#### Invalid API Key

```json
{
  "success": false,
  "error": "Invalid API key"
}
```

**Status:** `401 Unauthorized`

---

#### Missing Required Field

```json
{
  "success": false,
  "error": "Invalid request data",
  "details": [
    {
      "path": ["serviceId"],
      "message": "Required"
    }
  ]
}
```

**Status:** `400 Bad Request`

---

#### Resource Not Found

```json
{
  "success": false,
  "error": "Service not found"
}
```

**Status:** `404 Not Found`

---

## Rate Limits

Currently, there are no rate limits enforced on the API. However, we reserve the right to implement rate limiting in the future. We recommend:

- Implementing client-side rate limiting
- Caching responses when appropriate
- Using webhooks instead of polling when possible

---

## Support

For API support, please contact your CRM administrator or refer to the CRM documentation portal.

---

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API release
- Webhook support added
- All CRUD operations for services and appointments
- Customer, member, and invite webhook events

---

**Last Updated:** January 15, 2024

