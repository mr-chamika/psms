import React from "react";

type ModalProps = {
  show: boolean;
  setShow: (value: boolean) => void;
  children: React.ReactNode;
  /** When false, clicking the backdrop does not close the modal. Defaults to true. */
  closeOnBackdropClick?: boolean;
};

export default function Modal({
  show,
  setShow,
  children,
  closeOnBackdropClick = true,
}: ModalProps) {

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/70"
            role="dialog"
            aria-modal="true"
            onClick={closeOnBackdropClick ? () => setShow(false) : undefined}
        >
            <div className="flex min-h-screen w-full items-center justify-center p-4">
                <div
                    className="w-full max-h-[calc(100vh-2rem)] overflow-auto flex justify-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    {children}
                </div>
            </div>
        </div>
    )

}