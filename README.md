# WhoPayWhat Backend

A NestJS-powered backend application for expense sharing and group payment management. Built with modern technologies including Supabase authentication, Prisma ORM, and Zod validation.

## Features

- 🔐 **Authentication**: Secure user authentication with Supabase
- 📊 **Expense Management**: Create and manage group expenses and receipts
- 👥 **Group Management**: Create groups and manage members
- 💰 **Payment Tracking**: Track who paid what and calculate splits
- ✅ **Data Validation**: Robust input validation using Zod schemas
- 🗄️ **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- 🚀 **Performance**: Redis caching for improved performance
- 📝 **Type Safety**: Full TypeScript support with strict typing

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **Validation**: Zod with nestjs-zod
- **Caching**: Redis
- **Language**: TypeScript

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (or Supabase account)
- Redis server

## Environment Setup

1. Copy the environment example file:

   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in `.env`:

### Required Environment Variables

| Variable                    | Description                                 | Example                                            |
| --------------------------- | ------------------------------------------- | -------------------------------------------------- |
| `PORT`                      | Application port                            | `3001`                                             |
| `NODE_ENV`                  | Environment mode                            | `development`                                      |
| `DATABASE_URL`              | PostgreSQL connection string                | `postgresql://user:pass@localhost:5432/whopaywhat` |
| `DIRECT_URL`                | Direct database connection (for migrations) | `postgresql://user:pass@localhost:5432/whopaywhat` |
| `SUPABASE_URL`              | Your Supabase project URL                   | `https://your-project.supabase.co`                 |
| `SUPABASE_ANON_KEY`         | Supabase anonymous key                      | `your-anon-key`                                    |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key                   | `your-service-key`                                 |
| `REDIS_HOST`                | Redis server host                           | `localhost`                                        |
| `REDIS_PORT`                | Redis server port                           | `6379`                                             |
| `REDIS_PASSWORD`            | Redis password (if required)                | `your-redis-password`                              |
| `JWT_SECRET`                | JWT signing secret                          | `your-jwt-secret`                                  |
| `JWT_EXPIRES_IN`            | JWT expiration time                         | `24h`                                              |

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd whopaywhat-be
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the database:

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate deploy
   ```

4. Start the development server:
   ```bash
   npm run start:dev
   ```

The application will be available at `http://localhost:3001`.

## Database Setup

### Using Supabase (Recommended)

1. Create a new project at [Supabase](https://supabase.com)
2. Get your project URL and API keys from the project settings
3. Update your `.env` file with the Supabase credentials
4. Run the migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Using Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database named `whopaywhat`
3. Update the `DATABASE_URL` in your `.env` file
4. Run the migrations:
   ```bash
   npx prisma migrate deploy
   ```

## Data Validation

This application uses Zod for robust data validation with the `nestjs-zod` integration.

### Validation Features

- **Type-safe schemas**: All DTOs are generated from Zod schemas
- **Automatic validation**: Global validation pipe ensures all requests are validated
- **Custom error messages**: Detailed validation error responses
- **Runtime type checking**: Ensures data integrity at runtime

### Example Validation Schema

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SignUpSchema = z.object({
  email: z.email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    ),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export class SignUpDto extends createZodDto(SignUpSchema) {}
```

## Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start in debug mode

# Production
npm run build              # Build the application
npm run start:prod         # Start production server

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run end-to-end tests
npm run test:cov           # Run tests with coverage

# Database
npx prisma generate        # Generate Prisma client
npx prisma migrate dev     # Create and apply migration
npx prisma studio          # Open Prisma Studio

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
```

### Project Structure

```
src/
├── common/                # Shared utilities and filters
│   ├── exceptions/        # Custom exception classes
│   ├── filters/          # Global exception filters
│   ├── interceptors/     # Request/response interceptors
│   ├── services/         # Shared services
│   └── utils/            # Utility functions
├── config/               # Configuration files
├── database/             # Database modules and services
│   ├── mongodb.module.ts # MongoDB configuration
│   ├── prisma.module.ts  # Prisma configuration
│   ├── redis.module.ts   # Redis configuration
│   └── supabase.module.ts # Supabase configuration
├── modules/              # Feature modules
│   ├── auth/            # Authentication module
│   └── health/          # Health check module
└── main.ts              # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run test`
5. Commit your changes: `git commit -m 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## License

This project is licensed under the MIT License.
