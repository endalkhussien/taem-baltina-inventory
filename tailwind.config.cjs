module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        spice: {
          50: '#fff8f6',
          100: '#fff1ec',
          200: '#ffe9e2',
          300: '#ffdbcd',
          400: '#ffb595',
          500: '#c64f00',
          600: '#9e3d00',
          700: '#7c2e00',
          800: '#5c2200',
          900: '#351000',
          950: '#2a170f'
        },
        earth: {
          50: '#fff8f6',
          100: '#fff1ec',
          200: '#ffe2d8',
          300: '#e0c0b2',
          400: '#8c7166',
          500: '#594238',
          600: '#422b22',
          700: '#2a170f',
          800: '#2a170f',
          900: '#2a170f',
          950: '#2a170f'
        },
        surface: {
          DEFAULT: '#fff8f6',
          dim: '#f8d2c4',
          bright: '#fff8f6',
          lowest: '#ffffff',
          low: '#fff1ec',
          container: '#ffe9e2',
          high: '#ffe2d8',
          highest: '#ffdbce'
        },
        primary: {
          DEFAULT: '#9e3d00',
          container: '#c64f00'
        },
        secondary: {
          DEFAULT: '#944925',
          container: '#fe9e72'
        },
        tertiary: {
          DEFAULT: '#41661a',
          container: '#587f31'
        },
        outline: {
          DEFAULT: '#8c7166',
          variant: '#e0c0b2'
        }
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'spice-gradient': 'linear-gradient(135deg, #2a170f 0%, #7c2e00 45%, #c64f00 100%)',
        'spice-radial': 'radial-gradient(ellipse at top left, rgba(198,79,0,0.22) 0%, transparent 50%)'
      },
      boxShadow: {
        spice: '0 4px 12px rgba(42, 23, 15, 0.05)',
        'spice-lg': '0 8px 24px rgba(42, 23, 15, 0.08)',
        card: '0 4px 12px rgba(42, 23, 15, 0.05)'
      },
      spacing: {
        sidebar: '260px',
        gutter: '24px'
      }
    }
  },
  plugins: []
}
