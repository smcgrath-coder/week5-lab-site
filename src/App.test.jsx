import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createInitialState, serialize, setStudent, updateLab } from './state/labState'

const STATE_KEY = 'mhi289a-week5-v1'
const PASSCODE_KEY = 'mhi289a-week5-passcode'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
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

describe('App — start over (shared computer)', () => {
  it('clears the previous student\'s work and returns to a fresh landing page when confirmed', async () => {
    let saved = setStudent(createInitialState(), {
      name: 'Previous Student',
      lane: 'clinical',
      acknowledgedPHI: true,
    })
    saved = updateLab(saved, 'wrapUp', { paragraph: 'previous student wrote this' })
    localStorage.setItem(STATE_KEY, serialize(saved))
    sessionStorage.setItem(PASSCODE_KEY, 'class-secret')

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText(/welcome back, previous student/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /start over/i }))

    // back on a fresh landing page, not carrying the previous student's name
    expect(screen.getByRole('button', { name: /^begin$/i })).toBeInTheDocument()
    expect(screen.queryByText(/previous student/i)).not.toBeInTheDocument()
    expect(sessionStorage.getItem(PASSCODE_KEY)).toBeFalsy()

    await waitFor(() => {
      const clearedState = JSON.parse(localStorage.getItem(STATE_KEY))
      expect(clearedState.student.name).toBe('')
      expect(clearedState.labs.wrapUp.paragraph).toBe('')
    })
  })

  it('does nothing when the student cancels the confirm dialog', async () => {
    const saved = setStudent(createInitialState(), {
      name: 'Previous Student',
      lane: 'clinical',
      acknowledgedPHI: true,
    })
    localStorage.setItem(STATE_KEY, serialize(saved))
    sessionStorage.setItem(PASSCODE_KEY, 'class-secret')

    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start over/i }))

    expect(screen.getByText(/welcome back, previous student/i)).toBeInTheDocument()
  })
})
