# AGENTS.md

## Development Commands

### Root Directory (Parent Repository)
```bash
# Prisma development (in /root/erp/)
npx prisma dev
npx prisma generate
npx prisma studio
```

### ERP System (in /root/erp/erp-system/)
```bash
# Development
npm run dev

# Production
npm run build
npm run start

# Code Quality
npm run lint

# Note: No test framework currently configured. Tests would need to be added.
```

## Code Style Guidelines

### TypeScript Configuration
- **Target**: ES2017
- **Strict mode**: Enabled
- **Module resolution**: Bundler
- **Path alias**: `@/*` maps to `./src/*`
- **JSX**: react-jsx

### ESLint Configuration
- Uses `eslint-config-next` with:
  - `eslint-config-next/core-web-vitals`
  - `eslint-config-next/typescript`
- Follows Next.js recommended conventions

### Import Style
- Use absolute imports with `@/*` alias
- Example: `import { prisma } from '@/lib/prisma';`
- Import order: External → Relative → Internal
- Use named imports preferred over default imports

### Naming Conventions
- **Variables/functions**: camelCase
- **Components**: PascalCase
- **Types/interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Enums (Prisma)**: PascalCase
- **File names**: kebab-case for utilities, PascalCase for components

### Error Handling
- Always use try-catch blocks in async operations
- Use utility functions `successResponse()` and `errorResponse()`
- Use `handleApiError()` for generic error responses
- Return structured ApiResponse objects from API routes
- Consistent error messages in Chinese

### API Route Patterns
```typescript
// Standard structure:
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Logic here
    return NextResponse.json(successResponse(data));
  } catch (error) {
    return handleApiError(error);
  }
}
```

### React Components
- Add `'use client'` directive for client-side components
- Use React 19 hooks (useState, useEffect, useContext, etc.)
- Define interfaces for props and context types
- Export component and custom hooks with PascalCase
- Use context API for global state management

### Database (Prisma)
- Use `prisma` client from `@/lib/prisma`
- Define models in `prisma/schema.prisma`
- Always use `@id @default(cuid())` for primary keys
- Use `@unique` for unique fields
- Define enums for status fields
- Add indexes for frequently queried fields
- Follow Prisma naming conventions and best practices

### File Structure
```
src/
├── app/              # App Router pages and API routes
│   ├── api/         # API routes (e.g., api/users/[id]/route.ts)
│   └── page.tsx     # Home page
├── components/       # Reusable React components
├── contexts/         # React Context providers
└── lib/             # Utility functions and helpers
    ├── prisma.ts    # Prisma client singleton
    ├── auth.ts      # Authentication utilities
    ├── api-response.ts # API response helpers
    └── permissions.ts # Permission constants
```

### Code Quality Rules
1. **No type suppression**: Never use `as any`, `@ts-ignore`, or `@ts-expect-error`
2. **No empty catch blocks**: Always log or handle caught errors
3. **Consistent error responses**: Always return structured error responses
4. **No premature optimization**: Focus on clean, readable code
5. **Async/await**: Use for all database and API operations
6. **Type safety**: Leverage TypeScript strict mode fully

## Existing Config Files
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint rules
- `postcss.config.mjs` - Tailwind CSS configuration
- `next.config.ts` - Next.js configuration
- `prisma/schema.prisma` - Database schema

## Testing
**No test framework currently implemented.** If adding tests, consider:
- Vitest or Jest for testing framework
- React Testing Library for component testing
- Playwright or Cypress for E2E testing
- Implement test files with naming pattern: `*.test.ts` or `*.test.tsx`

## Additional Notes
- This is a Next.js 16.1.6 app with React 19.2.3
- Uses Tailwind CSS v4
- Database: PostgreSQL with Prisma ORM
- No test suite currently configured
