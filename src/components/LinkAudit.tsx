'use client'
import { useState } from 'react'
type Result = { url: string; status: string; httpStatus?: number; detail?: string }
export function LinkAudit() {
  const [isChecking, setIsChecking] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [internal, setInternal] = useState<
    { path: string; links: string[]; unverified: string[] }[]
  >([])
  async function checkLinks() {
    setIsChecking(true)
    setResults([])
    setInternal([])
    setMessage('Memeriksa tautan…')
    let offset = 0
    let checkedLinks: Result[] = []
    try {
      do {
        const response = await fetch(`/api/seo-audit?externalOffset=${offset}`)
        if (!response.ok) throw Error('Audit belum dapat dijalankan. Coba lagi.')
        const auditResponse = await response.json()
        setInternal(
          auditResponse.pages
            .map(
              (page: {
                path: string
                brokenInternalLinks: string[]
                unverifiedInternalLinks: string[]
              }) => ({
                path: page.path,
                links: page.brokenInternalLinks,
                unverified: page.unverifiedInternalLinks,
              }),
            )
            .filter(
              (page: { links: string[]; unverified: string[] }) =>
                page.links.length || page.unverified.length,
            ),
        )
        checkedLinks = [...checkedLinks, ...auditResponse.externalResults]
        setResults(checkedLinks)
        setMessage(
          `${checkedLinks.length} dari ${auditResponse.externalTotal} tautan eksternal diperiksa.`,
        )
        if (auditResponse.nextExternalOffset === null) break
        offset = auditResponse.nextExternalOffset
      } while (true)
      setMessage(`Pemeriksaan selesai. ${checkedLinks.length} tautan eksternal diperiksa.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Audit gagal.')
    } finally {
      setIsChecking(false)
    }
  }
  return (
    <section
      style={{
        margin: '24px 0',
        padding: 18,
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 8,
      }}
    >
      <h3>Pemeriksaan tautan</h3>
      <p>
        Periksa tujuan tautan internal dan eksternal. Situs yang membatasi pemeriksa otomatis
        ditandai untuk ditinjau.
      </p>
      <button
        type="button"
        disabled={isChecking}
        onClick={checkLinks}
        style={{ padding: '10px 16px', cursor: 'pointer' }}
      >
        {isChecking ? 'Memeriksa…' : 'Periksa semua tautan'}
      </button>
      <p role="status">{message}</p>
      {internal.map((page) => (
        <div key={page.path}>
          <strong>{page.path}</strong>
          <ul>
            {page.links.map((link) => (
              <li key={link}>Tautan internal tidak ditemukan: {link}</li>
            ))}
            {page.unverified.map((link) => (
              <li key={link}>Tautan internal perlu ditinjau: {link}</li>
            ))}
          </ul>
        </div>
      ))}
      {!!results.length && (
        <ul>
          {results.map((link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noreferrer">
                {link.url}
              </a>{' '}
              ·{' '}
              {link.status === 'ok'
                ? 'Tersedia'
                : link.status === 'broken'
                  ? 'Tidak ditemukan'
                  : 'Perlu ditinjau'}
              {link.httpStatus ? ` (${link.httpStatus})` : ''}
              {link.detail ? ` — ${link.detail}` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
