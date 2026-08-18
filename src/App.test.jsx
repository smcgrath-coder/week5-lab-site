import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { createInitialState, serialize, setStudent } from './state/labState'

const STATE_KEY = 'mhi289a-week5-v1'
const PASSCODE_KEY = 'mhi289a-week5-passcode'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('App', () => {
  it('renders without crashing', () => {
    expect(() => render(<App />)).not.toThrow()
  })
})

describe('App — resume path', () => {
  it('skips the landing form when a completed student profile and passcode are already saved', () => {
    const saved = setStudent(createInitialState(), {
      name: 'Rion',
      lane: 'clinical',
      acknowledgedPHI: true,
    })
    localStorage.setItem(STATE_KEY, serialize(saved))
    sessionStorage.setItem(PASSCODE_KEY, 'class-secret')

    render(<App />)

    expect(screen.queryByRole('button', { name: /^begin$/i })).not.toBeInTheDocument()
    expect(screen.getByText(/welcome back, rion/i)).toBeInTheDocument()
  })

  it('still shows landing when the saved profile has no passcode in this browser session', () => {
    const saved = setStudent(createInitialState(), {
      name: 'Rion',
      lane: 'clinical',
      acknowledgedPHI: true,
    })
    localStorage.setItem(STATE_KEY, serialize(saved))
    // no passcode in sessionStorage

    render(<App />)

    expect(screen.getByRole('button', { name: /^begin$/i })).toBeInTheDocument()
  })
})
