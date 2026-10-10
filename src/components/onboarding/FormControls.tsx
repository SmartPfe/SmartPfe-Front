import { useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { DisplayOption } from "@/lib/onboardingOptions";

type BaseFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  helperText?: string;
};

export function FieldLabel({ id, label, required }: BaseFieldProps) {
  return (
    <label htmlFor={id} className="text-xs font-semibold text-on-surface flex items-center gap-1 mb-1.5">
      <span>{label}</span>
      {required && <span className="text-error font-bold">*</span>}
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
  const { t } = useTranslation("onboarding");
  const [showPassword, setShowPassword] = useState(false);
  const inputType = canTogglePassword && type === "password" && showPassword ? "text" : type;

  return (
    <div className="flex flex-col w-full">
      <FieldLabel id={id} label={label} required={required} />
      {helperText && <p className="text-xs text-on-surface-variant mb-1.5 leading-relaxed">{helperText}</p>}
      <div className="relative w-full">
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
          className="w-full h-10 rounded-xl border border-outline-variant/80 bg-surface px-3.5 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all disabled:bg-surface-container-low disabled:text-outline disabled:cursor-not-allowed"
        />
        {canTogglePassword && type === "password" && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-outline-variant hover:text-on-surface transition-colors cursor-pointer"
            aria-label={showPassword ? t("controls.hidePassword") : t("controls.showPassword")}
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
    <div className="flex flex-col w-full">
      <FieldLabel id={id} label={label} required={required} />
      {helperText && <p className="text-xs text-on-surface-variant mb-1.5 leading-relaxed">{helperText}</p>}
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-outline-variant/80 bg-surface p-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-y"
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
  placeholder,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  options: Array<string | DisplayOption>;
  placeholder?: string;
}) {
  const { t } = useTranslation("onboarding");
  return (
    <div className="flex flex-col w-full">
      <FieldLabel id={id} label={label} required={required} />
      {helperText && <p className="text-xs text-on-surface-variant mb-1.5 leading-relaxed">{helperText}</p>}
      <div className="relative w-full">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full h-10 appearance-none rounded-xl border border-outline-variant/80 bg-surface px-3.5 pr-9 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all cursor-pointer"
          style={{ WebkitAppearance: "none", MozAppearance: "none" }}
        >
          <option value="" disabled>
            {placeholder ?? t("controls.selectOption")}
          </option>
          {options.map((option) => {
            const optVal = typeof option === "string" ? option : option.value;
            const optLbl = typeof option === "string" ? option : option.label;
            return (
              <option key={optVal} value={optVal} className="bg-surface text-on-surface py-1">
                {optLbl}
              </option>
            );
          })}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-on-surface-variant">
          <svg className="w-4 h-4 text-on-surface-variant/70 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
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
  options: { value: string; label: string; description: string; icon: string }[];
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-xs font-semibold text-on-surface">{label}</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={cn(
                "h-full text-left rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all duration-150 cursor-pointer border",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-2xs"
                  : "border-outline-variant/70 bg-surface hover:bg-surface-container hover:border-outline-variant"
              )}
            >
              <div className="flex justify-between items-center w-full">
                <span
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center material-symbols-outlined text-[19px] transition-colors",
                    selected ? "bg-primary text-on-primary shadow-2xs" : "bg-surface-container-high text-on-surface"
                  )}
                  style={{ fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {option.icon}
                </span>
                <span
                  className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                    selected ? "border-primary bg-primary text-on-primary" : "border-outline-variant/80"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full bg-white", selected ? "opacity-100" : "opacity-0")} />
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-on-surface tracking-tight">{option.label}</span>
                <span className="block text-[11px] leading-relaxed text-on-surface-variant mt-1">{option.description}</span>
              </div>
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
  options: Array<string | DisplayOption>;
  values: string[];
  onChange: (values: string[]) => void;
  helperText?: string;
}) {
  const [search, setSearch] = useState("");
  const isSearchable = options.length > 8;

  const toggle = (option: string) => {
    onChange(values.includes(option) ? values.filter((item) => item !== option) : [...values, option]);
  };

  const filteredOptions = options.filter((option) => {
    if (!search.trim()) return true;
    const lbl = typeof option === "string" ? option : option.label;
    return lbl.toLowerCase().includes(search.toLowerCase().trim());
  });

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-on-surface">{label}</span>
        {values.length > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {values.length} selected
          </span>
        )}
      </div>
      {helperText && <p className="text-xs leading-relaxed text-on-surface-variant">{helperText}</p>}

      {/* Optional Quick Search for long lists */}
      {isSearchable && (
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search / filter..."
            className="w-full h-8 px-3 pr-8 rounded-lg border border-outline-variant/70 bg-surface text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs cursor-pointer"
            >
              ×
            </button>
          ) : (
            <svg
              className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      )}

      {/* Tag Chips Container */}
      <div
        className={cn(
          "flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-outline-variant/70 bg-surface-container-low/40 transition-colors",
          isSearchable ? "max-h-52 overflow-y-auto" : ""
        )}
      >
        {filteredOptions.length === 0 ? (
          <div className="w-full py-4 text-center text-xs text-on-surface-variant">
            No matches found for "{search}"
          </div>
        ) : (
          filteredOptions.map((option) => {
            const val = typeof option === "string" ? option : option.value;
            const lbl = typeof option === "string" ? option : option.label;
            const isSelected = values.includes(val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => toggle(val)}
                aria-pressed={isSelected}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none",
                  isSelected
                    ? "bg-primary text-on-primary shadow-2xs hover:bg-primary/90"
                    : "bg-surface hover:bg-surface-container-high/80 border border-outline-variant/80 text-on-surface hover:border-outline-variant"
                )}
              >
                {isSelected ? (
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant shrink-0" />
                )}
                <span>{lbl}</span>
              </button>
            );
          })
        )}
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
  placeholder,
}: BaseFieldProps & {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const { t } = useTranslation("onboarding");
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
    <div className="flex flex-col gap-2 w-full">
      <FieldLabel id={id} label={label} />
      {helperText && <p className="text-xs leading-relaxed text-on-surface-variant">{helperText}</p>}
      <div className="w-full min-h-[80px] bg-surface border border-outline-variant/80 rounded-xl p-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {values.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface text-xs font-medium"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-on-surface-variant hover:text-error transition-colors cursor-pointer text-xs"
                aria-label={t("controls.removeTag", { tag })}
                title={t("controls.removeTag", { tag })}
              >
                ×
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
          placeholder={placeholder ?? t("controls.tagPlaceholder")}
          className="flex-1 bg-transparent border-none p-1 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0 focus:outline-none"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions
            .filter((suggestion) => !values.includes(suggestion))
            .slice(0, 12)
            .map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className="px-2.5 py-1 rounded-lg border border-outline-variant/70 bg-surface text-on-surface-variant text-xs hover:bg-surface-container-high hover:text-on-surface transition-all cursor-pointer"
              >
                + {suggestion}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
