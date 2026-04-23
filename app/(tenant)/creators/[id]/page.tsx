import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { Avatar } from '@/components/cocktail/Avatar'
import { CocktailCard, type CocktailCardData } from '@/components/cocktail/CocktailCard'
import { DrinkOrb } from '@/components/cocktail/DrinkOrb'
import { FlagEmoji } from '@/components/FlagEmoji'
import { MedalIcon } from '@/components/cocktail/MedalIcon'
import { Icon } from '@/components/icons'
import type { CreatorRow, Socials } from '@/lib/creator/types'
import { trackEvent } from '@/lib/activity/track'
import { ACTIVITY_KINDS } from '@/lib/activity/kinds'

type Props = { params: Promise<{ id: string }> }

type CocktailJoin = CocktailCardData & {
  creators: { name: string } | null
  global_products: { brand: string; expression: string } | null
}

function SocialsCard({ socials, name }: { socials: Socials | null; name: string }) {
  const entries: { icon: 'instagram' | 'linkedin' | 'external-link'; label: string; val: string; href: string }[] = []
  if (socials?.instagram) {
    const handle = socials.instagram.replace(/^@/, '')
    entries.push({
      icon: 'instagram',
      label: 'Instagram',
      val: socials.instagram,
      href: `https://instagram.com/${handle}`,
    })
  }
  if (socials?.linkedin) {
    const handle = socials.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')
    entries.push({
      icon: 'linkedin',
      label: 'LinkedIn',
      val: socials.linkedin,
      href: `https://linkedin.com/in/${handle}`,
    })
  }
  if (socials?.website) {
    const url = socials.website.startsWith('http') ? socials.website : `https://${socials.website}`
    entries.push({ icon: 'external-link', label: 'Website', val: socials.website, href: url })
  }
  if (entries.length === 0) return null

  return (
    <div className="card card-pad">
      <div className="panel-title" style={{ marginBottom: 12 }}>
        Find {name.split(' ')[0]} online
      </div>
      <div className="col" style={{ gap: 6 }}>
        {entries.map((e) => (
          <a
            key={e.label}
            href={e.href}
            target="_blank"
            rel="noopener noreferrer"
            className="row gap-sm"
            style={{
              fontSize: 12,
              padding: '4px 6px',
              margin: '-4px -6px',
              borderRadius: 8,
              color: 'inherit',
              transition: 'background 120ms',
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                display: 'grid',
                placeItems: 'center',
                background: 'var(--bg-sunken)',
                borderRadius: 6,
                color: 'var(--ink-2)',
                flexShrink: 0,
              }}
            >
              <Icon name={e.icon} size={13} />
            </span>
            <span style={{ color: 'var(--ink-4)', fontSize: 11, width: 62, flexShrink: 0 }}>
              {e.label}
            </span>
            <span
              style={{
                color: 'var(--ink-2)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {e.val}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

function StatTile({ k, v }: { k: string; v: string | number }) {
  return (
    <div
      style={{ padding: '16px 20px', borderRight: '1px solid var(--line-2)', minWidth: 0 }}
    >
      <div className="panel-title" style={{ marginBottom: 2 }}>
        {k}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 26,
          fontWeight: 400,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {v}
      </div>
    </div>
  )
}

export default async function CreatorProfilePage({ params }: Props) {
  const { id } = await params
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  const { data: creatorData } = await supabase
    .from('creators')
    .select(
      'id, name, role, venue, city, country, joined_year, bio, photo_url, pronouns, signature, philosophy, avatar_hue, specialties, languages, mentors, awards, competitions, certifications, career, press, book, socials',
    )
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  const creator = creatorData as CreatorRow | null
  if (!creator) notFound()

  await trackEvent({
    kind: ACTIVITY_KINDS.CREATOR_VIEW,
    target: { type: 'creator', id: creator.id, label: creator.name },
    metadata: { role: creator.role, city: creator.city },
  })

  const { data: cocktailsData } = await supabase
    .from('cocktails')
    .select(
      'id, slug, name, category, spirit_base, glass_type, orb_from, orb_to, image_url, creators(name), global_products(brand, expression)',
    )
    .eq('workspace_id', workspace.id)
    .eq('creator_id', id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  const cocktails = ((cocktailsData ?? []) as unknown as CocktailJoin[]).map<CocktailCardData>(
    (r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      category: r.category,
      spirit_base: r.spirit_base,
      glass_type: r.glass_type,
      orb_from: r.orb_from,
      orb_to: r.orb_to,
      image_url: r.image_url,
      creator_name: creator.name,
      base_product_expression: r.global_products?.expression ?? null,
      base_product_brand: r.global_products?.brand ?? null,
    }),
  )

  const spirits = Array.from(
    new Set(cocktails.map((c) => c.spirit_base).filter(Boolean) as string[]),
  )
  const awards = creator.awards ?? []
  const competitions = creator.competitions ?? []
  const certifications = creator.certifications ?? []
  const career = creator.career ?? []
  const press = creator.press ?? []
  const specialties = creator.specialties ?? []
  const languages = creator.languages ?? []
  const mentors = creator.mentors ?? []
  const hue = creator.avatar_hue ?? 28
  const goldCount = awards.filter((a) => a.medal === 'gold').length
  const firstCareerYear = career[0]?.year ?? creator.joined_year
  const yearsActive = firstCareerYear
    ? new Date().getFullYear() - parseInt(firstCareerYear, 10)
    : 0

  return (
    <div className="page fade-up" style={{ paddingTop: 18 }}>
      <Link href="/creators" className="btn-ghost" style={{ marginBottom: 18 }}>
        <Icon name="chevron-l" size={12} />
        All creators
      </Link>

      {/* HERO */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 28 }}>
        <div
          style={{
            height: 190,
            background: `
              radial-gradient(70% 120% at 80% 30%, oklch(0.88 0.10 ${hue}) 0%, transparent 60%),
              radial-gradient(80% 120% at 15% 90%, oklch(0.92 0.05 ${hue + 40}) 0%, transparent 70%),
              linear-gradient(135deg, oklch(0.96 0.02 ${hue}), oklch(0.99 0.01 ${hue}))`,
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', right: 32, top: 30, display: 'flex', gap: 14 }}>
            {cocktails.slice(0, 3).map((d, i) => (
              <div key={d.id} style={{ transform: `translateY(${i * 8}px)`, opacity: 0.9 }}>
                <DrinkOrb
                  from={d.orb_from ?? '#f4efe0'}
                  to={d.orb_to ?? '#c9b89a'}
                  size={52 - i * 6}
                  ring
                />
              </div>
            ))}
          </div>
        </div>

        <div className="creator-hero-row">
          <div
            className="creator-hero-avatar"
            style={{
              marginTop: -78,
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))',
            }}
          >
            <Avatar name={creator.name} size={130} src={creator.photo_url} />
          </div>
          <div className="col creator-hero-info" style={{ minWidth: 0, paddingTop: 4 }}>
            {creator.role && (
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: 'var(--ink-4)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                {creator.role}
              </span>
            )}
            <h1
              style={{
                margin: '4px 0 10px',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 46,
                letterSpacing: '-0.025em',
                lineHeight: 1.05,
                textWrap: 'balance',
              }}
            >
              {creator.name}
              {creator.pronouns && (
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-4)',
                    textTransform: 'lowercase',
                    marginLeft: 10,
                    verticalAlign: 'middle',
                    fontStyle: 'normal',
                  }}
                >
                  · {creator.pronouns}
                </span>
              )}
            </h1>
            <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
              {(creator.venue || creator.city) && (
                <span className="pill">
                  <FlagEmoji country={creator.country} /> &nbsp;
                  {[creator.venue, creator.city].filter(Boolean).join(', ')}
                </span>
              )}
              {creator.joined_year && (
                <span className="pill">
                  <Icon name="time" size={11} />
                  Joined {creator.joined_year}
                </span>
              )}
              {yearsActive > 0 && (
                <span className="pill">
                  <Icon name="users" size={11} />
                  {yearsActive} yrs in the industry
                </span>
              )}
              {goldCount > 0 && (
                <span
                  className="pill"
                  style={{
                    background: 'var(--accent-wash)',
                    color: 'var(--accent-ink)',
                    borderColor: 'transparent',
                  }}
                >
                  <MedalIcon medal="gold" size={12} />
                  {goldCount} gold
                </span>
              )}
            </div>
          </div>
          <div className="row gap-sm creator-hero-actions" style={{ paddingTop: 4 }}>
            <Link href={`/creators/${creator.id}/edit`} className="btn-secondary">
              <Icon name="edit" size={13} />
              Edit
            </Link>
          </div>
        </div>

        <div className="creator-hero-stats">
          <StatTile k="Specs" v={cocktails.length} />
          <StatTile k="Spirits worked" v={spirits.length} />
          <StatTile k="Awards" v={awards.length} />
          <StatTile k="Languages" v={languages.length} />
        </div>
      </div>

      {/* TWO-COLUMN BODY */}
      <div
        className="creator-body"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2.1fr)',
          gap: 'var(--density-gap)',
          alignItems: 'flex-start',
        }}
      >
        <div
          className="col creator-rail"
          style={{ gap: 'var(--density-gap)', position: 'sticky', top: 20, minWidth: 0 }}
        >
          <div className="card card-pad">
            <div className="panel-title" style={{ marginBottom: 10 }}>
              About
            </div>
            {creator.bio ? (
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, color: 'var(--ink-2)' }}>
                {creator.bio}
              </p>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--ink-4)', margin: 0 }}>
                No bio yet.{' '}
                <Link href={`/creators/${creator.id}/edit`} style={{ color: 'var(--accent-ink)' }}>
                  Add one →
                </Link>
              </p>
            )}
            {creator.philosophy && (
              <blockquote
                style={{
                  margin: '16px 0 0',
                  padding: '10px 14px',
                  borderLeft: `2px solid oklch(0.75 0.08 ${hue})`,
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: 15,
                  color: 'var(--ink-2)',
                  lineHeight: 1.5,
                }}
              >
                &ldquo;{creator.philosophy}&rdquo;
              </blockquote>
            )}
          </div>

          {specialties.length > 0 && (
            <div className="card card-pad">
              <div className="panel-title" style={{ marginBottom: 12 }}>
                Specialties
              </div>
              <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="pill"
                    style={{
                      background: 'var(--accent-wash)',
                      color: 'var(--accent-ink)',
                      borderColor: 'transparent',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div className="card card-pad">
              <div className="panel-title" style={{ marginBottom: 10 }}>
                Languages
              </div>
              <div className="col" style={{ gap: 8 }}>
                {languages.map((l, i) => (
                  <div
                    key={l}
                    className="row"
                    style={{ justifyContent: 'space-between', fontSize: 13 }}
                  >
                    <span style={{ color: 'var(--ink-2)' }}>{l}</span>
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        color: 'var(--ink-4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {i === 0 ? 'Native' : 'Fluent'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications.length > 0 && (
            <div className="card card-pad">
              <div className="panel-title" style={{ marginBottom: 12 }}>
                Certifications
              </div>
              <div className="col" style={{ gap: 10 }}>
                {certifications.map((c) => (
                  <div
                    key={c.name}
                    className="row gap-sm"
                    style={{ alignItems: 'flex-start' }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: 'var(--bg-sunken)',
                        border: '1px solid var(--line-2)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        color: 'var(--ink-3)',
                      }}
                    >
                      <Icon name="check" size={13} />
                    </div>
                    <div className="col" style={{ minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 12.5,
                          color: 'var(--ink-2)',
                          lineHeight: 1.3,
                        }}
                      >
                        {c.name}
                      </span>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                        {c.issuer} · {c.year}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mentors.length > 0 && (
            <div className="card card-pad">
              <div className="panel-title" style={{ marginBottom: 10 }}>
                Mentors &amp; influences
              </div>
              <div className="col" style={{ gap: 4 }}>
                {mentors.map((m) => (
                  <div
                    key={m}
                    style={{
                      fontSize: 13,
                      color: 'var(--ink-2)',
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                    }}
                  >
                    — {m}
                  </div>
                ))}
              </div>
            </div>
          )}

          <SocialsCard socials={creator.socials} name={creator.name} />
        </div>

        {/* RIGHT COLUMN */}
        <div className="col" style={{ gap: 'var(--density-gap)', minWidth: 0 }}>
          {awards.length > 0 && (
            <div className="card card-pad">
              <div
                className="row"
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginBottom: 16,
                }}
              >
                <div className="col">
                  <span
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      color: 'var(--ink-4)',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Awards &amp; recognition
                  </span>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      fontSize: 26,
                    }}
                  >
                    Shelf of honours.
                  </h2>
                </div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                  {awards.length} total
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                {awards.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: '1px solid var(--line-2)',
                      background:
                        a.medal === 'gold'
                          ? 'linear-gradient(180deg, rgba(196,145,85,0.06), transparent)'
                          : 'var(--bg-sunken)',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ marginTop: 2 }}>
                      <MedalIcon medal={a.medal} size={22} />
                    </div>
                    <div className="col" style={{ gap: 6, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontStyle: 'italic',
                          fontSize: 15,
                          lineHeight: 1.3,
                          color: 'var(--ink-1)',
                          textWrap: 'balance',
                        }}
                      >
                        {a.title}
                      </div>
                      <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: 10,
                            color: 'var(--ink-4)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {a.org}
                        </span>
                        <span
                          className="mono"
                          style={{ fontSize: 10, color: 'var(--ink-4)' }}
                        >
                          ·
                        </span>
                        <span
                          className="mono"
                          style={{ fontSize: 10, color: 'var(--ink-4)' }}
                        >
                          {a.year}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {competitions.length > 0 && (
            <div className="card card-pad">
              <div className="panel-title" style={{ marginBottom: 14 }}>
                Competitions
              </div>
              <div className="col" style={{ gap: 0 }}>
                {competitions.map((c, i) => (
                  <div
                    key={i}
                    className="row"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 0',
                      borderTop: i > 0 ? '1px solid var(--line-2)' : 'none',
                    }}
                  >
                    <div className="row" style={{ gap: 14 }}>
                      <span
                        className="mono"
                        style={{ fontSize: 11, color: 'var(--ink-4)', width: 44 }}
                      >
                        {c.year}
                      </span>
                      <span
                        style={{
                          fontSize: 14.5,
                          color: 'var(--ink-1)',
                          fontFamily: 'var(--font-display)',
                          fontStyle: 'italic',
                        }}
                      >
                        {c.name}
                      </span>
                    </div>
                    <span
                      className="pill"
                      style={{
                        fontSize: 11,
                        background: /champion|grand|winner/i.test(c.placement)
                          ? 'var(--accent-wash)'
                          : undefined,
                        color: /champion|grand|winner/i.test(c.placement)
                          ? 'var(--accent-ink)'
                          : undefined,
                        borderColor: /champion|grand|winner/i.test(c.placement)
                          ? 'transparent'
                          : undefined,
                      }}
                    >
                      {c.placement}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {career.length > 0 && (
            <div className="card card-pad">
              <div className="panel-title" style={{ marginBottom: 18 }}>
                Career timeline
              </div>
              <div style={{ position: 'relative', paddingLeft: 22 }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 7,
                    top: 6,
                    bottom: 6,
                    width: 1,
                    background: 'var(--line-1)',
                  }}
                />
                {career.map((row, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      paddingBottom: i === career.length - 1 ? 0 : 18,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: -22,
                        top: 4,
                        width: 15,
                        height: 15,
                        borderRadius: 999,
                        background: row.current ? `oklch(0.6 0.14 ${hue})` : '#fff',
                        border: `2px solid ${row.current ? `oklch(0.6 0.14 ${hue})` : 'var(--line-1)'}`,
                        boxShadow: row.current
                          ? `0 0 0 4px oklch(0.92 0.06 ${hue} / 0.6)`
                          : 'none',
                      }}
                    />
                    <div
                      className="row"
                      style={{
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 14,
                      }}
                    >
                      <div className="col" style={{ minWidth: 0 }}>
                        <div className="row gap-sm" style={{ alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: 14.5,
                              color: 'var(--ink-1)',
                              fontWeight: 500,
                            }}
                          >
                            {row.role}
                          </span>
                          {row.current && (
                            <span
                              className="pill"
                              style={{
                                fontSize: 9.5,
                                background: 'var(--accent-wash)',
                                color: 'var(--accent-ink)',
                                borderColor: 'transparent',
                              }}
                            >
                              Current
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                          {row.place}
                        </span>
                      </div>
                      <span
                        className="mono"
                        style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0 }}
                      >
                        {row.year}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card card-pad">
            <div
              className="row"
              style={{
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: 14,
              }}
            >
              <div className="col">
                <span
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    color: 'var(--ink-4)',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  In the library
                </span>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    fontSize: 26,
                  }}
                >
                  {cocktails.length}{' '}
                  {cocktails.length === 1 ? 'specification' : 'specifications'}.
                </h2>
              </div>
              {spirits.length > 0 && (
                <div
                  className="row gap-sm"
                  style={{ flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 280 }}
                >
                  {spirits.map((s) => (
                    <span key={s} className="pill" style={{ fontSize: 10 }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {cocktails.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 'var(--density-gap)',
                }}
              >
                {cocktails.map((c) => (
                  <CocktailCard key={c.id} c={c} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  color: 'var(--ink-4)',
                  fontSize: 13,
                  border: '1px dashed var(--line-1)',
                  borderRadius: 10,
                }}
              >
                No specs in the library yet.
              </div>
            )}
          </div>

          {press.length > 0 && (
            <div className="card card-pad">
              <div className="panel-title" style={{ marginBottom: 14 }}>
                In the press
              </div>
              <div className="col" style={{ gap: 0 }}>
                {press.map((p, i) => (
                  <a
                    key={i}
                    href={p.url ?? '#'}
                    target={p.url ? '_blank' : undefined}
                    rel={p.url ? 'noopener noreferrer' : undefined}
                    className="row"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 4px',
                      borderTop: i > 0 ? '1px solid var(--line-2)' : 'none',
                      color: 'inherit',
                      transition: 'background 120ms',
                    }}
                  >
                    <div className="row" style={{ gap: 14, minWidth: 0 }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: 10.5,
                          color: 'var(--ink-4)',
                          width: 48,
                          flexShrink: 0,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {p.year}
                      </span>
                      <div className="col" style={{ minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: 14,
                            fontFamily: 'var(--font-display)',
                            color: 'var(--ink-1)',
                            lineHeight: 1.3,
                          }}
                        >
                          &ldquo;{p.title}&rdquo;
                        </span>
                        <span
                          className="mono"
                          style={{
                            fontSize: 10.5,
                            color: 'var(--ink-4)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {p.outlet}
                        </span>
                      </div>
                    </div>
                    <Icon
                      name="arrow-r"
                      size={13}
                      style={{ color: 'var(--ink-4)', flexShrink: 0 }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {creator.book && (
            <div className="card card-pad" style={{ background: 'var(--bg-sunken)' }}>
              <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 52,
                    height: 68,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, oklch(0.6 0.12 ${hue}), oklch(0.4 0.14 ${hue}))`,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                  }}
                >
                  <Icon name="file" size={18} />
                </div>
                <div className="col" style={{ flex: 1, gap: 4 }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 9.5,
                      color: 'var(--ink-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                    }}
                  >
                    Published author
                  </span>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontSize: 17,
                      color: 'var(--ink-1)',
                    }}
                  >
                    {creator.book.title}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {creator.book.year}
                    {creator.book.co ? ` · with ${creator.book.co}` : ''}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
