/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-orbitron)', 'monospace'],
        mono: ['var(--font-space-mono)', 'monospace'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#070b14',
          1: '#0c1220',
          2: '#111827',
          3: '#1a2535',
          4: '#243044',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        threat: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#22c55e',
          minimal: '#06b6d4',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 4s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideUp': 'slideUp 0.4s ease-out',
        'blink': 'blink 1.2s step-end infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        },
        flicker: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 }
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 }
        }
      }
    },
  },
  plugins: [],
}
