'use client'
import styles from './NetworkMap.module.css'
import type { ClinicLocation, PublicSchedule } from '@/lib/content'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
export function NetworkMap({
  locations,
  schedules,
}: {
  locations: ClinicLocation[]
  schedules: PublicSchedule[]
}) {
  const [activeLocationIndex, setActiveLocationIndex] = useState(0)
  const [isMapVisible, setIsMapVisible] = useState(false)
  const mapContainer = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsMapVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    if (mapContainer.current) observer.observe(mapContainer.current)
    return () => observer.disconnect()
  }, [])
  const selectedLocation = locations[activeLocationIndex]
  if (!selectedLocation) return <p>Lokasi praktik akan diumumkan segera.</p>
  return (
    <div className={styles['network']}>
      <div className={styles['network-sidebar']}>
        <div className={styles['location-tabs']} role="tablist" aria-label="Lokasi praktik">
          {locations.map((location, index) => (
            <button
              key={location.id}
              role="tab"
              aria-selected={index === activeLocationIndex}
              onClick={() => setActiveLocationIndex(index)}
            >
              {location.city}
            </button>
          ))}
        </div>
        <h3>{selectedLocation.title}</h3>
        <p>{selectedLocation.address}</p>
        <p>{selectedLocation.hours}</p>
        <div className={styles['map-doctors']}>
          {[
            ...new Map(
              schedules
                .filter((schedule) => schedule.location.id === selectedLocation.id)
                .map((schedule) => [schedule.doctor.id, schedule.doctor]),
            ).values(),
          ].map((doctor) => (
            <Link href={`/dokter/${doctor.slug}`} key={doctor.id}>
              {doctor.image?.url && (
                <img src={doctor.image.url} width={40} height={40} alt={doctor.image.alt} />
              )}
              <span>{doctor.title}</span>
            </Link>
          ))}
        </div>
        <Link className="text-link" href={`/lokasi/${selectedLocation.slug}`}>
          Detail lokasi & biaya
        </Link>
      </div>
      <div ref={mapContainer} className={styles['map-frame']}>
        {isMapVisible ? (
          <iframe
            key={selectedLocation.id}
            title={`Peta ${selectedLocation.title}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedLocation.longitude - 0.035},${selectedLocation.latitude - 0.025},${selectedLocation.longitude + 0.035},${selectedLocation.latitude + 0.025}&layer=mapnik&marker=${selectedLocation.latitude},${selectedLocation.longitude}`}
          />
        ) : (
          <button className="button secondary" onClick={() => setIsMapVisible(true)}>
            Tampilkan peta lokasi
          </button>
        )}
      </div>
    </div>
  )
}
