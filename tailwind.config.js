/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // CSS variable-based colors for theming
        background: 'var(--background)',
        navbar: 'var(--navbar)',
        sidebar: 'var(--sidebar)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        'card-bg': 'var(--card-bg)',
        'card-border': 'var(--card-border)',
        'pill-bg': 'var(--pill-bg)',
        'pill-border': 'var(--pill-border)',
        primary: 'var(--primary)',
        // Legacy colors for compatibility
        'brand-primary': 'var(--brand-primary)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    }
  },
  plugins: [],
};