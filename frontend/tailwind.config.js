/** @type {import('tailwindcss').Config} */

// Semantic design tokens — the single source of truth for colour in the app.
// Use these (bg-primary-600, text-danger-600, …) instead of raw palette
// colours (bg-blue-600) so the theme can change in one place. See
// docs/frontend-standards.md § Theme.
const palette = {
  // Brand / primary actions (buttons, links, focus rings, active nav, selected)
  primary: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
    400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
    800: '#1e40af', 900: '#1e3a8a',
  },
  // Success / positive (paid, completed, active)
  success: {
    50: '#ecfdf5', 100: '#d1fae5', 500: '#10b981', 600: '#059669', 700: '#047857',
  },
  // Warning / attention (pending, due)
  warning: {
    50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
  },
  // Danger / destructive (delete, errors, cancelled)
  danger: {
    50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
  },
  // Info / secondary accent (scheduled, informational badges)
  info: {
    50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
  },
}

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: palette,
    },
  },
  plugins: [],
}
