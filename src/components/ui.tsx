import { useEffect, useId, useState, type ReactNode } from 'react'
import { formatNumber } from '../lib/format'

export type ToastState = { msg: string; kind?: 'ok' | 'error'; actionLabel?: string; onAction?: () => void } | null

export function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onClose, toast.onAction ? 5000 : 2800)
    return () => clearTimeout(t)
  }, [toast, onClose])
  if (!toast) return null
  return (
    <div className={`toast ${toast.kind === 'error' ? 'toast-error' : ''}`} role="status" aria-live="polite">
      <span>{toast.msg}</span>
      {toast.onAction && (
        <button
          className="toast-action"
          onClick={() => {
            toast.onAction?.()
            onClose()
          }}
        >
          {toast.actionLabel}
        </button>
      )}
    </div>
  )
}

export function Dialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])
  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div>{children}</div>
        <div className="btn-row end">
          <button className="btn" onClick={onCancel}>
            Huỷ
          </button>
          <button className="btn btn-primary" onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Ô nhập số nguyên: báo lỗi ngay dưới ô, chỉ cập nhật giá trị khi hợp lệ. */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  min = 0,
  max = 1_000_000_000,
  seedValue,
  warning,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  unit?: string
  min?: number
  max?: number
  /** Giá trị BTC — có thì hiện nhãn "Đã chỉnh" + nút ↺ */
  seedValue?: number
  warning?: string | null
}) {
  const id = useId()
  const [draft, setDraft] = useState(String(value))
  const [error, setError] = useState<string | null>(null)

  const [lastValue, setLastValue] = useState(value)
  if (lastValue !== value) {
    // Giá trị đổi từ bên ngoài (nạp mẫu, ↺) → đồng bộ ô nhập
    setLastValue(value)
    if (!(Number(draft) === value && draft.trim() !== '')) setDraft(String(value))
    setError(null)
  }

  const validate = (s: string): string | null => {
    const t = s.trim()
    if (t === '') return 'Vui lòng nhập số.'
    if (!/^\d+$/.test(t)) return 'Chỉ nhập số nguyên, không dấu chấm/phẩy.'
    const n = Number(t)
    if (n < min) return `Tối thiểu ${formatNumber(min)}${unit ? ' ' + unit : ''}.`
    if (n > max) return `Tối đa ${formatNumber(max)}${unit ? ' ' + unit : ''}.`
    return null
  }

  const changed = seedValue !== undefined && value !== seedValue
  return (
    <div className={`field ${error ? 'invalid' : ''} ${changed ? 'changed' : ''}`}>
      <label htmlFor={id}>
        {label}{' '}
        {seedValue !== undefined &&
          (changed ? <span className="badge changed">Đã chỉnh</span> : <span className="badge">BTC</span>)}
      </label>
      <div className="control">
        <input
          id={id}
          inputMode="numeric"
          value={draft}
          aria-invalid={!!error}
          onChange={(e) => {
            const s = e.target.value
            setDraft(s)
            const err = validate(s)
            setError(err)
            if (!err) onChange(Number(s.trim()))
          }}
        />
        {unit && <span className="unit">{unit}</span>}
        {changed && (
          <button
            className="btn btn-icon"
            aria-label={`Trả ${label} về giá trị BTC ${formatNumber(seedValue)}`}
            title={`Về giá trị BTC: ${formatNumber(seedValue)}`}
            onClick={() => onChange(seedValue)}
          >
            ↺
          </button>
        )}
      </div>
      {error && <span className="error">{error}</span>}
      {!error && changed && <span className="hint">BTC: {formatNumber(seedValue)}{unit ? ' ' + unit : ''}</span>}
      {!error && warning && <span className="warning">{warning}</span>}
    </div>
  )
}

export function How({ children, title = 'Cách tính' }: { children: ReactNode; title?: string }) {
  return (
    <details className="how">
      <summary>{title}</summary>
      <div className="how-body">{children}</div>
    </details>
  )
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="progress-bar" style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Ô nhập chữ (tên sản phẩm/khoản chi): không trống, tối đa maxLen ký tự. */
export function TextField({
  label,
  value,
  onChange,
  seedValue,
  maxLen = 40,
}: {
  label: string
  value: string
  onChange: (s: string) => void
  seedValue?: string
  maxLen?: number
}) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  if (lastValue !== value) {
    setLastValue(value)
    if (draft.trim() !== value) setDraft(value)
    setError(null)
  }
  const changed = seedValue !== undefined && value !== seedValue
  return (
    <div className={`field ${error ? 'invalid' : ''} ${changed ? 'changed' : ''}`}>
      <label htmlFor={id}>
        {label} {seedValue === undefined ? <span className="badge changed">Đội thêm</span> : changed ? <span className="badge changed">Đã chỉnh</span> : <span className="badge">BTC</span>}
      </label>
      <input
        id={id}
        value={draft}
        maxLength={maxLen + 10}
        aria-invalid={!!error}
        onChange={(e) => {
          const s = e.target.value
          setDraft(s)
          const t = s.trim()
          const err = t === '' ? 'Vui lòng nhập tên.' : t.length > maxLen ? `Tối đa ${maxLen} ký tự.` : null
          setError(err)
          if (!err) onChange(t)
        }}
      />
      {error && <span className="error">{error}</span>}
    </div>
  )
}

/** Thanh trượt số nguyên, có nhãn BTC/Đã chỉnh. */
export function Slider({
  label,
  value,
  min,
  max,
  unit,
  seedValue,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  seedValue?: number
  onChange: (n: number) => void
}) {
  const id = useId()
  const changed = seedValue !== undefined && value !== seedValue
  return (
    <div className={`field slider ${changed ? 'changed' : ''}`}>
      <label htmlFor={id} className="row-between">
        <span>
          {label} {seedValue !== undefined && (changed ? <span className="badge changed">Đã chỉnh</span> : <span className="badge">BTC</span>)}
        </span>
        <b className="slider-value">
          {formatNumber(value)} {unit}
        </b>
      </label>
      <input id={id} type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}
