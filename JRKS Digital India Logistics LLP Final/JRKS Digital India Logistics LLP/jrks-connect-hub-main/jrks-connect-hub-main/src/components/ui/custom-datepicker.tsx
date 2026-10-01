import * as React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface CustomDatePickerProps {
  value: string; // stored as yyyy-mm-dd (ISO)
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  required?: boolean;
  id?: string;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/** Convert "yyyy-mm-dd" → "dd-mm-yyyy" for display */
function isoToDmy(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3 || parts[0].length !== 4) return "";
  const [y, m, d] = parts;
  return `${d}-${m}-${y}`;
}

/** Convert "dd-mm-yyyy" digits → "yyyy-mm-dd". Returns "" if invalid/incomplete. */
function digitsToIso(digits: string): string {
  if (digits.length !== 8) return "";
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  const di = parseInt(d, 10);
  const mi = parseInt(m, 10);
  const yi = parseInt(y, 10);
  if (mi < 1 || mi > 12) return "";
  if (di < 1 || di > 31) return "";
  if (yi < 1900 || yi > 2100) return "";
  const date = new Date(yi, mi - 1, di);
  if (date.getFullYear() !== yi || date.getMonth() + 1 !== mi || date.getDate() !== di) {
    return "";
  }
  return `${y}-${m}-${d}`;
}

/**
 * Build the masked display string from a digit-only string (max 8 chars).
 * Eagerly appends trailing dash after 2 or 4 digits so the user sees:
 *   1     → "1"
 *   13    → "13-"
 *   130   → "13-0"
 *   1306  → "13-06-"
 *   13062 → "13-06-2"
 *   ...   → "13-06-2026"
 */
function buildMask(digits: string): string {
  const d = digits.slice(0, 8);
  let result = "";
  for (let i = 0; i < d.length; i++) {
    if (i === 2 || i === 4) result += "-";
    result += d[i];
  }
  // Eagerly append trailing dash when cursor is exactly at a separator boundary
  if (d.length === 2 || d.length === 4) {
    result += "-";
  }
  return result;
}

/** Extract only digit characters from a masked string */
function extractDigits(masked: string): string {
  return masked.replace(/\D/g, "");
}

export function CustomDatePicker({
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
  error,
  required,
  id,
  tabIndex,
  onKeyDown,
}: CustomDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Local display state in masked DD-MM-YYYY format
  const [mask, setMask] = React.useState<string>(() => isoToDmy(value));

  // Track previous mask to detect deletion across dashes
  const prevMaskRef = React.useRef<string>(isoToDmy(value));

  // Track local edits to avoid overwriting mask when parent updates temporarily to empty
  const isLocalChangeRef = React.useRef(false);

  // Sync with external value changes (e.g., form reset / edit load)
  React.useEffect(() => {
    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false;
      return;
    }
    const expected = isoToDmy(value);
    setMask(expected);
    prevMaskRef.current = expected;
  }, [value]);

  /** Calendar date object derived from ISO value */
  const calendarDate = React.useMemo<Date | undefined>(() => {
    if (!value) return undefined;
    try {
      const d = new Date(value + "T00:00:00");
      return isNaN(d.getTime()) ? undefined : d;
    } catch {
      return undefined;
    }
  }, [value]);

  /** Handle keyboard input with eager masking + smart backspace */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawNew = e.target.value;
    const prevMask = prevMaskRef.current;

    let digits: string;

    const isDeleting = rawNew.length < prevMask.length;

    if (isDeleting) {
      // User is deleting. If the previous mask had a trailing dash and they just
      // removed it, also remove the preceding digit so backspace feels natural.
      if (prevMask.endsWith("-") && !rawNew.endsWith("-")) {
        // They deleted a dash → remove the digit before it too
        digits = extractDigits(rawNew).slice(0, -1);
      } else {
        digits = extractDigits(rawNew);
      }
    } else {
      // User is typing — strip any non-digits pasted or typed
      digits = extractDigits(rawNew).slice(0, 8);
    }

    const newMask = buildMask(digits);
    prevMaskRef.current = newMask;
    setMask(newMask);

    // Emit ISO value only when exactly 8 digits form a valid date
    const iso = digitsToIso(digits);
    isLocalChangeRef.current = true;
    onChange(iso);
  };

  /** Calendar date selection */
  const handleCalendarSelect = (date: Date | undefined) => {
    isLocalChangeRef.current = true;
    if (!date) {
      onChange("");
      setMask("");
      prevMaskRef.current = "";
    } else {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const iso = `${y}-${m}-${d}`;
      const dmy = `${d}-${m}-${y}`;
      onChange(iso);
      setMask(dmy);
      prevMaskRef.current = dmy;
    }
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  /** Forward key events (ENTER nav) to parent ERP keyboard handler */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const digits = extractDigits(mask);
  const isComplete = digits.length === 8;
  const isValid = !isComplete || digitsToIso(digits) !== "";
  const showError = error || (isComplete && !isValid);

  return (
    <div className="relative w-full">
      {/* ── Input wrapper ── */}
      <div
        className={cn(
          "flex h-10 w-full items-center rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all duration-200",
          "focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/10",
          showError && "border-red-500 focus-within:ring-red-500/10 focus-within:border-red-600",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          tabIndex={tabIndex}
          type="text"
          inputMode="numeric"
          value={mask}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={10} // "DD-MM-YYYY" = 10 chars
          className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-medium min-w-0"
          aria-label="Date input DD-MM-YYYY"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Clear button */}
        {mask && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              isLocalChangeRef.current = true;
              onChange("");
              setMask("");
              prevMaskRef.current = "";
              inputRef.current?.focus();
            }}
            className="mr-1 flex-shrink-0 text-slate-350 hover:text-slate-500 transition-colors"
            aria-label="Clear date"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Calendar icon / popover */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              tabIndex={-1}
              className="flex-shrink-0 text-[#2563eb] opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Open calendar picker"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="w-auto p-3.5 bg-white shadow-elevated border border-slate-200 rounded-2xl z-50"
            align="start"
            side="bottom"
            sideOffset={6}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Calendar
              mode="single"
              selected={calendarDate}
              onSelect={handleCalendarSelect}
              defaultMonth={calendarDate}
              initialFocus
            />

            {/* Footer: Clear / Today */}
            <div className="flex justify-between border-t border-slate-100 pt-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setMask("");
                  prevMaskRef.current = "";
                  setOpen(false);
                }}
                className="text-xs font-extrabold uppercase tracking-wider text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const y = today.getFullYear();
                  const m = String(today.getMonth() + 1).padStart(2, "0");
                  const d = String(today.getDate()).padStart(2, "0");
                  const iso = `${y}-${m}-${d}`;
                  const dmy = `${d}-${m}-${y}`;
                  onChange(iso);
                  setMask(dmy);
                  prevMaskRef.current = dmy;
                  setOpen(false);
                }}
                className="text-xs font-extrabold uppercase tracking-wider text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
              >
                Today
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Validation hint */}
      {isComplete && !isValid && (
        <p className="text-[10px] font-bold text-red-500 mt-0.5 pl-1">
          Invalid date — use DD-MM-YYYY
        </p>
      )}
    </div>
  );
}
