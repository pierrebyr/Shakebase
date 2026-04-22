'use client'

import { useActionState } from 'react'
import { updateCreatorAction, type CreatorMutationResult } from './actions'
import type { CreatorRow } from '@/lib/creator/types'

const initialState: CreatorMutationResult = { ok: true }

export function EditCreatorForm({ creator }: { creator: CreatorRow }) {
  const [state, action, pending] = useActionState(updateCreatorAction, initialState)

  const asJson = (v: unknown): string => JSON.stringify(v ?? [], null, 2)

  return (
    <form action={action} className="card card-pad" style={{ padding: 28, maxWidth: 820 }}>
      <input type="hidden" name="id" value={creator.id} />

      <div className="col" style={{ gap: 20 }}>
        {/* ─ Basics ─ */}
        <Section title="Basics">
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Full name</span>
            <input name="name" required defaultValue={creator.name} className="sb-input" />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label className="col" style={{ gap: 6 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Role / title</span>
              <input
                name="role"
                defaultValue={creator.role ?? ''}
                className="sb-input"
                placeholder="Head Mixologist"
              />
            </label>
            <label className="col" style={{ gap: 6 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Pronouns</span>
              <input
                name="pronouns"
                defaultValue={creator.pronouns ?? ''}
                className="sb-input"
                placeholder="she/her"
              />
            </label>
            <label className="col" style={{ gap: 6 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Joined</span>
              <input
                name="joined_year"
                defaultValue={creator.joined_year ?? ''}
                className="sb-input"
                placeholder="2021"
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label className="col" style={{ gap: 6 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Venue</span>
              <input
                name="venue"
                defaultValue={creator.venue ?? ''}
                className="sb-input"
                placeholder="Aurelia Bar"
              />
            </label>
            <label className="col" style={{ gap: 6 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>City</span>
              <input
                name="city"
                defaultValue={creator.city ?? ''}
                className="sb-input"
                placeholder="Lisbon"
              />
            </label>
            <label className="col" style={{ gap: 6 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Country</span>
              <input
                name="country"
                defaultValue={creator.country ?? ''}
                className="sb-input"
                placeholder="Portugal"
              />
            </label>
          </div>

          <label className="col" style={{ gap: 6, maxWidth: 240 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
              Avatar hue (0-360)
            </span>
            <input
              name="avatar_hue"
              type="number"
              min={0}
              max={360}
              defaultValue={creator.avatar_hue ?? ''}
              className="sb-input"
              placeholder="28"
            />
          </label>
        </Section>

        {/* ─ Voice ─ */}
        <Section title="Voice">
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Signature</span>
            <input
              name="signature"
              defaultValue={creator.signature ?? ''}
              className="sb-input"
              placeholder="Acid-adjusted split bases"
            />
          </label>
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Philosophy (one line)</span>
            <textarea
              name="philosophy"
              rows={2}
              defaultValue={creator.philosophy ?? ''}
              className="sb-input"
              style={{ resize: 'vertical' }}
              placeholder="A drink should feel hungry, not sweet."
            />
          </label>
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Bio</span>
            <textarea
              name="bio"
              rows={4}
              defaultValue={creator.bio ?? ''}
              className="sb-input"
              style={{ resize: 'vertical', minHeight: 80, lineHeight: 1.55 }}
            />
          </label>
        </Section>

        {/* ─ Lists (comma-separated) ─ */}
        <Section title="Lists · comma-separated">
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Specialties</span>
            <input
              name="specialties"
              defaultValue={(creator.specialties ?? []).join(', ')}
              className="sb-input"
              placeholder="Clarification, Cordials, Acid adjustment, Low-ABV"
            />
          </label>
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Languages</span>
            <input
              name="languages"
              defaultValue={(creator.languages ?? []).join(', ')}
              className="sb-input"
              placeholder="Portuguese, English, Spanish"
            />
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>
              The first item renders as &quot;Native&quot;, the rest as &quot;Fluent&quot;.
            </span>
          </label>
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Mentors</span>
            <input
              name="mentors"
              defaultValue={(creator.mentors ?? []).join(', ')}
              className="sb-input"
              placeholder="Ryan Chetiyawardana, Chef Vítor Adão"
            />
          </label>
        </Section>

        {/* ─ Structured data (JSON) ─ */}
        <Section title="Structured data · JSON">
          <JsonField
            name="awards"
            label="Awards"
            hint='Array of { "year": 2024, "title": "Best Bar", "org": "Tales", "medal": "gold"|"silver"|"bronze" }'
            defaultValue={asJson(creator.awards)}
          />
          <JsonField
            name="competitions"
            label="Competitions"
            hint='Array of { "year": 2024, "name": "Bacardí Legacy", "placement": "Iberia Champion" }'
            defaultValue={asJson(creator.competitions)}
          />
          <JsonField
            name="certifications"
            label="Certifications"
            hint='Array of { "name": "WSET Spirits L3", "year": 2022, "issuer": "WSET" }'
            defaultValue={asJson(creator.certifications)}
          />
          <JsonField
            name="career"
            label="Career timeline"
            hint='Array of { "year": "2021", "role": "Head Mixologist", "place": "Aurelia Bar", "current": true }'
            defaultValue={asJson(creator.career)}
          />
          <JsonField
            name="press"
            label="Press"
            hint='Array of { "outlet": "Imbibe", "title": "…", "year": 2024, "url": "https://…" }'
            defaultValue={asJson(creator.press)}
          />
          <JsonField
            name="socials"
            label="Socials"
            hint='Object with keys: instagram, linkedin, website'
            defaultValue={JSON.stringify(creator.socials ?? {}, null, 2)}
          />
          <JsonField
            name="book"
            label="Book (or leave as null)"
            hint='{ "title": "The Clarification Handbook", "year": 2023, "co": "M. Seegers" }'
            defaultValue={creator.book ? JSON.stringify(creator.book, null, 2) : 'null'}
          />
        </Section>

        {!state.ok && (
          <div
            role="alert"
            style={{
              fontSize: 12.5,
              color: 'var(--crit)',
              background: '#fdf0f0',
              border: '1px solid #f0cccc',
              padding: '8px 12px',
              borderRadius: 10,
            }}
          >
            {state.error}
          </div>
        )}
        {state.ok && state !== initialState && (
          <div style={{ fontSize: 12, color: 'var(--ok)' }}>Saved.</div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={pending}
          style={{ alignSelf: 'flex-start' }}
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="col" style={{ gap: 12 }}>
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-4)',
          borderBottom: '1px solid var(--line-2)',
          paddingBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function JsonField({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: string
  label: string
  hint: string
  defaultValue: string
}) {
  return (
    <label className="col" style={{ gap: 6 }}>
      <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={6}
        className="sb-input"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          resize: 'vertical',
          minHeight: 110,
          lineHeight: 1.5,
        }}
        spellCheck={false}
      />
      <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>
        {hint}
      </span>
    </label>
  )
}
