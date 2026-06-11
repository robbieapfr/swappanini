import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        forest: {
          DEFAULT: '#1B3B1A',
          light: '#2A5828',
          dark: '#122710',
        },
        lime: {
          DEFAULT: '#AAFF00',
          dark: '#88CC00',
          light: '#CCFF55',
        },
        // Semantic
        surface: '#F4F6F8',
        border: 'rgba(0,0,0,0.08)',
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'sans-serif'],
        display: ['var(--font-fredoka)', 'cursive'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
}

export default config
