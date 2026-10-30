'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** On phones, slide up from the bottom instead of centring. */
  sheet?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** General-purpose dialog built on the native <dialog> element. */
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, description, sheet, children, footer }) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.backdrop) onClose();
      }}
    >
      <div
        data-backdrop="true"
        className={`flex h-full w-full justify-center overflow-y-auto sm:items-center sm:p-6 ${
          sheet ? 'items-end' : 'items-stretch'
        }`}
      >
        {open && (
          <div
            className={`modal-card flex w-full max-w-lg flex-col bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:rounded-lg ${
              sheet ? 'max-h-[92vh] rounded-t-xl' : 'h-full sm:h-auto'
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-text">{title}</h2>
                {description && <p className="text-[13px] text-muted">{description}</p>}
              </div>
              <button type="button" onClick={onClose} className="btn btn-ghost -mr-2 p-2" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-line bg-page/60 px-5 py-3 sm:rounded-b-lg">
                {footer}
              </div>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
};
