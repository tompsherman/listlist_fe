# ListList Frontend

Grocery & Pantry Tracker React App

## Stack

- React 18 + Vite
- React Router 7
- Auth0 (authentication)
- Axios (API client)

## Features

### Grocery Tab
- Search items from catalog
- Add items to list
- Check/uncheck items
- "Add to Pantry" moves checked items
- Create custom items

### Pantry Tab
- Search and add items
- Assign to location (fridge, freezer, pantry, counter)
- Quantity +/- controls
- Expiring soon warnings
- Filter by location

### Meals Tab
- Add dishes
- Tap to log cook (tracks history)
- Delete dishes

### Pod Management
- Click pod name → settings
- View members
- Invite new members (admin only)
- Auto-join on login if invited

## Offline Support

- User profile cached on login
- Lists cached for 5 minutes
- Shows cached data immediately, refreshes in background

## Environment Variables

```
VITE_API_URL=http://localhost:3001
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://listlist.app/api
```

## Development

```bash
npm install
npm run dev
```

## Deploy

Deployed on Vercel at `listless.vercel.app`
Auto-deploys from `main` branch.

## Structure

```
src/
├── components/       # UI components
│   ├── GroceryList.jsx
│   ├── PantryList.jsx
│   ├── MealsList.jsx
│   └── PodSettings.jsx
├── context/          # React context
│   └── UserContext.jsx
├── pages/            # Route pages
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Onboarding.jsx
│   └── NotFound.jsx
├── services/         # API clients
│   ├── api.js
│   ├── lists.js
│   ├── items.js
│   ├── dishes.js
│   ├── pods.js
│   └── history.js
├── styles/           # Global styles
│   └── global.css
└── utils/            # Utilities
    └── cache.js
```
