import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import SidebarLeft from './SidebarLeft'
import SidebarRight from './SidebarRight'
import TextPostCreator from './TextPostCreator'

export default function Layout({ children, leftSidebar = true, rightSidebar, rightSidebarContent }){
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showRightSidebar, setShowRightSidebar] = useState(true)

  useEffect(() => {
    setShowRightSidebar(rightSidebar !== false)
  }, [rightSidebar])

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) setCurrentUser(JSON.parse(u))
    function onUserUpdated() {
      const v = localStorage.getItem('user')
      setCurrentUser(v ? JSON.parse(v) : null)
    }
    window.addEventListener('userUpdated', onUserUpdated)
    return () => window.removeEventListener('userUpdated', onUserUpdated)
  }, [])

  return (
    <div>
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="main-layout">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            <div className="sidebar-mobile-overlay">
              <SidebarLeft />
            </div>
          </>
        )}
        {leftSidebar && (
          <div className="sidebar-desktop">
            <SidebarLeft />
          </div>
        )}
        <main className={`center-feed${!leftSidebar ? ' full-width' : ''}`}>{children}</main>
        {showRightSidebar && (
          <div className="right-sidebar">
            {rightSidebarContent || <SidebarRight />}
          </div>
        )}
      </div>
      <style jsx>{`
        .main-layout { display: flex; gap: 20px; align-items: flex-start; box-sizing: border-box; padding: 0 12px; padding-top: 72px; min-height: calc(100vh - 72px); }
        .sidebar-desktop { flex: 0 0 260px; width: 260px; display: block; position: sticky; top: 56px; height: calc(100vh - 56px); overflow-y: auto; align-self: flex-start; z-index: 20; }
        .center-feed { flex: 1; min-width: 0; max-width: 760px; margin: 0 auto; }
        .center-feed.full-width { max-width: calc(100% - 340px); }
        .right-sidebar { flex: 0 0 320px; width: 320px; position: sticky; top: 56px; height: calc(100vh - 56px); overflow-y: auto; flex-shrink: 0; }

@media (max-width: 600px) {
          .main-layout { flex-direction: column; padding: 0 8px; padding-top: 56px; min-height: auto; height: auto; }
          .sidebar-desktop { display: none; }
          .right-sidebar { display: none; }
          .center-feed { width: 100%; max-width: 100%; margin: 0; height: auto; }
          .center-feed.full-width { max-width: 100%; }
        }

        @media (max-width: 480px) {
          .main-layout { gap: 12px; }
          .center-feed { padding: 0; }
        }
      `}</style>
      <TextPostCreator currentUser={currentUser} />
    </div>
  )
}
