import Link from 'next/link'
export function BookingCTA() {
  return (
    <section className="cta container">
      <div>
        <span className="eyebrow">Kami siap mendengarkan</span>
        <h2>
          Mulai percakapan
          <br />
          tentang kesehatan Anda.
        </h2>
      </div>
      <Link href="/booking" className="button light">
        Buat janji konsultasi
      </Link>
    </section>
  )
}
