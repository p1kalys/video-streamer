# Video Streamer - Content Classification Platform

A full-stack video processing application with automated content sensitivity analysis, real-time updates, and secure streaming capabilities.

## Features

### Core Features
- **User Authentication** - JWT-based authentication with role-based access control
- **Video Upload** - Drag-and-drop interface with progress tracking
- **Real-time Processing** - Socket.io for live status updates during video processing
- **Content Analysis** - Automated sensitivity detection (safe, flagged)
- **Video Streaming** - Secure token-based streaming with Cloudinary integration
- **Video Management** - List, filter, search, and delete videos
- **Responsive UI** - Modern Tailwind CSS interface with React

### Technical Features
- **Cloud Storage** - Cloudinary integration for video hosting
- **Real-time Updates** - Socket.io with event queuing system
- **Role-based Access** - Admin, Editor, Viewer roles with different permissions
- **Content Classification** - AI-powered sensitivity analysis with confidence scores
- **Search & Filtering** - Advanced filtering by status, sensitivity, and search terms

## Project Structure

```
video-app/
├── apps/
│   ├── backend/          # Express.js API server
│   │   ├── src/
│   │   │   ├── controllers/     # API route handlers
│   │   │   ├── middleware/      # Auth, validation, authorization
│   │   │   ├── models/          # MongoDB schemas
│   │   │   ├── routes/          # API routes
│   │   │   ├── services/        # Business logic
│   │   │   ├── socket/          # Socket.io handlers
│   │   │   ├── config/          # Database, upload, environment
│   │   │   └── utils/           # Helper functions
│   │
│   └── frontend/         # React + Vite application
│       └── src/
│           ├── components/      # Reusable UI components
│           ├── context/         # React contexts (Auth)
│           ├── hooks/           # Custom hooks (Socket)
│           ├── pages/           # Page components
│           └── services/        # API service layer
│
└── packages/
    └── shared/           # Shared types & validation schemas
        └── src/
```

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript (ESM)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.io
- **File Upload**: Multer with Cloudinary storage
- **Validation**: Zod
- **Security**: Helmet, CORS, bcryptjs
- **Dev Tool**: tsx (ESM runner)

### Frontend
- **Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod validation
- **File Upload**: react-dropzone
- **Real-time**: Socket.io Client
- **Notifications**: react-hot-toast

### Shared
- **Validation**: Zod schemas and types
- **Module System**: Dual ESM (.js) + CommonJS (.cjs) exports

### Infrastructure
- **Cloud Storage**: Cloudinary for video hosting
- **Database**: MongoDB Atlas (production ready)
- **Development**: Local MongoDB support

## Prerequisites

- Node.js 18+ (ESM support required)
- MongoDB Atlas account or local MongoDB instance
- Cloudinary account
- npm or yarn package manager

## Installation and Setup Guide

### 1. Clone Repository

```bash
git clone <repository-url>
cd video-app
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install
```

### 3. Build Shared Package

```bash
# Build shared types and validation
npm run build:shared
```

### 4. Backend Setup

```bash
cd apps/backend

# Create environment file
cp .env.example .env
# Configure environment variables

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

### 5. Frontend Setup

```bash
cd apps/frontend

# Create environment file (optional)
cp .env.example .env
# Configure environment variables

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "viewer" // admin, editor, viewer
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "viewer"
    },
    "token": "jwt_token"
  }
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

#### GET /api/auth/me
Get current user profile (requires authentication).

### Video Endpoints

#### POST /api/videos/upload
Upload a new video (requires admin/editor role).

**Request:** multipart/form-data
- `video`: Video file (max 2GB)
- `title`: Video title
- `description`: Video description (optional)
- `tags`: Array of tags (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "video": {
      "_id": "video_id",
      "title": "Video Title",
      "processing": {
        "status": "pending"
      }
    }
  }
}
```

#### GET /api/videos/list
List videos with filtering and pagination (requires authentication).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (max: 100, default: 20)
- `status`: Filter by processing status (pending, processing, completed, failed)
- `sensitivity`: Filter by sensitivity (all, safe, flagged, review)
- `search`: Search by title
- `sortBy`: Sort field (uploadDate, title, size)
- `order`: Sort order (asc, desc)

#### GET /api/videos/:videoId
Get video details by ID.

#### GET /api/videos/:videoId/stream
Stream video file (requires authentication token in query).

#### DELETE /api/videos/:videoId
Deletes video (requires ownership or admin role).

### Socket.io Events

#### Client Events
- Connection automatically authenticated via JWT token

#### Server Events
- `processing_started`: Video processing has begun
- `processing_completed`: Video processing finished with results
- `processing_failed`: Video processing failed with error

## User Manual

### Registration and Login

1. **Create Account**
   - Navigate to `http://localhost:5173/register`
   - Fill in email, password, first name, last name
   - Select role (viewer, editor, admin)
   - Password must contain uppercase letter and number

2. **Login**
   - Navigate to `http://localhost:5173/login`
   - Enter email and password
   - JWT token stored in localStorage

### Dashboard Navigation

