# Copilot Instructions for Mentor Booking Application

## Overview
This project is a Mentor Booking Application built using modern web technologies including Vite, TypeScript, React, Shadcn UI, and Tailwind CSS. The application is structured to support modular development with a focus on scalability and maintainability.

## Key Directories and Files
- **`src/pages/`**: Defines the main pages of the application, such as `Calendar.tsx`, `Events.tsx`, `Profile.tsx`, and `PageBuilder.tsx`. Each page is a top-level component for a specific route.
- **`src/components/`**: Contains reusable UI components. Subdirectories like `admin/`, `auth/`, `calendar/`, and `pagebuilder/` organize components by feature. For example, `admin/GroupCard.tsx` is a component used in the admin section, while `pagebuilder/ContentBlockEditor.tsx` handles flexible content editing.
- **`src/components/pagebuilder/`**: Page builder components for creating rich product pages:
  - `PageBuilderForm.tsx`: Main container with sticky footer submit button
  - `HeroForm.tsx`, `CtaForm.tsx`, `FaqForm.tsx`, `CardsForm.tsx`, `FeaturesForm.tsx`: Section-specific forms
  - `ContentBlockEditor.tsx`: Renders different content block types with integrated ImageUploader
  - `ImageUploader.tsx`: Media library with tabs for browsing existing media and uploading new files
  - `AddContentBlock.tsx`: Content block type selector
- **`src/hooks/`**: Custom React hooks for shared logic. For example, `useCalendarEvents.ts` fetches and manages calendar data, while `useMentorGroupsAndMentors.ts` handles state for mentor groups.
- **`src/services/`**: Handles API interactions. For instance, `mentorGroupService.ts` contains functions for fetching and updating mentor group data, and `productPageService.ts` manages product page content in Supabase.
- **`src/contexts/`**: Context providers for global state management, such as `AuthContext.tsx` for user authentication state.
- **`src/lib/`**: Contains client configurations for external services. `supabase.ts` configures the Supabase client, `seatableClient.ts` sets up the Seatable API client, and `fileUploadClient.ts` handles file uploads to Supabase storage.
- **`src/types/`**: TypeScript type definitions. `pagebuilder.ts` defines the content block system used for flexible page content (TextBlock, ImageBlock, QuoteBlock, ListBlock, VideoBlock).

## Architecture Patterns

