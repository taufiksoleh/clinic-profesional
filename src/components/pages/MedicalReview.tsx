import type { MedicalReview as Review } from '@/lib/content'
import { Check } from 'lucide-react'
import Link from 'next/link'

export function MedicalReview({ reviewer, reviewedAt }: Review) {
  if (!reviewer) return null
  return (
    <p className="reviewed">
      <Check size={18} />
      Ditinjau oleh <Link href={`/dokter/${reviewer.slug}`}>{reviewer.title}</Link>
      {reviewedAt && ` · ${new Date(reviewedAt).toLocaleDateString('id-ID')}`}
    </p>
  )
}
