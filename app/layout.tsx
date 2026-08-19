import '../styles/globals.css'
import Providers from '../components/Providers'

export const metadata = {
  title: {
    default: 'Taem Baltina',
    template: '%s · Taem Baltina'
  },
  description: 'Artisanal Ethiopian spices — shop public pantry blends or run the kitchen ops console.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
