import type { ChangeEvent, ReactNode } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
  iconSize?: number;
  id?: string;
  name?: string;
  disabled?: boolean;
  rightElement?: ReactNode;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = 'relative',
  inputClassName = 'w-full border border-zinc-200 text-xs focus:outline-none focus:border-black transition-all',
  iconClassName = 'absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400',
  iconSize = 13,
  id,
  name,
  disabled = false,
  rightElement,
}: SearchInputProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={className}>
      <span className={iconClassName}>
        <Search size={iconSize} />
      </span>
      <input
        id={id}
        name={name}
        type="text"
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={inputClassName}
      />
      {rightElement}
    </div>
  );
};
