import { FEATURES } from "./features";

export const THEME_KEY = "techmart-theme";
const MIGRATED_KEY = "techmart-theme-v2";

export const ALLOWED_THEMES = FEATURES.extraThemes
  ? ["light", "dark", "ocean", "forest", "ember", "purple"]
  : ["light", "dark"];

// The first visit after the redesign resets everyone to light, once.
// After that, a saved choice (including dark) is respected.
export function getInitialTheme() {
  try {
    if (!localStorage.getItem(MIGRATED_KEY)) {
      localStorage.setItem(MIGRATED_KEY, "1");
      localStorage.setItem(THEME_KEY, "light");
      return "light";
    }
    const saved = localStorage.getItem(THEME_KEY);
    return ALLOWED_THEMES.includes(saved) ? saved : "light";
  } catch {
    return "light";
  }
}
