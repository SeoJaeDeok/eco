import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> {
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = ({
  children,
  type = 'button',
  className,
  ariaLabel,
  leftIcon,
  rightIcon,
  'aria-label': nativeAriaLabel,
  ...buttonProps
}: ButtonProps) => {
  return (
    <button
      {...buttonProps}
      type={type}
      className={className}
      aria-label={ariaLabel ?? nativeAriaLabel}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
};
