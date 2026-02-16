# Frontend Performance Audit Report

**Date:** 2026-02-16  
**Bundle Status:** Unoptimized  
**Primary Issues:** Duplicate code, missing code-splitting, over-fetching

---

## 🔴 HIGH PRIORITY (High Impact)

### 1. Duplicate Constants Across 6+ Files
**Impact:** HIGH (bundle size, maintenance) | **Effort:** LOW

`CATEGORY_COLORS` is defined identically in **6 files**, despite a centralized version in `utils/categories.js`:

```
src/components/MealsList.jsx:4
src/components/SubstituteSelector.jsx:4
src/components/DupeAdd.jsx:7
src/components/PantrySearch.jsx:4
src/components/CookDish.jsx:6
src/components/list-types/PantryList.jsx:14
```

`STORAGE_LOCATIONS` is duplicated in **4 files**:
```
src/components/MealsList.jsx
src/components/list-types/PantryList.jsx
src/components/List.jsx
src/utils/categories.js
```

**Fix:**
```javascript
// In all components, replace local definitions with:
import { CATEGORY_COLORS, STORAGE_LOCATIONS } from '../utils/categories';
```

**Savings:** ~2KB from bundle, better maintainability

---

### 2. AddItem.jsx Over-Fetches Items Database
**Impact:** HIGH (API calls, performance) | **Effort:** MEDIUM

```javascript
// Current - fetches ALL items on EVERY state change:
useEffect(() => {
  axios.get(`https://listlist-db.onrender.com/api/items/`)
    .then(response => setItemDatabase(response.data))
}, [formToggle.fuse_to_list, searchTerm]);  // ❌ Triggers on every keystroke!
```

**Fix:**
```javascript
// Fetch once on mount, not on every state change:
useEffect(() => {
  axios.get(`https://listlist-db.onrender.com/api/items/`)
    .then(response => setItemDatabase(response.data))
}, []);  // Empty deps - fetch once
```

---

### 3. No Code Splitting / Lazy Loading
**Impact:** HIGH (initial load) | **Effort:** MEDIUM

All routes load upfront in App.js:
```javascript
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import MealsList from "./components/MealsList";
```

**Fix:**
```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const MealsList = lazy(() => import('./components/MealsList'));

// In Routes:
<Suspense fallback={<div>Loading...</div>}>
  <Routes>
    <Route path="/" element={<Dashboard getList="grocery" />} />
    {/* etc */}
  </Routes>
</Suspense>
```

**Savings:** 30-50% reduction in initial bundle

---

### 4. Testing Libraries in Production Dependencies
**Impact:** MEDIUM (bundle size) | **Effort:** LOW

These should be in `devDependencies`:
```json
"@testing-library/jest-dom": "^5.16.3",
"@testing-library/react": "^16.3.0", 
"@testing-library/user-event": "^13.5.0"
```

**Fix:**
```bash
npm uninstall @testing-library/jest-dom @testing-library/react @testing-library/user-event
npm install -D @testing-library/jest-dom @testing-library/react @testing-library/user-event
```

**Note:** CRA may include these regardless, but keeping them in devDeps is correct practice.

---

### 5. Duplicate LoginButton Files
**Impact:** LOW (bundle) / HIGH (confusion) | **Effort:** LOW

Two files exist with slightly different implementations:
- `LoginButton.js` (21 lines) - has returnTo logic
- `LoginButton.jsx` (12 lines) - simpler version

**Fix:** Delete `LoginButton.jsx`, keep `LoginButton.js` (rename to .jsx for consistency)

---

## 🟡 MEDIUM PRIORITY

### 6. Unused/Oversized Assets
**Impact:** MEDIUM | **Effort:** LOW

```
public/listlogo.png     - 95KB (oversized)
public/listlogo copy.png - 10KB (unused duplicate)
public/listlistlogo.png - 11KB (possibly redundant with SVG)
public/listlistlogo.svg - 3KB (use this instead)
```

**Fix:**
1. Delete `listlogo copy.png`
2. Use SVG version where possible
3. Compress PNG through TinyPNG or similar (can reduce 95KB → 20KB)

---

### 7. Multiple Components Fetch Items Independently
**Impact:** MEDIUM | **Effort:** MEDIUM

Same `/api/items` endpoint called in:
- `AddItem.jsx`
- `SubstituteSelector.jsx`
- `CookDish.jsx`

**Fix:** Create an items context/provider or use React Query:
```javascript
// src/context/ItemsContext.js
const ItemsProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    axios.get('https://listlist-db.onrender.com/api/items/')
      .then(res => setItems(res.data));
  }, []);
  
  return (
    <ItemsContext.Provider value={{ items, refetch }}>
      {children}
    </ItemsContext.Provider>
  );
};
```

---

### 8. Missing Memoization
**Impact:** MEDIUM (re-renders) | **Effort:** MEDIUM

**Current:** 19 useEffect hooks, only 7 useMemo/useCallback

Components that should use React.memo:
- `DupeAdd` - renders in lists
- `CreatableSelect` - reusable component
- List item rows in `PantryList`, `MealsList`

**Example fix:**
```javascript
// Wrap list items:
const DishCard = React.memo(({ dish, onEdit, onDelete }) => {
  // ...
});

