// Category constants and helpers
// CENTRALIZED - import from here instead of defining locally

export const CATEGORIES = ["vegetable", "herbs", "fruit", "grains", "meat", "dairy", "leftovers", "household", "snack", "drinks"];

// Categories that can be used as meal ingredients (excludes household items)
export const EDIBLE_CATEGORIES = ["vegetable", "herbs", "fruit", "grains", "meat", "dairy", "leftovers", "snack", "drinks"];
export const NON_EDIBLE_CATEGORIES = ["household"];

// Helper to check if an item can be used in meals
export const isEdible = (item) => !NON_EDIBLE_CATEGORIES.includes(item?.category);

// Helper to check if a category is edible
export const isCategoryEdible = (category) => !NON_EDIBLE_CATEGORIES.includes(category);

export const CATEGORY_COLORS = {
  vegetable: "#228B22",
  herbs: "#8B7355",
  fruit: "#9ACD32",
  grains: "#DAA520",
  meat: "#F08080",
  dairy: "#FFFAF0",
  leftovers: "#9370DB",
  household: "#ADD8E6",
  drinks: "#BDB76B",
  snack: "#FF6347",
  other: "#ddd",
};

export const STORAGE_LOCATIONS = ["counter", "pantry", "fridge", "freezer", "closet"];

export const STORAGE_COLORS = {
  counter: "#f5deb3",
  pantry: "#d2b48c",
  fridge: "#add8e6",
  freezer: "#b0e0e6",
  closet: "#dda0dd",
};

// Dish/Meal related constants
export const DISH_TYPE_LABELS = {
  main: "🍽️ Main Dish",
  side: "🥗 Side Dish",
  dessert: "🍰 Dessert",
};

export const MEAL_CATEGORY_LABELS = {
  breakfast: "🌅 Breakfast",
  lunch: "☀️ Lunch",
  dinner: "🌙 Dinner",
  snack: "🍿 Snack",
};

export const STORAGE_OPTIONS = [
  { value: "none", label: "No leftovers" },
  { value: "pint", label: "Pint" },
  { value: "quart", label: "Quart" },
  { value: "half_gallon", label: "Half gallon" },
  { value: "gallon", label: "Gallon" },
];

export const STORAGE_LOCATION_OPTIONS = [
  { value: "fridge", label: "Fridge" },
  { value: "freezer", label: "Freezer" },
  { value: "counter", label: "Counter" },
];

export const DISH_TYPE_OPTIONS = [
  { value: "main", label: "🍽️ Main Dish" },
  { value: "side", label: "🥗 Side Dish" },
  { value: "dessert", label: "🍰 Dessert" },
];

export const MEAL_CATEGORY_OPTIONS = [
  { value: "breakfast", label: "🌅 Breakfast" },
  { value: "lunch", label: "☀️ Lunch" },
  { value: "dinner", label: "🌙 Dinner" },
  { value: "snack", label: "🍿 Snack" },
];

// Expiration time constants (in days)
export const EXPIRATION_DAYS = {
  three_days: 3,
  six_days: 6,
  nine_days: 9,
  eighteen_days: 18,
  "thirty-six_days": 36,
  "seventy-three_days": 73,
  "three-hundred-sixty-five_days": 365,
  never: Infinity,
};

// Convert time_to_expire string to days
export const getExpirationDays = (timeToExpire) => {
  return EXPIRATION_DAYS[timeToExpire] || 9; // Default to 9 days
};

// Calculate "open" tag color based on how far along to expiration
// Returns: "green" (fresh), "yellow" (1/3), "red" (2/3), "black" (expired)
export const getOpenTagColor = (openedDate, timeToExpire) => {
  if (!openedDate) return null;
  
  const expirationDays = getExpirationDays(timeToExpire);
  if (expirationDays === Infinity) return "green"; // Never expires
  
  const opened = new Date(openedDate);
  const now = new Date();
  const daysSinceOpened = Math.floor((now - opened) / (1000 * 60 * 60 * 24));
  
  const progress = daysSinceOpened / expirationDays;
  
  if (progress >= 1) return "black";      // Past expiration
  if (progress >= 2/3) return "red";      // 2/3 to expiration
  if (progress >= 1/3) return "yellow";   // 1/3 to expiration
  return "green";                          // Fresh
};

// Open tag color styles
export const OPEN_TAG_COLORS = {
  green: { border: "#28a745", background: "#d4edda", text: "#28a745" },
  yellow: { border: "#ffc107", background: "#fff3cd", text: "#856404" },
  red: { border: "#dc3545", background: "#f8d7da", text: "#dc3545" },
  black: { border: "#212529", background: "#e9ecef", text: "#212529" },
};
