import './Card.css'

const Card = ({
    children,
    title,
    subtitle,
    icon,
    variant = 'default',
    padding = 'md',
    className = '',
    onClick
}) => {
    const classes = [
        'card',
        `card-${variant}`,
        `card-p-${padding}`,
        onClick && 'card-clickable',
        className
    ].filter(Boolean).join(' ')

    return (
        <div className={classes} onClick={onClick}>
            {(title || icon) && (
                <div className="card-header">
                    {icon && <span className="card-icon">{icon}</span>}
                    <div className="card-header-text">
                        {title && <h3 className="card-title">{title}</h3>}
                        {subtitle && <p className="card-subtitle">{subtitle}</p>}
                    </div>
                </div>
            )}
            <div className="card-content">
                {children}
            </div>
        </div>
    )
}

export default Card
