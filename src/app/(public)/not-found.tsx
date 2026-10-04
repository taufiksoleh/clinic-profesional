import { Log404 } from '@/components/Log404'
import Link from 'next/link'
export default function NotFound() {
  return (
    <section className="container section empty">
      <Log404 />
      <span className="eyebrow">404 · Halaman tidak ditemukan</span>
      <h1>
        Sepertinya Anda
        <br />
        berada di tempat lain.
      </h1>
      <p>Tautan mungkin telah berubah. Temukan layanan atau dokter dari beranda.</p>
      <Link className="button" href="/">
        Kembali ke beranda
      </Link>
    </section>
  )
}
