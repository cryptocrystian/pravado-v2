import type { Config } from 'tailwindcss';

/**
 * Tailwind Configuration for Pravado Design System v3
 * Canonical source: docs/canon/DS_v3_1_EXPRESSION.md
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Font Family
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },

      // Colors - Pravado Design System
      colors: {
        // Slate Neutrals
        slate: {
          0: 'var(--slate-0)',
          1: 'var(--slate-1)',
          2: 'var(--slate-2)',
          3: 'var(--slate-3)',
          4: 'var(--slate-4)',
          5: 'var(--slate-5)',
          6: 'var(--slate-6)',
        },
        'white-0': 'var(--white-0)',

        // Page/Panel Semantic
        page: 'var(--page-bg)',
        panel: 'var(--panel-bg)',
        text: 'var(--text)',

        // Brand Accents
        brand: {
          iris: 'var(--brand-iris)',
          cyan: 'var(--brand-cyan)',
          teal: 'var(--brand-teal)',
          magenta: 'var(--brand-magenta)',
          amber: 'var(--brand-amber)',
        },

        // Semantic Colors
        semantic: {
          info: 'var(--semantic-info)',
          success: 'var(--semantic-success)',
          warning: 'var(--semantic-warning)',
          danger: 'var(--semantic-danger)',
        },

        // Border
        'border-subtle': 'var(--border-subtle)',

        // Legacy shadcn/ui compatibility
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      // Border Radius - Pravado Design System
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        '2xl': 'var(--radius-2xl)',
        DEFAULT: 'var(--radius)',
      },

      // Box Shadow - Pravado Design System
      boxShadow: {
        'elev-0': 'var(--elev-0)',
        'elev-1': 'var(--elev-1)',
        'elev-2': 'var(--elev-2)',
        'elev-3': 'var(--elev-3)',
        panel: 'var(--shadow-panel)',
      },

      // Transition Timing - Pravado Design System
      transitionTimingFunction: {
        standard: 'var(--motion-ease-standard)',
        emphatic: 'var(--motion-ease-emphatic)',
      },

      // Transition Duration - Pravado Design System
      transitionDuration: {
        xs: 'var(--motion-duration-xs)',
        sm: 'var(--motion-duration-sm)',
        md: 'var(--motion-duration-md)',
        lg: 'var(--motion-duration-lg)',
      },

      // Z-Index Scale
      zIndex: {
        base: 'var(--z-base)',
        nav: 'var(--z-nav)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        toast: 'var(--z-toast)',
      },

      // Keyframes for animations
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'ai-pulse': {
          '0%, 100%': { opacity: '0.8', transform: 'scale(0.98)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },

      // Animation presets
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'ai-pulse': 'ai-pulse 1400ms ease-in-out infinite',
        shimmer: 'shimmer 1600ms infinite',
      },

      // Background Image (for gradients)
      backgroundImage: {
        'grad-hero': 'var(--grad-hero)',
        'grad-warm': 'var(--grad-warm)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
