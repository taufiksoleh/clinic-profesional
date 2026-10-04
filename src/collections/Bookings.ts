import { deliveryFields } from './fields/delivery'
import { canManageBookings } from '@/lib/permissions'
import { isAdmin } from '@/lib/access'
import type { CollectionConfig } from 'payload'
export const Bookings: CollectionConfig = {
  slug: 'bookings',
  labels: { singular: 'Booking', plural: 'Booking masuk' },
  admin: {
    group: 'Klinik',
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'name', 'date', 'status', 'notificationStatus'],
  },
  access: {
    read: ({ req }) => canManageBookings(req.user),
    create: () => false,
    update: ({ req }) => canManageBookings(req.user),
    delete: isAdmin,
  },
  fields: [
    { name: 'reference', type: 'text', required: true, unique: true, admin: { readOnly: true } },
    { name: 'requestId', type: 'text', required: true, unique: true, admin: { hidden: true } },
    { name: 'name', label: 'Nama pasien', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'phone', label: 'WhatsApp', type: 'text', required: true, admin: { readOnly: true } },
    {
      name: 'schedule',
      type: 'relationship',
      relationTo: 'schedules',
      required: true,
      admin: { readOnly: true },
    },
    { name: 'date', label: 'Tanggal', type: 'text', required: true, admin: { readOnly: true } },
    {
      name: 'fee',
      label: 'Biaya saat booking',
      type: 'number',
      required: true,
      admin: { readOnly: true },
    },
    { name: 'details', label: 'Rincian saat booking', type: 'textarea', admin: { readOnly: true } },
    {
      name: 'status',
      label: 'Tindak lanjut',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'Baru', value: 'new' },
        { label: 'Sudah dihubungi', value: 'contacted' },
        { label: 'Dikonfirmasi', value: 'confirmed' },
        { label: 'Selesai', value: 'completed' },
        { label: 'Dibatalkan', value: 'cancelled' },
      ],
    },
    { name: 'notes', label: 'Catatan internal', type: 'textarea' },
    { name: 'source', label: 'Sumber kunjungan', type: 'text', admin: { readOnly: true } },
    { name: 'attribution', type: 'json', admin: { readOnly: true } },
    {
      name: 'consentAt',
      label: 'Persetujuan data',
      type: 'date',
      required: true,
      admin: { readOnly: true },
    },
    { name: 'privacyVersion', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'analyticsConsent', type: 'checkbox', admin: { readOnly: true } },
    {
      name: 'notificationStatus',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'sending', 'sent', 'disabled', 'failed', 'uncertain'],
      admin: { readOnly: true },
    },
    {
      name: 'metaStatus',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'sending', 'sent', 'disabled', 'failed', 'uncertain'],
      admin: { readOnly: true },
    },
    deliveryFields('emailDelivery', 'Pengiriman email'),
    deliveryFields('metaDelivery', 'Pengiriman Meta'),
    {
      name: 'retryEmail',
      label: 'Kirim ulang email gagal / belum pasti',
      type: 'checkbox',
      admin: {
        description:
          'Periksa penerima dahulu untuk menghindari email ganda. Centang lalu simpan untuk mencoba kembali.',
      },
    },
    { name: 'retryMeta', label: 'Coba kembali pengiriman Meta yang gagal', type: 'checkbox' },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, originalDoc, req: request }) => {
        if (operation === 'update' && request.user) {
          const retryEmail = data.retryEmail === true
          const retryMeta = data.retryMeta === true
          const allowed = ['status', 'notes']
          for (const key of Object.keys(data))
            if (!allowed.includes(key) && key !== 'updatedAt') data[key] = originalDoc[key]
          if (retryEmail && ['failed', 'uncertain'].includes(originalDoc.notificationStatus)) {
            data.notificationStatus = 'pending'
            data.emailDelivery = {
              attempts: 0,
              lastAttemptAt: null,
              nextAttemptAt: null,
              lastError: null,
            }
          }
          if (retryMeta && ['failed', 'uncertain'].includes(originalDoc.metaStatus)) {
            data.metaStatus = 'pending'
            data.metaDelivery = {
              attempts: 0,
              lastAttemptAt: null,
              nextAttemptAt: null,
              lastError: null,
            }
          }
          data.retryEmail = false
          data.retryMeta = false
        }
        return data
      },
    ],
  },
}