### Content Block System
The application uses a flexible content block system for product pages:
- **Content Blocks**: Union type of `TextBlock | ImageBlock | QuoteBlock | ListBlock | VideoBlock`
- Each block has a unique `id` and `type` field
- Blocks support different content types with type-specific properties (e.g., `format` for text, `src` and `alt` for images)
- Used in FAQ answers, hero descriptions, and feature descriptions for rich content editing
- Block IDs are generated using: `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

### Media Management
- **Supabase Storage**: Media files stored in `booking_media` bucket under `product-images/` folder
- **ImageUploader Component**: Two-tab interface:
  1. "Medien": Browse existing media from Supabase bucket in a grid layout
  2. "Vom Computer hochladen": Drag-and-drop file upload with react-dropzone
- **File Upload**: Uses `fileUploadClient.ts` (separate Supabase client without Content-Type header)
- **Integration**: ImageUploader embedded in HeroForm and ContentBlockEditor for image blocks

### Database Schema
- **`mentorbooking_products`**: Core product data (name, description, pricing, mentor requirements)
- **`products`**: Product page content (slug, name, status, jsonb content field with page builder data)
- **`product_slugs`**: URL slug management with primary slug tracking
- Products link to product pages via `product_page_id` foreign key

### Form Architecture
- **React Hook Form**: All forms use `react-hook-form` with Zod schema validation
- **Field Arrays**: Dynamic lists (FAQs, cards, features, content blocks) managed with `useFieldArray`
- **Nested Arrays**: Content blocks are nested within parent field arrays for complex structures
- **Validation**: Zod schemas define content block structure with discriminated unions

### UI Design Patterns
All page builder forms follow consistent modern design:
- **Card Wrappers**: Each section wrapped in shadcn Card with header and description
- **Accordion Components**: Collapsible items for FAQs, cards, features with default expansion states
- **Badge Labels**: Content block types displayed with Badge components
- **Separator Lines**: Visual breaks between form sections
- **Icons**: Emojis for section headers (🦸, 📢, ❓, 📇, ⭐), Lucide icons for actions
- **Sticky Footer**: Submit button fixed at bottom with product name display and loading state
- **German Language**: All labels, buttons, placeholders in German

## Developer Workflows

### Setup
1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Build for production: `npm run build`

### Adding New Content Block Types
1. Define the block interface in `src/types/pagebuilder.ts` extending `BaseBlock`
2. Add to `ContentBlock` union type
3. Update `ContentBlockSchema` in the relevant form component
4. Add rendering logic in `ContentBlockEditor.tsx`
5. Add creation option in `AddContentBlock.tsx`
6. Generate unique IDs using: `${prefix}-${timestamp}-${random}`

### Working with Image Uploads
1. Use `ImageUploader` component for all image inputs in page builder
2. Component automatically handles:
   - Browsing existing media from Supabase
   - Uploading new files with drag-and-drop
   - Returning public URLs for form fields
3. Files uploaded to: `booking_media/product-images/`
4. Use `fileUploadClient` for custom upload logic (not standard supabase client)

### Testing
- Test files are located alongside the components or utilities they test.
- Use `npm test` to run all tests (Note: test runner setup may be required).

### Debugging
- Use the browser's developer tools for debugging React components and network requests.
- The `debug/` directory contains utilities that can be used for debugging purposes.

## Project-Specific Conventions

### Component Structure
- Components are organized by feature in `src/components/`
- Page builder components use consistent naming: `[Section]Form.tsx`
- All forms receive `form` object from parent via props
- Helper components (ContentBlockEditor, AddContentBlock) are reusable across sections

### Styling
- Tailwind CSS utility-first approach
- Shadcn UI components for consistent design system
- Custom classes: `bg-muted/30` for subtle backgrounds, `space-y-*` for vertical spacing
- Responsive design with grid layouts: `grid grid-cols-2 gap-4`

### API Integration
- Use service files in `src/services/` for all API calls
- Supabase client for database operations
- File upload client for storage operations (separate config)
- Toast notifications for user feedback (sonner library)

### State Management
- Global state: React Context (e.g., `AuthContext`)
- Feature-specific state: Custom hooks (e.g., `useEventFilters.ts`)
- Form state: React Hook Form with Zod validation
- Field arrays: `useFieldArray` for dynamic lists

### External Dependencies
- **Supabase**: Authentication, database (PostgreSQL), storage
- **Seatable**: Mentor data management
- **react-dropzone**: File upload with drag-and-drop
- **sonner**: Toast notifications
- **lucide-react**: Icon library
- **@radix-ui**: Headless UI primitives (via shadcn)

## Page Builder Feature

### Workflow
1. Navigate from product edit form via "Produktseite erstellen" button
2. Edit sections in order: Hero → CTA → Cards → Features → FAQ → General Settings
3. Each section supports content blocks for flexible content
4. Use ImageUploader for hero image and image blocks
5. Submit saves to `products` table as JSONB, linked to `mentorbooking_products`
6. Slug auto-generates from product name (URL-friendly)

### Content Block Usage
- **Text Blocks**: Paragraphs, headings (H1-H3), bold, italic
- **Image Blocks**: Upload via ImageUploader, alt text, caption, dimensions
- **Quote Blocks**: Quotation text, author, source
- **List Blocks**: Ordered/unordered lists, items as array
- **Video Blocks**: YouTube/Vimeo embeds, provider selection, caption

### Form Sections
1. **Hero**: Title, image (ImageUploader), stats (label + value pairs), description blocks
2. **CTA**: Title, description blocks, primary button text
3. **Cards**: Multiple cards with title, icon (Lucide name), color, description blocks, list items
4. **Features**: Multiple features with title, description blocks, reverse layout toggle
5. **FAQ**: Multiple questions with content block answers
6. **General Settings**: Subtitle, trainer-module checkbox

## Examples

### Adding a New Page
1. Create a new file in `src/pages/`, e.g., `NewPage.tsx`
2. Define the page component and export it
3. Add a route in `src/App.tsx` with ProtectedRoute if needed

### Creating a New Hook
1. Add a new file in `src/hooks/`, e.g., `useNewFeature.ts`
2. Implement the hook logic, including state management or side effects
3. Export the hook and use it in relevant components

### Adding a Form Section to Page Builder
1. Create `[Section]Form.tsx` in `src/components/pagebuilder/`
2. Import Card, Label, Input, Button from shadcn
3. Use `useFieldArray` for dynamic lists
4. Add emoji icon to CardTitle (e.g., 🎯)
5. Use Separator between subsections
6. Import and render in `PageBuilderForm.tsx`

## Notes
- Follow the existing folder structure and naming conventions
- Document any new components, hooks, or utilities in the codebase
- Ensure new features follow established patterns for state management and API integration
- When working with content blocks, always generate unique IDs
- Use German language for all user-facing text in page builder
- Test ImageUploader integration when adding new image fields
- Maintain consistent Card-based layout for all form sections
