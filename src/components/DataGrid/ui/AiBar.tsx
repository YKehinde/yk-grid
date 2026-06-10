import React, { useRef, useState, useCallback } from 'react'
import { fetchAiCommand } from '../ai/aiClient'
import { AiCommand } from '../ai/schema'
import { ColumnDef, GridState } from '../types'
import styles from './AiBar.module.css'

interface Props<T> {
  endpoint: string
  placeholder?: string
  columns: ColumnDef<T>[]
  gridState: GridState
  onCommand: (command: AiCommand) => void
  onReset: () => void
}

type Status = 'idle' | 'loading' | 'error'

export function AiBar<T>({ endpoint, placeholder, columns, gridState, onCommand, onReset }: Props<T>) {
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [explanation, setExplanation] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = prompt.trim()
    if (!trimmed || status === 'loading') return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('loading')
    setExplanation(null)
    setErrorMsg(null)

    try {
      const command = await fetchAiCommand(endpoint, trimmed, columns, gridState, controller.signal)
      onCommand(command)
      setExplanation(command.explanation)
      setStatus('idle')
      setPrompt('')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setErrorMsg((err as Error).message ?? 'Request failed')
      setStatus('error')
    }
  }, [prompt, status, endpoint, columns, gridState, onCommand])

  return (
    <div className={styles.aiBar}>
      <form className={styles.form} onSubmit={handleSubmit} role="search">
        <span className={styles.icon} aria-hidden="true">✦</span>
        <input
          className={styles.input}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder ?? 'Ask the grid… e.g. "show completed orders over £500"'}
          disabled={status === 'loading'}
          aria-label="AI grid command"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!prompt.trim() || status === 'loading'}
          aria-label="Send AI command"
        >
          {status === 'loading' ? (
            <span className={styles.spinner} aria-hidden="true" />
          ) : (
            'Ask'
          )}
        </button>
      </form>

      {explanation && status === 'idle' && (
        <div className={styles.resultRow}>
          <p className={styles.explanation} role="status" aria-live="polite">
            {explanation}
          </p>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => { setExplanation(null); onReset() }}
          >
            Clear
          </button>
        </div>
      )}

      {errorMsg && status === 'error' && (
        <p className={styles.error} role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  )
}
