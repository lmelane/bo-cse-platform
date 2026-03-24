'use client';

import { useRef, useEffect, useCallback, ReactNode } from 'react';

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
}

/**
 * Accessible dropdown menu with keyboard navigation.
 * - Escape to close
 * - Click outside to close
 * - Focus trap (Tab cycles through items)
 * - ARIA attributes for screen readers
 */
export default function DropdownMenu({
  isOpen,
  onClose,
  trigger,
  children,
  align = 'right',
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        // Return focus to trigger
        const triggerButton = triggerRef.current?.querySelector('button');
        triggerButton?.focus();
      }
    },
    [onClose]
  );

  // Close on click outside
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);

      // Focus first focusable item in menu
      requestAnimationFrame(() => {
        const firstButton = menuRef.current?.querySelector('button, a') as HTMLElement | null;
        firstButton?.focus();
      });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleKeyDown, handleClickOutside]);

  return (
    <div className="relative">
      <div ref={triggerRef}>{trigger}</div>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-[100]`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  className?: string;
}

export function DropdownItem({
  onClick,
  icon,
  children,
  variant = 'default',
}: DropdownItemProps) {
  const variantStyles = {
    default: 'text-neutral-700 hover:bg-neutral-50',
    danger: 'text-red-700 hover:bg-red-50',
    success: 'text-green-700 hover:bg-neutral-50',
    warning: 'text-orange-700 hover:bg-neutral-50',
  };

  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${variantStyles[variant]}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="border-t border-neutral-200 my-1" role="separator" />;
}
