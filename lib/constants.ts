export const ROLES = ['owner', 'editor', 'viewer'] as const
export type Role = (typeof ROLES)[number]

export const SUBSCRIPTION_STATUSES = [
  'pending_payment',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'frozen',
  'gifted',
] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export const TRIAL_DAYS = 14
export const FREEZE_GRACE_DAYS = 3

export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/
