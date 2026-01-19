import './Input.css'

const Input = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    required = false,
    disabled = false,
    icon,
    id,
    name,
    autoComplete
}) => {
    const inputId = id || name || label?.toLowerCase().replace(/\s/g, '-')

    return (
        <div className={`input-group ${error ? 'input-error' : ''}`}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                    {required && <span className="input-required">*</span>}
                </label>
            )}
            <div className="input-wrapper">
                {icon && <span className="input-icon">{icon}</span>}
                <input
                    id={inputId}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    autoComplete={autoComplete}
                    className={`input ${icon ? 'input-with-icon' : ''}`}
                />
            </div>
            {error && <span className="input-error-message">{error}</span>}
        </div>
    )
}

export default Input