- **Dashboard**: View all videos with real-time updates
- **Upload**: Upload new videos (admin/editor only)
- **Video Player**: Watch videos with secure streaming

### Video Upload Process

1. **Upload Video**
   - Click "Upload Video" button (admin/editor only)
   - Drag and drop video file or click to select
   - Supported formats: MP4, QuickTime, AVI, Matroska, WebM
   - Maximum file size: 2GB

2. **Video Information**
   - Enter title (required, max 200 characters)
   - Add description (optional, max 2000 characters)
   - Add tags (optional, max 10 tags)

3. **Processing**
   - Video automatically queued for processing
   - Real-time status updates via Socket.io
   - Processing stages: pending → processing → completed/failed

### Video Management

#### Viewing Videos
- All users can view completed videos
- Click "Watch" button to open video player
- Secure streaming with token authentication

#### Filtering and Search
- **Status Filter**: Filter by processing status
- **Sensitivity Filter**: Filter by content sensitivity
- **Search**: Search videos by title
- **Sorting**: Sort by upload date, title, or file size

#### Deleting Videos
- Click "Delete" button on video card
- Confirmation dialog required
- Soft delete (video marked as deleted, not removed)
- Only video owner or admin can delete

### Content Sensitivity Analysis

Videos are automatically analyzed for content sensitivity:

- **Safe** (Green): Content is appropriate for all audiences
- **Flagged** (Red): Content may be inappropriate and requires review
- **Review** (Yellow): Content borderline and may need manual review

Analysis factors:
- Video duration
- File size and resolution
- Video format and codec
- Bitrate quality

## Architecture Overview

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (React)       │◄──►│   (Express)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ - UI Components │    │ - REST API      │    │ - MongoDB       │
│ - Socket Client │    │ - Socket.io     │    │ - Cloudinary    │
│ - State Mgmt    │    │ - Auth Layer    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **Upload Flow**
   - Frontend → Backend API → Cloudinary → MongoDB
   - Real-time updates via Socket.io

2. **Streaming Flow**
   - Frontend → Backend API → Cloudinary → Client
   - Token-based authentication

3. **Processing Flow**
   - Backend Service → Analysis Algorithm → MongoDB
   - Socket.io events for status updates

### Key Design Patterns

#### Authentication & Authorization
- JWT tokens for stateless authentication
- Role-based middleware for endpoint protection
- Secure password hashing with bcryptjs

#### Real-time Communication
- Socket.io with user-specific rooms
- Event queuing system for reliable delivery
- Automatic reconnection handling

#### File Storage
- Local storage for development
- Cloudinary integration for production
- Soft delete pattern for data retention

#### Error Handling
- Centralized error middleware
- Consistent API response format
- Frontend error boundaries

## Assumptions and Design Decisions

### Technical Assumptions

1. **ESM Module System**
   - Full ESM adoption across all packages
   - Shared package compatibility

2. **Cloudinary Integration**
   - Primary video storage solution
   - Automatic transcoding and optimization
   - CDN delivery for global performance

3. **MongoDB Schema Design**
   - Embedded processing results in video documents
   - Soft delete pattern with deletedAt timestamps
   - Optimized indexes for common queries

4. **Real-time Architecture**
   - Socket.io for live processing updates
   - Event queuing prevents message loss
   - User-specific rooms for targeted updates

### Business Logic Assumptions

1. **Content Classification**
   - Algorithmic analysis based on metadata
   - Confidence scoring system (60-99%)
   - Three-tier sensitivity classification

2. **Role-Based Access**
   - Viewer: Can only watch videos
   - Editor: Can upload and manage own videos
   - Admin: Full system access

3. **File Handling**
   - 2GB maximum file size limit
   - Support for major video formats
   - Automatic processing on upload

### Security Decisions

1. **Authentication Strategy**
   - JWT tokens
   - Secure password requirements
   - Token-based streaming authentication

2. **Data Protection**
   - Soft delete for data retention
   - Input validation with Zod schemas
   - CORS and security headers

3. **Access Control**
   - Route-level authorization middleware
   - Resource ownership verification
   - API rate limiting considerations

### Performance Considerations

1. **Database Optimization**
   - Indexed queries for video listings
   - Pagination for large datasets
   - Efficient aggregation pipelines

2. **Frontend Optimization**
   - Lazy loading for video components
   - Debounced search inputs
   - Optimized re-renders with React hooks

3. **Network Optimization**
   - CDN delivery via Cloudinary
   - Efficient Socket.io connections
   - Compressed API responses

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions by user role
- **Input Validation**: Comprehensive Zod schema validation
- **File Upload Security**: Type and size validation
- **Secure Streaming**: Token-authenticated video access
- **CORS Protection**: Configurable cross-origin policies
- **Password Security**: bcrypt hashing with salt rounds

### Common Issues

#### Socket.io Connection Issues
- Verify backend is running on correct port
- Check JWT token in localStorage
- Ensure CORS origins are properly configured

#### Video Upload Problems
- Check file size and format restrictions
- Verify Cloudinary configuration
- Review network connectivity

#### Database Connection Errors
- Verify MongoDB URI is correct
- Check network connectivity
- Ensure database user permissions
