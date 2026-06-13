import '../styles/globals.css'
import Providers from '../components/Providers'

export const metadata = {
  title: 'Taem Baltina Operations Console',
  description: 'Internal spice inventory, production, sales credit, and cost management'
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
