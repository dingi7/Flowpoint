# Flowpoint CRM

A modern, full-featured Customer Relationship Management (CRM) application built with React, TypeScript, and Firebase. Flowpoint helps businesses manage appointments, customers, services, team members, and organizations with an intuitive interface and powerful API.

## 🚀 Features

- **📅 Calendar Management** - Visual calendar interface for scheduling and managing appointments
- **👥 Customer Management** - Comprehensive customer database with custom fields
- **🎯 Service Management** - Create and manage services with pricing, duration, and images
- **👨‍💼 Team Management** - Manage team members, roles, and permissions
- **📊 Dashboard** - Analytics and insights into your business operations
- **🔐 Authentication** - Secure authentication powered by Clerk
- **🌐 Multi-language Support** - Internationalization (i18n) support
- **🔌 REST API** - Full REST API for programmatic access
- **🔔 Webhooks** - Real-time event notifications via webhooks
- **📱 Widget SDK** - Embeddable booking widget for your website

## 🏗️ Architecture

The project consists of two main components:

### 1. Flowpoint (Main CRM Application)
- **Location**: `/flowpoint`
- **Type**: Frontend React application
- **Purpose**: The main CRM application where users manage their business
- **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: Zustand, React Query
- **Routing**: React Router v7
- **Authentication**: Clerk

### 2. Functions (Backend)
- **Location**: `/functions`
- **Type**: Backend API and services
- **Purpose**: Powers the Flowpoint CRM and provides REST API endpoints
- **Tech Stack**: Firebase Cloud Functions, TypeScript, Node.js 22
- **Database**: Firestore
- **Authentication**: Clerk Backend SDK
- **Features**: REST API endpoints, webhook system, background jobs

### 3. SDK (Widget)
- **Location**: `/sdk`
- **Purpose**: Embeddable booking widget for external websites

### Other Directories

The following directories are **demo/client websites** for demonstration purposes:
- **`/first-class`** - Example client website integration

## 📋 Prerequisites

- Node.js 22+ (for functions)
- Node.js 18+ (for frontend)
- Firebase CLI
- Clerk account and API keys
- Firebase project with Firestore, Functions, and Storage enabled

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone dingi7/Flowpoint
cd Flowpoint
```

### 2. Install dependencies

#### Frontend (Flowpoint)
```bash
cd flowpoint
npm install
```

#### Backend (Functions)
```bash
cd functions
npm install
```

### 3. Environment Setup

#### Flowpoint Environment Variables

Create a `.env` file in the `flowpoint` directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

Set up your Firebase config
`flowpoint/src/infrastructure/firebase/index.ts`

#### Functions Environment Variables

Configure Firebase secrets, the required secrets are exposed in `/functions/src/config/secrets.ts`
Set you GCP project inside `/functions/src/config/gcp.ts`

## 🚀 Development

### Start Flowpoint (Frontend)

```bash
cd flowpoint
npm run dev
```

The application will be available at `http://localhost:5173`

### Start Functions (Backend)

```bash
cd functions
npm run serve
```

This starts the Firebase emulators for local development.

### Build for Production

#### Frontend
```bash
cd flowpoint
npm run build
```

#### Backend
```bash
cd functions
npm run build
```

## 📁 Project Structure

```
Flowpoint/
├── flowpoint/              # Main CRM Application (Frontend)
│   ├── src/
│   │   ├── app/           # App-level components
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── repositories/  # Data access layer
│   │   ├── services/      # Business logic services
│   │   ├── stores/        # Zustand state stores
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
│
├── functions/             # Backend (Firebase Cloud Functions)
│   ├── src/
│   │   ├── app/          # Application layer
│   │   ├── functions/    # Cloud function handlers
│   │   ├── core/         # Domain entities and ports
│   │   ├── repositories/ # Data access layer
│   │   └── services/     # Business logic services
│   └── lib/              # Compiled JavaScript
│
├── sdk/                   # Embeddable booking widget
├── first-class/           # Demo: Example client website
└── API_DOCUMENTATION.md   # Complete API documentation
└── test-sdk.html          # Demo: Example usage of the embedded SDK
```

> **Note**: The `first-class` directory and test-sdk.html are demo/client websites for demonstration purposes only. The main application is `flowpoint` (CRM) and `functions` (backend).

## 🔑 Key Features Explained

### Authentication
- Powered by Clerk for secure user authentication
- Role-based access control (RBAC)
- Organization-level permissions

### Data Management
- **Customers**: Store customer information with custom fields
- **Services**: Define services with pricing, duration, and images
- **Appointments**: Schedule and manage appointments
- **Team Members**: Manage team with role assignments
- **Organizations**: Multi-tenant organization support

### API & Webhooks
- RESTful API for all CRUD operations
- API key authentication
- Webhook subscriptions for real-time events
- HMAC SHA256 signature verification for webhooks

## 🌍 Internationalization

The application supports multiple languages:
- English (en)
- Bulgarian (bg)
- Turkish (tr)

Language files are located in `flowpoint/src/locales/`.

## 🧪 Testing

```bash
# Run tests in functions directory
cd functions
npm test
```

## 📦 Deployment

### Deploy Functions

```bash
cd functions
npm run deploy
```

### Deploy Frontend

Build and deploy the `flowpoint/dist` directory to your hosting provider (e.g., Firebase Hosting, Vercel, Netlify).

## 🔒 Security

- API keys are required for all API endpoints
- Webhook signatures are verified using HMAC SHA256
- Firebase Security Rules protect database access
- Clerk handles authentication and authorization

## 📚 Documentation

- [API Documentation](https://docs.flowpoint.services/) - Complete REST API and webhooks documentation
- Code is well-documented with TypeScript types
- Follows functional programming principles


**Built with ❤️ using React, TypeScript, and GCP**

