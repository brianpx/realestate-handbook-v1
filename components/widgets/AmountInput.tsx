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
  const [current, setCurrent] = useState<number | undefined>(undefined);
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
          setCurrent(next.value);
          onValue(next.value);
        }}
        onBlur={() => { if (format && current !== undefined) setText(format(current)); }}
      />
      <div className="calc-error" id={errorId}>{message}</div>
    </>
  );
}
