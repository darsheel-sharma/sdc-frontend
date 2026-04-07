BuildSpace Frontend

This project is a Next.js frontend for BuildSpace.
It includes:

- Email/password login
- Google login
- Home feed with join request modals for projects, hackathons, and jobs
- Profile page with joined and created sections
- Local client-side syncing for created opportunities and join requests

Project structure

app/page.tsx
Login and registration page.

app/home/page.tsx
Home page container.

app/components/newsCard.tsx
Main feed UI. Shows starter posts, created opportunities, and join request modal flow.

app/components/navbar.tsx
Top navigation bar. Fetches current user and handles session fallback.

app/profile/page.tsx
Profile page. Shows backend user data, joined items, created items, and profile editing UI.

app/lib/authResponse.ts
Helpers for parsing backend auth responses and extracting token/user values.

app/lib/joinedItems.ts
Local storage helpers for join requests.

app/lib/createdItems.ts
Local storage helpers for created opportunities.

Environment variables

Create a .env.local file with values like:

NEXT_PUBLIC_API_URL=your_backend_url
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

How to run

1. Install dependencies
   npm install

2. Start the development server
   npm run dev

3. Open the app
   http://localhost:3000

Current behavior

- Login stores token and cached user data in local storage.
- Navbar tries backend user fetch first, then falls back to cached or token-derived user data.
- Join requests from Home are stored in local storage and reflected in My Account.
- Created projects, hackathons, and jobs from My Account are stored in local storage and shown on Home.
- Bio editing is currently local frontend state.

Important note

Some profile, create, and join flows are still client-side only.
They are reflected in the UI immediately, but they are not fully persisted to the backend yet unless the backend already returns those updates from /auth/get-user.

Useful commands

npm run dev
npm run lint
npm run build

Notes for future work

- Connect join requests to backend APIs
- Connect created opportunities to backend APIs
- Persist bio updates to backend
- Replace starter feed data with backend feed data
