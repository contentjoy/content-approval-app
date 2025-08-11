/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Geist-style design system colors
        bg: 'var(--bg)',
        'bg-elev-1': 'var(--bg-elev-1)',
        text: 'var(--text)',
        'muted-text': 'var(--muted-text)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        accent: 'var(--accent)',
        'accent-strong': 'var(--accent-strong)',
        'accent-soft': 'var(--accent-soft)',
        
        // Legacy compatibility - map to new system
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        'ring-offset': 'var(--ring-offset)',
        
        // Legacy colors for compatibility
        navbar: 'var(--navbar)',
        sidebar: 'var(--sidebar)',
        'text-secondary': 'var(--text-secondary)',
        'card-bg': 'var(--card-bg)',
        'card-border': 'var(--card-border)',
        'pill-bg': 'var(--pill-bg)',
        'pill-border': 'var(--pill-border)',
        'brand-primary': 'var(--brand-primary)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      fontSize: {
        'xs': 'var(--fs-xs)',
        'sm': 'var(--fs-sm)', 
        'base': 'var(--fs-base)', 
        'lg': 'var(--fs-lg)',
        'xl': 'var(--fs-xl)', 
        '2xl': 'var(--fs-2xl)', 
        '3xl': 'var(--fs-3xl)', 
        '4xl': 'var(--fs-4xl)', 
        '5xl': 'var(--fs-5xl)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        md: 'var(--radius)',
        lg: 'calc(var(--radius) + 2px)',
        xl: '0.75rem',
        '2xl': '1rem',
        full: 'var(--radius-pill)'
      },
      boxShadow: {
        'md': 'var(--shadow-1)',
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
        'large': '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
        'glow': '0 0 20px 0 rgba(59, 130, 246, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    }
  },
  plugins: [],
};