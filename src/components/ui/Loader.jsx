import './Loader.css'

const Loader = ({
    fullScreen = false,
    message = 'Cargando...',
    size = 'md'
}) => {
    if (fullScreen) {
        return (
            <div className="loader-fullscreen">
                <div className="loader-content">
                    <div className={`loader-spinner loader-spinner-${size}`}></div>
                    {message && <p className="loader-message">{message}</p>}
                </div>
            </div>
        )
    }

    return (
        <div className="loader-inline">
            <div className={`loader-spinner loader-spinner-${size}`}></div>
            {message && <span className="loader-message">{message}</span>}
        </div>
    )
}

export default Loader
