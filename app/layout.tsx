import '../styles/globals.css'
import Providers from '../components/Providers'
import { Playfair_Display, DM_Sans } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap'
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap'
})

export const metadata = {
  title: {
    default: 'Taem Baltina',
    template: '%s · Taem Baltina'
  },
  description: 'Artisanal Ethiopian spices — shop public pantry blends or run the kitchen ops console.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
