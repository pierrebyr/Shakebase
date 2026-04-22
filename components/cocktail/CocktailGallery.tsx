'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@/components/icons'

type Props = {
  images: string[]
  alt: string
  aspectRatio?: string
  borderRadius?: number
  // When true, the gallery fills its parent (height: 100%) instead of
  // enforcing its own aspect ratio. Use this when the parent already
  // defines the sizing (cocktail hero).
  fill?: boolean
}

export function CocktailGallery({
  images,
  alt,
  aspectRatio = '4 / 5',
  borderRadius = 16,
  fill = false,
}: Props) {
  const [index, setIndex] = useState(0)

  // Reset to first image if the list shrinks underneath us.
  useEffect(() => {
    if (index >= images.length) setIndex(0)
  }, [images.length, index])

  if (images.length === 0) return null

  const canPaginate = images.length > 1
  const next = () => setIndex((i) => (i + 1) % images.length)
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length)

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: fill ? '100%' : undefined,
        aspectRatio: fill ? undefined : aspectRatio,
        borderRadius,
        overflow: 'hidden',
        background: '#f4efe6',
      }}
    >
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src + i}
          src={src}
          alt={i === 0 ? alt : `${alt} — ${i + 1}`}
          loading={i === 0 ? 'eager' : 'lazy'}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: i === index ? 1 : 0,
            transition: 'opacity 320ms ease',
          }}
        />
      ))}

      {canPaginate && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={prev}
            className="gallery-nav"
            style={{ left: 12 }}
          >
            <Icon name="chevron-l" size={14} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={next}
            className="gallery-nav"
            style={{ right: 12 }}
          >
            <Icon name="chevron-r" size={14} />
          </button>

          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(26,25,24,0.45)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => setIndex(i)}
                style={{
                  width: i === index ? 22 : 7,
                  height: 7,
                  borderRadius: 999,
                  background: i === index ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'width 220ms ease, background 220ms ease',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
