import '../styles/globals.css'
import Providers from '../components/Providers'
import { Noto_Sans_Ethiopic, Playfair_Display, DM_Sans } from 'next/font/google'

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

const notoEthiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  variable: '--font-ethiopic',
  display: 'swap',
  weight: ['400', '700']
})

export const metadata = {
  title: {
    default: 'Taem Baltina',
    template: '%s · Taem Baltina'
  },
  description: 'ጣዕም ባልቲና — Ethiopian spice marketplace. Order berbere, shiro and mitmita in ETB.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="am" className={`${playfair.variable} ${dmSans.variable} ${notoEthiopic.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
