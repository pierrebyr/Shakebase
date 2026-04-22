'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/icons'
import { ImageUploader } from '@/components/ImageUploader'
import {
  updateCocktailImageAction,
  addCocktailImageAction,
  removeCocktailImageAction,
} from './image-actions'

const MAX_IMAGES = 6

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export function CocktailImageUploader({
  cocktailId,
  images,
}: {
  cocktailId: string
  images: string[]
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const primary = images[0] ?? null
  const extras = images.slice(1)
  const canAddMore = images.length < MAX_IMAGES

  async function handleAddMore(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setPending(true)
    try {
      let running = images.length
      for (const file of Array.from(files)) {
        if (running + 1 > MAX_IMAGES) {
          setError(`Max ${MAX_IMAGES} photos per cocktail.`)
          break
        }
        const dataUrl = await readFile(file)
        const res = await addCocktailImageAction({ cocktailId, dataUrl })
        if (!res.ok) {
          setError(res.error)
          break
        }
        running += 1
      }
      router.refresh()
    } finally {
      setPending(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemove(url: string) {
    setError(null)
    setPending(true)
    try {
      const res = await removeCocktailImageAction({ cocktailId, url })
      if (!res.ok) setError(res.error)
      else router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <ImageUploader
        alt="Primary cocktail photo"
        aspectRatio="4 / 5"
        currentUrl={primary}
        onUpload={async (dataUrl) => {
          const res = await updateCocktailImageAction({ cocktailId, dataUrl })
          if (res.ok) router.refresh()
          return res
        }}
        onRemove={async () => {
          const res = await updateCocktailImageAction({ cocktailId, dataUrl: null })
          if (res.ok) router.refresh()
          return res
        }}
      />

      <div className="col" style={{ gap: 8 }}>
        <div
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-4)',
          }}
        >
          Gallery · {images.length}/{MAX_IMAGES}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: 8,
          }}
        >
          {extras.map((url) => (
            <div
              key={url}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid var(--line-1)',
                background: 'var(--bg-sunken)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Additional cocktail photo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => handleRemove(url)}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: 'rgba(26,25,24,0.7)',
                  color: '#fff',
                  border: 0,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
                aria-label="Remove photo"
                title="Remove"
              >
                <Icon name="x" size={11} />
              </button>
            </div>
          ))}

          {canAddMore && (
            <label
              style={{
                aspectRatio: '1',
                borderRadius: 10,
                border: '1px dashed var(--line-1)',
                background: '#fff',
                display: 'grid',
                placeItems: 'center',
                cursor: pending ? 'wait' : 'pointer',
                color: 'var(--ink-3)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textAlign: 'center',
                padding: 6,
                transition: 'border-color 140ms, color 140ms',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleAddMore(e.target.files)}
                disabled={pending}
                style={{ display: 'none' }}
              />
              <div className="col" style={{ alignItems: 'center', gap: 4 }}>
                <Icon name="plus" size={14} />
                Add
              </div>
            </label>
          )}
        </div>
        {error && <div style={{ fontSize: 11.5, color: 'var(--crit)' }}>{error}</div>}
      </div>
    </div>
  )
}
