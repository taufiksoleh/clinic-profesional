import { invalidateSchedules } from './hooks/cache'
import { isAdmin, isManager } from '@/lib/access'
import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
export const Schedules: CollectionConfig = {
  slug: 'schedules',
  labels: { singular: 'Jadwal & biaya', plural: 'Jadwal & biaya' },
  admin: { group: 'Klinik', defaultColumns: ['doctor', 'location', 'day', 'start', 'fee'] },
  access: { read: () => true, create: isManager, update: isManager, delete: isAdmin },
  fields: [
    { name: 'doctor', type: 'relationship', relationTo: 'doctors', required: true },
    { name: 'location', type: 'relationship', relationTo: 'locations', required: true },
    { name: 'service', type: 'relationship', relationTo: 'services', required: true },
    {
      name: 'day',
      label: 'Hari (0=Minggu, 1=Senin, …)',
      type: 'number',
      required: true,
      min: 0,
      max: 6,
    },
    {
      name: 'start',
      label: 'Mulai (HH:MM)',
      type: 'text',
      required: true,
      validate: (v: unknown) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v)) || 'Format HH:MM',
    },
    {
      name: 'end',
      label: 'Selesai (HH:MM)',
      type: 'text',
      required: true,
      validate: (v: unknown) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v)) || 'Format HH:MM',
    },
    { name: 'fee', label: 'Biaya konsultasi (Rp)', type: 'number', min: 0, required: true },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
  hooks: {
    afterChange: [invalidateSchedules],
    afterDelete: [invalidateSchedules],
    beforeValidate: [
      ({ data }) => {
        if (data?.start && data?.end && data.end <= data.start)
          throw new APIError('Waktu selesai harus setelah waktu mulai.', 400)
        return data
      },
    ],
  },
}
