import type { Field } from 'payload'

export function deliveryFields(name: string, label: string): Field {
  return {
    name,
    label,
    type: 'group',
    admin: { readOnly: true },
    fields: [
      { name: 'attempts', label: 'Jumlah percobaan', type: 'number', defaultValue: 0 },
      { name: 'lastAttemptAt', label: 'Percobaan terakhir', type: 'date' },
      { name: 'nextAttemptAt', label: 'Percobaan berikutnya', type: 'date' },
      { name: 'lastError', label: 'Keterangan kegagalan', type: 'textarea' },
    ],
  }
}