// Memoize callbacks passed to children:
const handleEdit = useCallback((dish) => {
  setEditingDish(dish._id);
}, []);
```

---

### 9. Console.log Statements in Production
**Impact:** LOW (performance) / MEDIUM (security) | **Effort:** LOW

Multiple files have debug logging:
- `AddItem.jsx` - 4+ console.log
- `Dashboard.jsx` - 3+ console.log
- `App.js` - debug logging

**Fix:** Use environment check or remove:
```javascript
if (process.env.NODE_ENV === 'development') {
  console.log('debug info');
}
```

Or use a proper logging utility that strips in production.

---

### 10. Large Single-File Components
**Impact:** MEDIUM (maintainability, code-splitting) | **Effort:** HIGH

| Component | Lines | Recommendation |
|-----------|-------|----------------|
| AddItem.jsx | 803 | Split into form steps |
| PantryList.jsx | 611 | Extract item card, modals |
| CookDish.jsx | 585 | Extract ingredient selector |
| MealsList.jsx | 463 | Extract dish card |

**Example split for AddItem:**
```
components/
  AddItem/
    index.jsx         (main orchestrator)
    NameStep.jsx
    CategoryStep.jsx
    StorageStep.jsx
    CostStep.jsx
    ...
```

---

## 🟢 LOW PRIORITY

### 11. Centralize Shared Constants
**Impact:** LOW | **Effort:** LOW

Add to `utils/categories.js`:
```javascript
export const STORAGE_OPTIONS = [
  { value: "none", label: "No leftovers" },
  { value: "pint", label: "Pint" },
  // ...
];

export const DISH_TYPE_OPTIONS = [
  { value: "main", label: "🍽️ Main Dish" },
  // ...
];

export const MEAL_CATEGORY_OPTIONS = [
  { value: "breakfast", label: "🌅 Breakfast" },
  // ...
];
```

---

### 12. Update to React 18 createRoot API
**Impact:** LOW | **Effort:** LOW

```javascript
// Current (deprecated):
ReactDOM.render(<App />, document.getElementById("root"));

// React 18:
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

---

### 13. useOptions Hook Fetches on Every Mount
**Impact:** LOW | **Effort:** MEDIUM

Each component using `useOptions()` triggers a fresh API call. Consider:
- Caching in localStorage
- Using a context provider
- Adding stale-while-revalidate pattern

---

### 14. App.css is 2752 Lines
**Impact:** LOW | **Effort:** MEDIUM

Consider splitting into:
- `base.css` (resets, typography)
- `components.css` (component styles)
- `pages.css` (page-specific)

Or migrate to CSS modules / styled-components for automatic code-splitting.

---

## 📊 Summary

| Fix | Impact | Effort | Category |
|-----|--------|--------|----------|
| Centralize CATEGORY_COLORS | HIGH | LOW | Bundle |
| Fix AddItem over-fetching | HIGH | MEDIUM | API |
| Add lazy loading/code-split | HIGH | MEDIUM | Load time |
| Move test deps to devDeps | MEDIUM | LOW | Bundle |
| Delete duplicate LoginButton | LOW | LOW | Cleanup |
| Optimize/remove images | MEDIUM | LOW | Assets |
| Items context provider | MEDIUM | MEDIUM | API |
| Add React.memo | MEDIUM | MEDIUM | Renders |
| Remove console.logs | MEDIUM | LOW | Cleanup |
| Split large components | MEDIUM | HIGH | Maintainability |

---

## 🚀 Quick Wins (Do First)

```bash
# 1. Delete duplicate files
rm src/components/LoginButton.jsx
rm public/listlogo\ copy.png

# 2. Move test deps (optional - CRA bundles separately)
npm uninstall @testing-library/jest-dom @testing-library/react @testing-library/user-event
npm install -D @testing-library/jest-dom @testing-library/react @testing-library/user-event
```

Then apply the code fixes for:
1. Centralize constants (import from utils/categories)
2. Fix AddItem useEffect dependencies
3. Add lazy() imports for routes

---

## Estimated Impact

| Metric | Current (Est.) | After Optimizations |
|--------|----------------|---------------------|
| Initial Bundle | ~500KB | ~300KB (-40%) |
| Items API calls/session | 5-10 | 1-2 (-80%) |
| Time to Interactive | ~3s | ~2s (-33%) |
