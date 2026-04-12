export default function Modal({ open, onClose, title, children, footer, className, style, position, noHeader }){
  if (!open) return null
  
  const positionClass = position === 'left' ? 'position-left' : position === 'right' ? 'position-right' : ''

  return (
    <div
      className={`modal-overlay open ${positionClass}`}
      onClick={(e)=>{ if(e.target.classList.contains('modal-overlay')) onClose?.() }}
    >
      <div className={`modal ${className || ''}`} style={style}>
        {!noHeader && <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            <i className="fas fa-times"></i>
          </button>
        </div>}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
