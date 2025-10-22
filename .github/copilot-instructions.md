# Copilot Instructions for Mentor Booking Application

## Overview
This project is a Mentor Booking Application built using modern web technologies including Vite, TypeScript, React, Shadcn UI, and Tailwind CSS. The application is structured to support modular development with a focus on scalability and maintainability.

## Key Directories and Files
- **`src/pages/`**: Defines the main pages of the application, such as `Calendar.tsx`, `Events.tsx`, and `Profile.tsx`. Each page is a top-level component for a specific route.
- **`src/components/`**: Contains reusable UI components. Subdirectories like `admin/`, `auth/`, and `calendar/` organize components by feature. For example, `admin/GroupCard.tsx` is a component used in the admin section.
- **`src/hooks/`**: Custom React hooks for shared logic. For example, `useCalendarEvents.ts` fetches and manages calendar data, while `useMentorGroupsAndMentors.ts` handles state for mentor groups.
- **`src/services/`**: Handles API interactions. For instance, `mentorGroupService.ts` contains functions for fetching and updating mentor group data. This abstracts away the direct API calls from the components.
- **`src/contexts/`**: Context providers for global state management, such as `AuthContext.tsx` for user authentication state.
- **`src/lib/`**: Contains client configurations for external services. `supabase.ts` configures the Supabase client, and `seatableClient.ts` sets up the Seatable API client.

## Developer Workflows
### Setup
1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Build for production: `npm run build`

### Testing
- Test files are located alongside the components or utilities they test.
- Use `npm test` to run all tests (Note: test runner setup may be required).

### Debugging
- Use the browser's developer tools for debugging React components and network requests.
- The `debug/` directory contains utilities that can be used for debugging purposes.

## Project-Specific Conventions
- **Component Structure**: Components are organized by feature in `src/components/`. For example, `admin/` contains components like `GroupCard.tsx` and `MentorSearch.tsx`.
- **Styling**: Tailwind CSS is used for styling, following a utility-first approach. Component-specific styles are co-located with the component.
- **API Integration**: Use service files in `src/services/` for all API calls. This keeps components clean and separates data fetching logic.
- **State Management**: For global state, use React Context (e.g., `AuthContext`). For local or feature-specific state, create custom hooks (e.g., `useEventFilters.ts`).
- **External Dependencies**:
  - **Supabase**: Used for authentication and database interactions. Configured in `src/lib/supabase.ts`.
  - **Seatable**: Used for mentor data management. Configured in `src/lib/seatableClient.ts`.

## Examples
### Adding a New Page
1. Create a new file in `src/pages/`, e.g., `NewPage.tsx`.
2. Define the page component and export it.
3. Add a route for the new page in the main router configuration file (likely in `src/App.tsx` or a dedicated routing file).

### Creating a New Hook
1. Add a new file in `src/hooks/`, e.g., `useNewFeature.ts`.
2. Implement the hook logic, including any state management or side effects.
3. Export the hook and use it in the relevant components.

## Notes
- Follow the existing folder structure and naming conventions.
- Document any new components, hooks, or utilities in the codebase.
- Ensure that any new feature follows the established patterns for state management and API integration.
