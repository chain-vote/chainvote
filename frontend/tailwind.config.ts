import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#030712',
        ember: '#FF4500',
        gold: '#FFB300',
        ash: '#6B7280',
        white: '#F9FAFB',
        chaingreen: '#10B981',
        breach: '#EF4444',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        ember: '0 0 20px rgba(255, 69, 0, 0.4)',
        gold: '0 0 20px rgba(255, 179, 0, 0.4)',
        green: '0 0 20px rgba(16, 185, 129, 0.4)',
      },
    },
  },
  plugins: [],
} satisfies Config

