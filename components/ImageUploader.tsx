'use client'

import { useRef, useState, useTransition } from 'react'
import { Icon } from '@/components/icons'

type Props = {
  currentUrl: string | null
  alt: string
  aspectRatio?: string
  maxMb?: number
  onUpload: (dataUrl: string) => Promise<{ ok: boolean; error?: string; url?: string | null }>
  onRemove?: () => Promise<{ ok: boolean; error?: string }>
  /** Optional ghost orb / placeholder shown when empty */
  placeholder?: React.ReactNode
}

export function ImageUploader({
  currentUrl,
  alt,
  aspectRatio = '1 / 1',
  maxMb = 5,
  onUpload,
  onRemove,
  placeholder,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > maxMb * 1024 * 1024) {
      setError(`Image must be under ${maxMb} MB.`)
      return
    }
    setError(null)
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => reject(reader.error ?? new Error('Read failed'))
      reader.readAsDataURL(file)
    })

    // Optimistic preview
    setPreviewUrl(dataUrl)
    start(async () => {
      const res = await onUpload(dataUrl)
      if (!res.ok) {
        setError(res.error ?? 'Upload failed')
        setPreviewUrl(currentUrl)
      } else if (res.url !== undefined) {
        setPreviewUrl(res.url)
      }
    })
  }

  function triggerPick() {
    inputRef.current?.click()
  }

  async function remove() {
    if (!onRemove) return
    setError(null)
    setPreviewUrl(null)
    start(async () => {
      const res = await onRemove()
      if (!res.ok) {
        setError(res.error ?? 'Remove failed')
        setPreviewUrl(currentUrl)
      }
    })
  }

  return (
    <div className="col" style={{ gap: 8 }}>
      <div
        style={{
          position: 'relative',
          aspectRatio,
          width: '100%',
          borderRadius: 14,
          overflow: 'hidden',
          background: previewUrl ? 'transparent' : 'var(--bg-sunken)',
          border: previewUrl ? '1px solid var(--line-1)' : '1.5px dashed var(--line-1)',
          cursor: pending ? 'wait' : 'pointer',
          transition: 'border-color 120ms, background 120ms',
          display: 'grid',
          placeItems: 'center',
        }}
        onClick={previewUrl ? undefined : triggerPick}
        onMouseEnter={(e) => {
          if (!previewUrl) e.currentTarget.style.borderColor = 'var(--accent)'
        }}
        onMouseLeave={(e) => {
          if (!previewUrl) e.currentTarget.style.borderColor = 'var(--line-1)'
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={alt}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            className="col"
            style={{
              alignItems: 'center',
              gap: 8,
              color: 'var(--ink-3)',
              padding: 20,
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            {placeholder ?? (
              <>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--accent-ink)',
                    boxShadow: 'var(--shadow-1)',
                  }}
                >
                  <Icon name="share" size={16} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Upload an image</div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                  PNG or JPG · max {maxMb} MB
                </div>
              </>
            )}
          </div>
        )}

        {pending && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.6)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 12,
              color: 'var(--ink-2)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Uploading…
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        style={{ display: 'none' }}
      />

      <div className="row gap-sm" style={{ justifyContent: 'space-between' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={triggerPick}
          disabled={pending}
          style={{ fontSize: 12, padding: '6px 12px' }}
        >
          <Icon name="edit" size={12} />
          {previewUrl ? 'Replace' : 'Upload'}
        </button>
        {previewUrl && onRemove && (
          <button
            type="button"
            className="btn-ghost"
            onClick={remove}
            disabled={pending}
            style={{ fontSize: 12, color: 'var(--crit)' }}
          >
            <Icon name="trash" size={12} />
            Remove
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            fontSize: 12,
            color: 'var(--crit)',
            background: '#fdf0f0',
            border: '1px solid #f0cccc',
            padding: '6px 10px',
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
