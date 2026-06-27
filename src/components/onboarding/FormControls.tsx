import { useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

type BaseFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  helperText?: string;
};

export function FieldLabel({ id, label, required }: BaseFieldProps) {
  return (
    <label htmlFor={id} className="font-label-md text-label-md text-on-surface leading-tight">
      {label} {required && <span className="text-error">*</span>}
    </label>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  required,
  helperText,
  placeholder,
  type = "text",
  disabled = false,
  canTogglePassword = type === "password",
  autoComplete,
  name,
}: BaseFieldProps & {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  canTogglePassword?: boolean;
  autoComplete?: string;
  name?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = canTogglePassword && type === "password" && showPassword ? "text" : type;

  return (
    <div className="flex flex-col gap-xs">
      <FieldLabel id={id} label={label} required={required} />
      {helperText && <p className="text-xs leading-snug text-on-surface-variant">{helperText}</p>}
      <div className="relative">
        <input
          id={id}
          name={name || id}
          type={inputType}
          value={value}
          min={type === "number" ? 0 : undefined}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-surface-bright border border-outline-variant rounded-DEFAULT px-md py-2 pr-10 font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors disabled:bg-surface-container-low disabled:text-outline disabled:cursor-not-allowed"
        />
        {canTogglePassword && type === "password" && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-0 px-sm flex items-center text-outline hover:text-on-surface transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  required,
  helperText,
  placeholder,
  rows = 4,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <FieldLabel id={id} label={label} required={required} />
      {helperText && <p className="text-xs leading-snug text-on-surface-variant">{helperText}</p>}
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y bg-surface-bright border border-outline-variant rounded-DEFAULT px-md py-2 font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
      />
    </div>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required,
  helperText,
  placeholder = "Select an option",
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <FieldLabel id={id} label={label} required={required} />
      {helperText && <p className="text-xs leading-snug text-on-surface-variant">{helperText}</p>}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-surface-bright border border-outline-variant rounded-DEFAULT px-md py-2 pr-10 font-body-md text-on-surface appearance-none focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors cursor-pointer"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
          expand_more
        </span>
      </div>
    </div>
  );
}

export function OptionCards({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; description: string; icon: string }[];
}) {
  return (
    <div className="flex flex-col gap-xs">
      <span className="font-label-md text-label-md text-on-surface">{label}</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-sm">
        {options.map((option) => {
          const selected = value === option.label;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.label)}
              className={cn(
                "h-full text-left bg-surface-bright border rounded-lg p-sm flex flex-col gap-xs transition-colors",
                selected ? "border-primary bg-surface ring-1 ring-primary" : "border-outline-variant hover:bg-surface-container"
              )}
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    "w-7 h-7 rounded flex items-center justify-center material-symbols-outlined text-[18px]",
                    selected ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"
                  )}
                  style={{ fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {option.icon}
                </span>
                <span
                  className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center",
                    selected ? "border-primary bg-primary" : "border-outline-variant"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full bg-on-primary", selected ? "opacity-100" : "opacity-0")} />
                </span>
              </div>
              <span>
                <span className="block font-label-md text-label-md text-on-surface">{option.label}</span>
                <span className="block text-xs leading-snug text-on-surface-variant mt-base">{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MultiSelectChips({
  label,
  options,
  values,
  onChange,
  helperText,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  helperText?: string;
}) {
  const toggle = (option: string) => {
    onChange(values.includes(option) ? values.filter((item) => item !== option) : [...values, option]);
  };

  return (
    <div className="flex flex-col gap-xs">
      <span className="font-label-md text-label-md text-on-surface">{label}</span>
      {helperText && <p className="text-xs leading-snug text-on-surface-variant">{helperText}</p>}
      <div className="flex flex-wrap gap-xs max-h-[148px] overflow-y-auto rounded-lg border border-outline-variant bg-surface-bright p-sm">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              "px-sm py-base rounded-full border transition-colors font-label-sm text-label-sm cursor-pointer",
              values.includes(option)
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant bg-surface-bright text-on-surface hover:bg-surface-container-high"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TagInput({
  id,
  label,
  values,
  onChange,
  suggestions = [],
  helperText,
  placeholder = "Type and press Enter...",
}: BaseFieldProps & {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(values.filter((item) => item !== tag));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(input);
    }
  };

  return (
    <div className="flex flex-col gap-xs">
      <FieldLabel id={id} label={label} />
      {helperText && <p className="text-xs leading-snug text-on-surface-variant">{helperText}</p>}
      <div className="w-full min-h-[86px] bg-surface-bright border border-outline-variant rounded-DEFAULT p-sm focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-colors flex flex-col gap-xs">
        <div className="flex flex-wrap gap-xs">
          {values.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-base px-sm py-base rounded-md bg-surface-container-high text-on-surface font-label-sm text-label-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="material-symbols-outlined text-[14px] text-on-surface-variant hover:text-error transition-colors"
              >
                close
              </button>
            </span>
          ))}
        </div>
        <input
          id={id}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(input)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none p-0 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:ring-0 focus:outline-none"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-xs">
          {suggestions
            .filter((suggestion) => !values.includes(suggestion))
            .slice(0, 12)
            .map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className="px-sm py-base rounded-full border border-outline-variant bg-surface text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                + {suggestion}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
