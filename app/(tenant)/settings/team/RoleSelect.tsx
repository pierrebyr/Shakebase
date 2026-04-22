'use client'

// Client wrapper around the role <select>. Must be a client component so it
// can attach an onChange handler — server components can't pass functions
// as props. Submitting the parent form on change is what triggers the
// changeRoleAction server action.
export function RoleSelect({
  membershipId,
  role,
  options,
  style,
}: {
  membershipId: string
  role: string
  options: { value: string; label: string }[]
  style?: React.CSSProperties
}) {
  return (
    <>
      <input type="hidden" name="membership_id" value={membershipId} />
      <select
        name="role"
        defaultValue={role}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        style={style}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </>
  )
}
