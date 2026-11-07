import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './styles/**/*.{js,ts,jsx,tsx,css}',
  ],
  theme: {
    extend: {
      colors: {
        // Paper Brutalist Design Tokens (DESIGN_SYSTEM v2)
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        rule: 'var(--rule)',
        accent: {
          DEFAULT: 'var(--accent)',
          ink: 'var(--accent-ink)',
        },
        focus: 'var(--focus)',
        'focus-on-dark': 'var(--focus-on-dark)',

        // Severity fills
        severity: {
          blocker: 'var(--severity-blocker)',
          major: 'var(--severity-major)',
          minor: 'var(--severity-minor)',
          info: 'var(--severity-info)',
          approved: 'var(--severity-approved)',
        },

        // Status fills
        status: {
          draft: 'var(--status-draft)',
          checked: 'var(--status-checked)',
          in_review: 'var(--status-in-review)',
          changes_requested: 'var(--status-changes-requested)',
          approved: 'var(--status-approved)',
          rejected: 'var(--status-rejected)',
        },

        // Compatibility aliases for existing UI code
        background: 'var(--paper)',
        foreground: 'var(--ink)',
        card: {
          DEFAULT: 'var(--surface)',
          foreground: 'var(--ink)',
        },
        primary: {
          DEFAULT: 'var(--ink)',
          foreground: 'var(--paper)',
        },
        secondary: {
          DEFAULT: 'var(--surface-2)',
          foreground: 'var(--ink)',
        },
        muted: {
          DEFAULT: 'var(--surface-2)',
          foreground: 'var(--ink-2)',
        },
        'muted-foreground': 'var(--ink-2)',
        border: 'var(--ink)',
        destructive: {
          DEFAULT: 'var(--severity-blocker)',
          foreground: 'var(--ink)',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      boxShadow: {
        'hard-sm': '2px 2px 0 var(--ink)',
        hard: '4px 4px 0 var(--ink)',
        'hard-hover': '6px 6px 0 var(--ink)',
        'hard-lg': '8px 8px 0 var(--ink)',
      },
      borderRadius: {
        none: '0px',
      },
    },
  },
  plugins: [],
};

export default config;
