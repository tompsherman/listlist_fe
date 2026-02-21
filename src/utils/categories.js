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

// Convert word-number to numeral (e.g., "thirty-six" → 36)
const wordToNumber = {
  three: 3,
  six: 6,
  nine: 9,
  eighteen: 18,
  "thirty-six": 36,
  "seventy-three": 73,
  "three-hundred-sixty-five": 365,
};

// Format time_to_expire for display
// If not open: "18 days (after opening)"
// If open: "in X days; Feb 24"
export const formatExpiration = (timeToExpire, openedDate = null) => {
  if (!timeToExpire || timeToExpire === "never") {
    return "never expires";
  }
  
  // Parse the format: "eighteen_days" → ["eighteen", "days"]
  const parts = timeToExpire.split("_");
  if (parts.length !== 2 || parts[1] !== "days") {
    return timeToExpire; // fallback to raw value
  }
  
  const wordNum = parts[0];
  const days = wordToNumber[wordNum] || EXPIRATION_DAYS[timeToExpire] || 0;
  
  if (!openedDate) {
    // Not open - show base expiration
    return `${days} days (after opening)`;
  }
  
  // Item is open - calculate countdown
  const opened = new Date(openedDate);
  const now = new Date();
  const daysSinceOpened = Math.floor((now - opened) / (1000 * 60 * 60 * 24));
  const daysLeft = days - daysSinceOpened;
  
  // Calculate expiration date
  const expirationDate = new Date(opened);
  expirationDate.setDate(expirationDate.getDate() + days);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const expDateStr = `${months[expirationDate.getMonth()]} ${expirationDate.getDate()}`;
  
  if (daysLeft < 0) {
    return `expired ${Math.abs(daysLeft)} days ago`;
  } else if (daysLeft === 0) {
    return `expires today; ${expDateStr}`;
  } else if (daysLeft === 1) {
    return `in 1 day; ${expDateStr}`;
  } else {
    return `in ${daysLeft} days; ${expDateStr}`;
  }
};

// Expiration options for dropdown
export const EXPIRATION_OPTIONS = [
  { value: "three_days", label: "3 days" },
  { value: "six_days", label: "6 days" },
  { value: "nine_days", label: "9 days (1 week)" },
  { value: "eighteen_days", label: "18 days (2 weeks)" },
  { value: "thirty-six_days", label: "36 days (1 month)" },
  { value: "seventy-three_days", label: "73 days (1 season)" },
  { value: "three-hundred-sixty-five_days", label: "365 days (1 year)" },
  { value: "never", label: "Never expires" },
];
