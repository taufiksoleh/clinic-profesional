import { getPublicConfig } from '@/lib/public-config'
import { Analytics } from '@/components/Analytics'
import { BookingWidget } from '@/components/BookingWidget'
import { getSiteUrl } from '@/lib/site'
import { getClinicSettings } from '@/server/content/queries'
import { Menu, Plus } from 'lucide-react'
import Link from 'next/link'
import './styles.css'
export async function generateMetadata() {
  const s = await getClinicSettings()
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: s.name, template: `%s | ${s.name}` },
    description: s.description,
    icons: { icon: '/favicon.svg' },
    verification: { google: s.searchConsoleVerification || undefined },
    robots: getPublicConfig().demoMode ? { index: false, follow: false } : undefined,
  }
}
export default async function Layout({ children }: { children: React.ReactNode }) {
  const s = await getClinicSettings()
  return (
    <html lang="id">
      <body>
        <a className="skip" href="#main">
          Lewati ke konten
        </a>
        {getPublicConfig().demoMode && (
          <div className="demo-banner">
            Situs demonstrasi · Identitas, dokter, lokasi, dan biaya adalah contoh.
          </div>
        )}
        <header className="site-header">
          <Link className="brand" href="/">
            <span className="brand-mark">
              <Plus size={25} />
            </span>
            <span>{s.name}</span>
          </Link>
          <nav className="desktop-nav" aria-label="Navigasi utama">
            <Link href="/layanan">Layanan</Link>
            <Link href="/dokter">Dokter</Link>
            <Link href="/lokasi">Lokasi</Link>
            <Link href="/blog">Edukasi</Link>
            <Link href="/tentang">Tentang kami</Link>
          </nav>
          <Link className="button small" href="/booking">
            Buat janji
          </Link>
          <details className="mobile-nav">
            <summary aria-label="Buka menu">
              <Menu />
            </summary>
            <nav>
              <Link href="/layanan">Layanan</Link>
              <Link href="/dokter">Dokter</Link>
              <Link href="/lokasi">Lokasi</Link>
              <Link href="/blog">Edukasi</Link>
              <Link href="/tentang">Tentang kami</Link>
              <Link href="/kontak">Kontak</Link>
            </nav>
          </details>
        </header>
        <main id="main">{children}</main>
        <footer>
          <div className="footer-top">
            <div>
              <Link className="brand" href="/">
                <span className="brand-mark">
                  <Plus size={24} />
                </span>
                {s.name}
              </Link>
              <p>{s.description}</p>
            </div>
            <div>
              <h2>Klinik</h2>
              <Link href="/tentang">Tentang kami</Link>
              <Link href="/lokasi">Lokasi praktik</Link>
              <Link href="/berita">Berita</Link>
              <Link href="/kontak">Hubungi kami</Link>
            </div>
            <div>
              <h2>Untuk Anda</h2>
              <Link href="/dokter">Cari dokter</Link>
              <Link href="/booking">Buat janji</Link>
              <Link href="/blog">Pusat edukasi</Link>
              <Link href="/links">Tautan resmi</Link>
            </div>
            <div>
              <h2>Informasi</h2>
              <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
              <p>Informasi di website ini tidak menggantikan konsultasi langsung dengan dokter.</p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} {s.name}
            </span>
            <span>Ruang untuk kembali bergerak.</span>
          </div>
        </footer>
        <BookingWidget whatsapp={process.env.WHATSAPP_NUMBER} />
        <Analytics />
      </body>
    </html>
  )
}
