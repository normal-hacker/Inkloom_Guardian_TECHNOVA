import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        border: 'var(--border)',
        'muted-foreground': 'var(--muted-foreground)',
        'color-primary': 'var(--color-primary)',
        'color-secondary': 'var(--color-secondary)',
        'color-accent': 'var(--color-accent)',
        'color-destructive': 'var(--color-destructive)',
        'color-chart-1': 'var(--color-chart-1)',
        'color-chart-2': 'var(--color-chart-2)',
        'color-chart-3': 'var(--color-chart-3)',
        'color-chart-4': 'var(--color-chart-4)',
        'color-chart-5': 'var(--color-chart-5)',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;

