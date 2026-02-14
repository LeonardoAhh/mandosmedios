import './Button.css'

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    loading = false,
    icon,
    onClick,
    type = 'button',
    className = '',
    ariaLabel
}) => {
    const classes = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth && 'btn-full',
        loading && 'btn-loading',
        className
    ].filter(Boolean).join(' ')

    return (
        <button
            type={type}
            className={classes}
            onClick={onClick}
            disabled={disabled || loading}
            aria-label={ariaLabel}
            aria-busy={loading || undefined}
        >
            {loading ? (
                <span className="btn-spinner" aria-hidden="true"></span>
            ) : icon ? (
                <span className="btn-icon" aria-hidden="true">{icon}</span>
            ) : null}
            <span className="btn-text">{children}</span>
        </button>
    )
}

export default Button
