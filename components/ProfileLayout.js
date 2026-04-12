import { useState } from 'react'
import Navbar from './Navbar'
import SidebarLeft from './SidebarLeft'

export default function ProfileLayout({ children }){
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div>
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="main-layout profile-layout">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            <div className="sidebar-mobile-overlay">
              <SidebarLeft />
            </div>
          </>
        )}
        <div className="sidebar-desktop">
          <SidebarLeft />
        </div>
        <main className="center-feed profile-center">{children}</main>
      </div>
    </div>
  )
}
