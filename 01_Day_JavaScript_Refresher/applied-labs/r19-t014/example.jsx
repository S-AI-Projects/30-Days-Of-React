import React, { useState } from 'react'

// Three small components with explicit props.
function ProfileName({ name }) {
  return <h2 data-testid="profile-name">{name}</h2>
}

function ProfileRole({ role }) {
  return <p data-testid="profile-role">Role: {role}</p>
}

// The biography is optional: when it is missing or blank, nothing is rendered.
function ProfileBio({ bio }) {
  if (!bio) return null
  return <p data-testid="profile-bio">{bio}</p>
}

// CONTRIBUTION FOCUS (invariant): for any state, the profile shows
//   - the current name exactly once,
//   - the current role exactly once,
//   - the biography only when it is non-blank,
//   - and never the text "undefined" or "null".
export function Profile({ name, role, bio }) {
  return (
    <section data-testid="profile">
      <ProfileName name={name} />
      <ProfileRole role={role} />
      <ProfileBio bio={bio} />
    </section>
  )
}

export default function App() {
  const [state, setState] = useState({ name: 'Ada', role: 'Student', bio: '' })
  const update = (key) => (e) => setState((s) => ({ ...s, [key]: e.target.value }))

  // Blank bio -> omit the prop entirely (undefined), so nothing is shown.
  const bio = state.bio.trim() === '' ? undefined : state.bio

  return (
    <div>
      <h1>Profile composition lab</h1>
      <label>Name <input aria-label="Name" value={state.name} onChange={update('name')} /></label>
      <label>Role <input aria-label="Role" value={state.role} onChange={update('role')} /></label>
      <label>Biography <input aria-label="Biography" value={state.bio} onChange={update('bio')} /></label>
      <Profile name={state.name} role={state.role} bio={bio} />
    </div>
  )
}
