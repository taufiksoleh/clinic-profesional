import type { ClinicLocation } from '../../src/lib/content'
import { DoctorPage } from '../../src/components/pages/DoctorPage'
import { getPublishedContent } from '../../src/server/content/queries'

// Checked by tsc, never called: collection types must reach feature component props.
export async function checkContentTypes(location: ClinicLocation) {
  const doctors = await getPublishedContent('doctors')
  void DoctorPage({ doctor: doctors[0] })
  // @ts-expect-error A location cannot be passed as a doctor profile.
  void DoctorPage({ doctor: location })
  // @ts-expect-error Coordinates are required for a location.
  const incomplete: ClinicLocation = {
    id: 1,
    title: 'Lokasi',
    slug: 'lokasi',
    summary: '',
    updatedAt: '',
  }
  return incomplete
}
