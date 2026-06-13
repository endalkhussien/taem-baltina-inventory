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
          50: '#fdf8f3',
          100: '#f9ede0',
          200: '#f2d5b5',
          300: '#e8b87a',
          400: '#de9447',
          500: '#d4782a',
          600: '#c05e20',
          700: '#a0471c',
          800: '#83391e',
          900: '#6b301b',
          950: '#3a160c'
        },
        earth: {
          50: '#f6f3ef',
          100: '#e9e2d8',
          200: '#d4c5b0',
          300: '#b9a283',
          400: '#a38665',
          500: '#937456',
          600: '#7d5f48',
          700: '#654a3b',
          800: '#553f35',
          900: '#4a372f',
          950: '#281c18'
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'spice-gradient': 'linear-gradient(135deg, #3a160c 0%, #6b301b 40%, #c05e20 100%)',
        'spice-radial': 'radial-gradient(ellipse at top left, rgba(222,148,71,0.25) 0%, transparent 50%)'
      },
      boxShadow: {
        spice: '0 4px 24px rgba(192, 94, 32, 0.15)',
        'spice-lg': '0 8px 40px rgba(192, 94, 32, 0.2)'
      }
    }
  },
  plugins: []
}
