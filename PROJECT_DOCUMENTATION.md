# CRM v2 Project Documentation

## Overview

CRM v2 is a modern Customer Relationship Management system built with a clean architecture approach, featuring a React-based frontend and Firebase backend with Cloud Functions. The project implements Domain-Driven Design (DDD) principles with clear separation between core business logic, infrastructure, and presentation layers.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Firebase      │    │   Cloud         │
│   (React/Vite)  │◄──►│   Firestore     │◄──►│   Functions     │
│                 │    │   Hosting       │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Project Structure

```
CRM-v2/
├── front-end/          # React frontend application
├── functions/          # Firebase Cloud Functions backend
├── .firebase/          # Firebase deployment cache
├── .github/            # GitHub Actions workflows
├── firebase.json       # Firebase configuration
├── firestore.rules     # Firestore security rules
└── firestore.indexes.json # Firestore database indexes
```

## Frontend Application

### Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: TanStack Query (React Query)
- **Authentication**: Clerk
- **Routing**: React Router
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling

### Frontend Architecture

```
src/
├── components/         # Reusable UI components
│   ├── auth/          # Authentication components
│   ├── layout/        # Layout components
│   └── ui/            # Base UI components (Radix UI)
├── core/              # Domain layer (Clean Architecture)
│   ├── entities/      # Business entities and domain models
│   └── ports/         # Interfaces for repositories and services
├── hooks/             # Custom React hooks
│   ├── repository-hooks/  # Data fetching hooks
│   └── service-hooks/     # Service interaction hooks
├── infrastructure/    # Infrastructure layer
│   └── firebase/      # Firebase configuration and setup
├── pages/             # Page components
├── repositories/      # Data access implementations
├── services/          # External service integrations
└── utils/             # Utility functions
```

### Key Features

- **Authentication**: Integrated with Clerk for user management
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript coverage with Zod schemas
- **Real-time Data**: Firebase Firestore integration
- **Component Library**: Custom UI components built on Radix UI
- **State Management**: Efficient caching and synchronization with TanStack Query

## Backend (Cloud Functions)

### Technology Stack

- **Runtime**: Node.js 22
- **Language**: TypeScript
- **Platform**: Firebase Cloud Functions
- **Database**: Firestore
- **Authentication**: Clerk backend integration
- **Validation**: Zod schemas
- **Messaging**: Google Cloud Pub/Sub

### Backend Architecture

```
src/
├── app/               # Application layer
│   ├── availability/  # Availability management
│   └── clerk/         # Clerk integration
├── config/            # Configuration files
├── core/              # Domain layer
│   ├── dtos/          # Data Transfer Objects
│   ├── entities/      # Business entities
│   └── ports/         # Repository and service interfaces
├── functions/         # Cloud Function definitions
├── infrastructure/    # Infrastructure layer
├── repositories/      # Data access implementations
├── services/          # Business services
└── utils/             # Utility functions
```

### Key Services

- **Authentication Service**: Clerk integration for user management
- **Database Service**: Firestore operations
- **Logger Service**: Centralized logging
- **Pub/Sub Service**: Event-driven messaging

## Domain Model

### Core Entities

1. **User**: System users with authentication
2. **Organization**: Multi-tenant organization structure
3. **Member**: Organization members with roles
4. **Customer**: Customer management with custom fields
5. **Service**: Business services offered
6. **Appointment**: Booking and scheduling
7. **Calendar**: Calendar management
8. **Role**: Role-based access control
9. **Time Off**: Staff availability management

### Entity Relationships

```
Organization
├── Members (Users with Roles)
├── Customers
├── Services
├── Appointments
├── Calendars
└── Time Off Records
```

## Development Setup

### Prerequisites

- Node.js 22+
- npm or yarn
- Firebase CLI
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CRM-v2
   ```

2. **Install frontend dependencies**
   ```bash
   cd front-end
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../functions
   npm install
   ```

4. **Configure environment variables**
   - Copy `.env.development` and `.env.production` in the frontend
   - Set up Clerk publishable keys
   - Configure Firebase project settings

### Development Commands

#### Frontend
```bash
cd front-end
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run preview      # Preview production build
```

#### Backend
```bash
cd functions
npm run build        # Build TypeScript
npm run build:watch  # Build with watch mode
npm run serve        # Start Firebase emulators
npm run deploy       # Deploy to Firebase
npm run emulators    # Start all emulators
npm run test         # Run tests
npm run format       # Format code
```

## Deployment

### Firebase Hosting (Frontend)

The frontend is automatically deployed to Firebase Hosting when changes are pushed to the main branch via GitHub Actions.

**Manual deployment:**
```bash
cd front-end
npm run build
firebase deploy --only hosting
```

### Cloud Functions (Backend)

**Manual deployment:**
```bash
cd functions
npm run deploy
```

### CI/CD Pipeline

GitHub Actions workflows are configured for:
- **Pull Request**: Preview deployments
- **Main Branch**: Production deployments

## Configuration Files

### Firebase Configuration

- **firebase.json**: Main Firebase configuration
- **firestore.rules**: Database security rules
- **firestore.indexes.json**: Database indexes
- **.firebaserc**: Firebase project aliases

### Frontend Configuration

- **vite.config.ts**: Vite build configuration
- **tsconfig.json**: TypeScript configuration
- **tailwind.config.js**: Tailwind CSS configuration
- **components.json**: Shadcn/ui configuration

### Backend Configuration

- **tsconfig.json**: TypeScript configuration
- **package.json**: Dependencies and scripts
- **.eslintrc.js**: ESLint configuration

## Code Quality

### Linting and Formatting

- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting with import organization
- **TypeScript**: Strict type checking

### Architecture Principles

1. **Clean Architecture**: Clear separation of concerns
2. **Domain-Driven Design**: Business logic in domain layer
3. **Dependency Inversion**: Interfaces define contracts
4. **Single Responsibility**: Each module has one purpose
5. **Type Safety**: Full TypeScript coverage

## Security

### Authentication
- Clerk handles user authentication and session management
- JWT tokens for secure API communication
- Role-based access control (RBAC)

### Database Security
- Firestore security rules enforce data access policies
- User-based and organization-based data isolation
- Input validation with Zod schemas

### Environment Variables
- Sensitive configuration stored in environment variables
- Separate configurations for development and production
- No secrets committed to version control

## Performance Considerations

### Frontend
- Code splitting with Vite
- Lazy loading of components
- Optimized bundle size
- TanStack Query for efficient data caching

### Backend
- Firestore query optimization
- Cloud Function cold start mitigation
- Efficient data structures and indexes

## Monitoring and Logging

### Frontend
- React Query DevTools for development
- Error boundaries for error handling
- Performance monitoring with Vite

### Backend
- Firebase Functions logging
- Custom logger service
- Error tracking and monitoring

## Contributing

1. Follow the established architecture patterns
2. Maintain type safety with TypeScript
3. Write tests for new features
4. Follow the code formatting standards
5. Update documentation for significant changes

## License

This project is private and proprietary.

---

*Last updated: December 2024*