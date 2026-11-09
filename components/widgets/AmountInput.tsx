'use client';

import { useId, useState } from 'react';
import { checkAmount, type AmountBounds } from '@/lib/amount';

type Props = AmountBounds & {
  /** For a <label htmlFor> that sits apart from the input. */
  id?: string;
  /** aria-label, for inputs that sit in a table cell; omit when a wrapping <label> names the field. */
  label?: string;
  value: number | undefined;
  onValue: (value: number | undefined) => void;
  className?: string;
  placeholder?: string;
  /** Shown for a valid number when the field is first drawn and on blur, for example thousands separators. */
  format?: (n: number) => string;
};

// What the reader typed is kept as typed (even "$1,500" or a half-finished entry) until they edit it again;
// only the parsed number is stored. `value` is what shows before the reader types anything.
export function AmountInput({ id, label, value, onValue, className = 'calc-input', placeholder, format, ...bounds }: Props) {
  const [text, setText] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  // The number this input last reported, or was last given. A `value` that differs came from somewhere else (a
  // preset, a clear, a removed row), so what was typed here no longer describes it and the new value is shown.
  const [expected, setExpected] = useState(value);
  if (value !== expected) {
    setExpected(value);
    setText(null);
    setMessage('');
  }
  const errorId = useId();
  const shown = (n: number) => (format ? format(n) : String(n));
  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={className}
        aria-label={label}
        aria-invalid={Boolean(message)}
        aria-describedby={message ? errorId : undefined}
        placeholder={placeholder}
        value={text ?? (value === undefined ? '' : shown(value))}
        onChange={e => {
          const next = checkAmount(e.target.value, bounds);
          setText(e.target.value);
          setMessage(next.message);
          setExpected(next.value);
          onValue(next.value);
        }}
        onBlur={() => { if (format && text !== null && expected !== undefined) setText(format(expected)); }}
      />
      <div className="calc-error" id={errorId}>{message}</div>
    </>
  );
}
