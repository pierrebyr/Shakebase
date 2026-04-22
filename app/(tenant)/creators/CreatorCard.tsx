'use client'

import Link from 'next/link'
import { Avatar } from '@/components/cocktail/Avatar'
import { DrinkOrb } from '@/components/cocktail/DrinkOrb'
import { FlagEmoji } from '@/components/FlagEmoji'
import { MedalIcon } from '@/components/cocktail/MedalIcon'
import type { CreatorRow } from '@/lib/creator/types'

export type CreatorCardData = CreatorRow & {
  drinks: { id: string; orb_from: string | null; orb_to: string | null }[]
}

export function CreatorCard({ cr }: { cr: CreatorCardData }) {
  const drinks = cr.drinks
  const topAward = (cr.awards ?? [])[0]
  const specialties = cr.specialties ?? []
  const hue = cr.avatar_hue ?? 30
  const compCount = (cr.competitions ?? []).length

  return (
    <Link
      href={`/creators/${cr.id}`}
      className="card"
      style={{
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'transform 200ms, box-shadow 200ms',
      }}
    >
      {/* header band */}
      <div
        style={{
          padding: '20px 22px 16px',
          background: `linear-gradient(135deg, oklch(0.94 0.04 ${hue}), oklch(0.98 0.015 ${hue}))`,
          borderBottom: '1px solid var(--line-2)',
        }}
      >
        <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
          <Avatar name={cr.name} size={58} src={cr.photo_url} />
          <div className="col" style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 8, marginBottom: 2, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: 19,
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: '0 1 auto',
                  minWidth: 0,
                }}
              >
                {cr.name}
              </span>
              {cr.pronouns && (
                <span
                  className="mono"
                  style={{
                    fontSize: 9.5,
                    color: 'var(--ink-4)',
                    textTransform: 'lowercase',
                    flexShrink: 0,
                  }}
                >
                  {cr.pronouns}
                </span>
              )}
            </div>
            {cr.role && (
              <span
                style={{
                  fontSize: 12.5,
                  color: 'var(--ink-2)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {cr.role}
              </span>
            )}
            {(cr.venue || cr.city) && (
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: 'var(--ink-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginTop: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                <FlagEmoji country={cr.country} /> &nbsp;{[cr.venue, cr.city].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* body */}
      <div className="col" style={{ padding: 18, gap: 12, flex: 1 }}>
        {cr.signature && (
          <div className="col" style={{ gap: 2 }}>
            <span
              className="mono"
              style={{
                fontSize: 9.5,
                color: 'var(--ink-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              Signature
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 15,
                color: 'var(--ink-2)',
              }}
            >
              {cr.signature}
            </span>
          </div>
        )}

        {specialties.length > 0 && (
          <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
            {specialties.slice(0, 3).map((s) => (
              <span key={s} className="pill" style={{ fontSize: 10 }}>
                {s}
              </span>
            ))}
            {specialties.length > 3 && (
              <span className="pill" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                +{specialties.length - 3}
              </span>
            )}
          </div>
        )}

        {topAward && (
          <div
            className="row gap-sm"
            style={{
              padding: '8px 10px',
              background: 'var(--bg-sunken)',
              borderRadius: 8,
              border: '1px solid var(--line-2)',
            }}
          >
            <MedalIcon medal={topAward.medal} size={16} />
            <div className="col" style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: 11.5,
                  color: 'var(--ink-2)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {topAward.title}
              </span>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--ink-4)' }}>
                {topAward.org} · {topAward.year}
              </span>
            </div>
            {(cr.awards?.length ?? 0) - 1 > 0 && (
              <span
                className="mono"
                style={{ fontSize: 10, color: 'var(--ink-4)', marginLeft: 'auto' }}
              >
                +{(cr.awards?.length ?? 0) - 1} more
              </span>
            )}
          </div>
        )}

        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 'auto',
            paddingTop: 10,
            borderTop: '1px solid var(--line-2)',
          }}
        >
          <div className="row gap-sm" style={{ minWidth: 0 }}>
            {drinks.slice(0, 4).map((d) => (
              <DrinkOrb
                key={d.id}
                from={d.orb_from ?? '#f4efe0'}
                to={d.orb_to ?? '#c9b89a'}
                size={22}
              />
            ))}
            <span style={{ fontSize: 11, color: 'var(--ink-4)', marginLeft: 4 }}>
              {drinks.length} {drinks.length === 1 ? 'spec' : 'specs'}
            </span>
          </div>
          {compCount > 0 && (
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
              {compCount} comps
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
