## Progress Tracker

This file tracks the progress of the development of the m-manager application based on user requests.

### Completed Tasks

- **Schedule Management Feature**
  - Created a new database schema for schedules (`supabase/schedule_schema.sql`).
  - Created a calendar page (`/calendar`) to view schedules.
  - Implemented a basic calendar view using `react-big-calendar`.
  - Added a page for bulk holiday registration (`/holidays`).
- **Dashboard Update**
  - The dashboard now fetches and displays today's schedules.
- **Navigation**
  - Added links to the new calendar and holiday pages in the main navigation.
- **Refined Holiday Registration and Calendar Display**
  - Implemented a new holiday registration component that allows selecting multiple dates.
  - The holiday registration page now fetches and displays already registered holidays.
  - The functionality has been updated to replace all existing holidays with the new selection.
  - Holidays are now displayed in a different color on the calendar.
- **UI Formatting**
  - The month caption format in both the main calendar and the holiday selection calendar is now `YYYY年MM月`.

### Current Task

- (None)

### Next Steps

- (None)