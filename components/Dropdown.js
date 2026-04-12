import React from 'react'

function Dropdown({ children, open }) {
  if (!open) return null
  return (
    <div className="dropdown-menu open" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  )
}

export default Dropdown
