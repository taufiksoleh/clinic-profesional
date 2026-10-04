'use client'
import { days } from '@/lib/constants'
import type { DoctorProfile, PublicSchedule } from '@/lib/content'
import { useState } from 'react'
import { ContentCard } from './ContentCard'
export function DoctorFinder({
  doctors,
  schedules,
}: {
  doctors: DoctorProfile[]
  schedules: PublicSchedule[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [location, setLocation] = useState('')
  const [day, setDay] = useState('')
  const filteredDoctors = doctors.filter(
    (doctor) =>
      (!searchQuery || doctor.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!specialty || doctor.specialty === specialty) &&
      ((!location && !day) ||
        schedules.some(
          (schedule) =>
            schedule.doctor.id === doctor.id &&
            (!location || String(schedule.location.id) === location) &&
            (!day || String(schedule.day) === day),
        )),
  )
  return (
    <>
      <div className="filters">
        <label>
          Nama dokter
          <input
            type="search"
            placeholder="Cari nama dokter"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
        <label>
          Spesialisasi
          <select value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
            <option value="">Semua spesialisasi</option>
            {[...new Set(doctors.map((doctor) => doctor.specialty))].map((specialtyName) => (
              <option key={specialtyName}>{specialtyName}</option>
            ))}
          </select>
        </label>
        <label>
          Lokasi
          <select value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value="">Semua lokasi</option>
            {[
              ...new Map(
                schedules.map((schedule) => [schedule.location.id, schedule.location]),
              ).values(),
            ].map((locationOption) => (
              <option key={locationOption.id} value={locationOption.id}>
                {locationOption.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hari praktik
          <select value={day} onChange={(event) => setDay(event.target.value)}>
            <option value="">Semua hari</option>
            {days.map((dayName, dayIndex) => (
              <option key={dayName} value={dayIndex}>
                {dayName}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p aria-live="polite" className="caption">
        {filteredDoctors.length} dokter ditemukan
      </p>
      <div className="cards">
        {filteredDoctors.map((doctor) => (
          <ContentCard key={doctor.id} doc={doctor} category="dokter" heading="h2" />
        ))}
      </div>
      {!filteredDoctors.length && (
        <div className="empty">Belum ada dokter yang cocok. Coba ubah filter.</div>
      )}
    </>
  )
}
