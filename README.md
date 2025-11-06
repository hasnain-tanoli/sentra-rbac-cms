# Sentra RBAC CMS

A modern Content Management System (CMS) built with Next.js 16, featuring a robust Role-Based Access Control (RBAC) system. This project provides a secure and flexible platform for managing content with granular user permissions.

## Features

- 🔐 **Advanced RBAC System**
  - Role-based user management
  - Granular permissions control
  - Dynamic permission assignment
  - User role management
  
- 📝 **Content Management**
  - Rich text editor with TinyMCE
  - Post creation and management
  - Media handling
  - Content versioning
  
- 🎨 **Modern UI/UX**
  - Built with Tailwind CSS
  - Responsive design
  - Shadcn UI components
  - Clean dashboard interface

- 🔒 **Authentication & Security**
  - Next-Auth integration
  - Secure credential management
  - Protected routes
  - Session management

- 📊 **Dashboard & Analytics**
  - User activity monitoring
  - Content statistics
  - Recharts integration
  - Performance metrics

## Tech Stack

- **Frontend:**
  - Next.js 16
  - React 19.2
  - Tailwind CSS
  - Shadcn UI
  - TinyMCE Editor

- **Backend:**
  - Next.js API Routes
  - MongoDB with Mongoose
  - Next-Auth
  - TypeScript

- **Security:**
  - bcryptjs for password hashing
  - Role-based authentication
  - Permission-based authorization

## Prerequisites

- Node.js 18+ 
- MongoDB database
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/hasnain-tanoli/sentra-rbac-cms.git
cd sentra-rbac-cms
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Run database migrations and seed initial data:
```bash
npm run seed
# or
yarn seed
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Project Structure

- `/src/app` - Next.js application routes and API endpoints
- `/src/components` - Reusable React components
- `/src/lib` - Utilities, database connections, and RBAC logic
- `/src/types` - TypeScript type definitions
- `/scripts` - Database migration and seeding scripts

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run seed` - Seed database with initial data
- `npm run migrate` - Run database migrations
- `npm run promote` - Promote a user to admin

## RBAC System

The RBAC system is built on three main entities:
- **Users** - System users with assigned roles
- **Roles** - Collections of permissions (e.g., Admin, Editor, Author)
- **Permissions** - Granular access controls for specific actions

### Permission Structure
Permissions are defined as combinations of:
- **Resource** - The entity being accessed (e.g., posts, users)
- **Action** - The operation being performed (e.g., create, read, update, delete)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
