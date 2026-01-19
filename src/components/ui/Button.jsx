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
    className = ''
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
        >
            {loading ? (
                <span className="btn-spinner"></span>
            ) : icon ? (
                <span className="btn-icon">{icon}</span>
            ) : null}
            <span className="btn-text">{children}</span>
        </button>
    )
}

export default Button
