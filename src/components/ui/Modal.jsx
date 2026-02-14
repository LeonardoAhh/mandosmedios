import { useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    className = ''
}) => {
    const modalRef = useRef(null)
    const previousFocusRef = useRef(null)

    // Trap de foco y cierre con Escape
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose()
            return
        }

        if (e.key === 'Tab' && modalRef.current) {
            const focusable = modalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            const first = focusable[0]
            const last = focusable[focusable.length - 1]

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault()
                    last?.focus()
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault()
                    first?.focus()
                }
            }
        }
    }, [onClose])

    // Click en overlay para cerrar
    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }, [onClose])

    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement
            document.body.style.overflow = 'hidden'
            document.addEventListener('keydown', handleKeyDown)

            // Focus al modal después de renderizar
            requestAnimationFrame(() => {
                const firstFocusable = modalRef.current?.querySelector(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
                firstFocusable?.focus()
            })
        }

        return () => {
            document.body.style.overflow = ''
            document.removeEventListener('keydown', handleKeyDown)

            // Restaurar foco al cerrar
            if (previousFocusRef.current) {
                previousFocusRef.current.focus()
            }
        }
    }, [isOpen, handleKeyDown])

    if (!isOpen) return null

    const classes = [
        'modal-container',
        `modal-${size}`,
        className
    ].filter(Boolean).join(' ')

    return createPortal(
        <div
            className="modal-overlay"
            onClick={handleOverlayClick}
            role="presentation"
        >
            <div
                ref={modalRef}
                className={classes}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {title && (
                    <div className="modal-header">
                        <h2 id="modal-title" className="modal-title">{title}</h2>
                        <button
                            type="button"
                            className="modal-close-btn"
                            onClick={onClose}
                            aria-label="Cerrar diálogo"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                )}
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    )
}

export default Modal
