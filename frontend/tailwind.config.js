/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Estructura / neutros
        surface: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Zonas críticas
        danger: {
          light: '#fecaca',
          DEFAULT: '#dc2626',
          dark:  '#991b1b',
        },
        warning: {
          light: '#fed7aa',
          DEFAULT: '#f97316',
          dark:  '#c2410c',
        },
        // Tendencias / info
        primary: {
          light: '#bfdbfe',
          DEFAULT: '#3b82f6',
          dark:  '#1e40af',
        },
        // Alertas
        alert: {
          DEFAULT: '#fbbf24',
          dark:  '#d97706',
        },
        // Éxito
        success: {
          DEFAULT: '#22c55e',
          dark:  '#15803d',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace'],
      },
      fontSize: {
        'kpi': ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10)',
        'sidebar': '2px 0 8px 0 rgb(0 0 0 / 0.06)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.25rem',
      },
      transitionDuration: {
        '250': '250ms',
      },
      width: {
        'sidebar': '280px',
        'sidebar-collapsed': '80px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};