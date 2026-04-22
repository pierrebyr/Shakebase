import type { Medal } from '@/components/cocktail/MedalIcon'

export type Award = { year: number; title: string; org: string; medal: Medal }
export type Competition = { year: number; name: string; placement: string }
export type Certification = { name: string; year: number; issuer: string }
export type CareerRow = { year: string; role: string; place: string; current?: boolean }
export type PressItem = { outlet: string; title: string; year: number; url?: string }
export type Book = { title: string; year: number; co?: string }
export type Socials = { instagram?: string; linkedin?: string; website?: string }

export type CreatorRow = {
  id: string
  name: string
  role: string | null
  venue: string | null
  city: string | null
  country: string | null
  joined_year: string | null
  bio: string | null
  photo_url: string | null
  pronouns: string | null
  signature: string | null
  philosophy: string | null
  avatar_hue: number | null
  specialties: string[] | null
  languages: string[] | null
  mentors: string[] | null
  awards: Award[] | null
  competitions: Competition[] | null
  certifications: Certification[] | null
  career: CareerRow[] | null
  press: PressItem[] | null
  book: Book | null
  socials: Socials | null
}
