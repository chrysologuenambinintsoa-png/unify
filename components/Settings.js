import { useState, useEffect } from 'react'
import Modal from './Modal'
import { useTranslation } from '../hooks/useTranslation'

export default function Settings(){
  const { t } = useTranslation()
  


  const [active, setActive] = useState('privacy')
  const [userInfo, setUserInfo] = useState({})
  const [userSettings, setUserSettings] = useState({})
  const [passwords, setPasswords] = useState({ current:'', new:'', confirm:'' })
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [adsEdits, setAdsEdits] = useState({ interests: '' })
  const [showAdsConsult, setShowAdsConsult] = useState(false)
  const [blockingEdits, setBlockingEdits] = useState({ users: '', pages: '' })
  const [showBlockedUsers, setShowBlockedUsers] = useState(false)
  // toggle for pages list as well
  const [showBlockedPages, setShowBlockedPages] = useState(false)
  const [blockedProfiles, setBlockedProfiles] = useState([])  // user objects
  const [showDevices, setShowDevices] = useState(false)
  const [personalEdits, setPersonalEdits] = useState({})

  // modal support for select dropdowns
  const [modalSelectOptions, setModalSelectOptions] = useState([]);

  // utility helpers
  const getSetting = (path, defaultVal) => {
    let val = userSettings
    for (const p of path) {
      if (val && val[p] !== undefined) val = val[p]
      else return defaultVal
    }
    return val
  }

  const saveUser = async (updates) => {
    const u = JSON.parse(localStorage.getItem('user')||'null')
    if (u?.email) {
      try {
        const res = await fetch('/api/user', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: u.email, ...updates })
        })
        const data = await res.json()
        if (data.user) {
          setUserInfo(data.user)
          setUserSettings(data.user.settings || {})
          localStorage.setItem('user', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            prenom: data.user.prenom,
            nom: data.user.nom,
            nomUtilisateur: data.user.nomUtilisateur,
            avatar: data.user.avatar,
            avatarUrl: data.user.avatarUrl
          }))
          window.dispatchEvent(new Event('userUpdated'))
        }
      } catch (err) {
        console.error('Failed to save user', err)
      }
    }
  }

  const toggleSetting = (section, key) => {
    setUserSettings(prev => {
      const updated = { ...prev }
      if (!updated[section]) updated[section] = {}
      updated[section][key] = !updated[section][key]
      saveUser({ settings: updated })
      return updated
    })
  }

  const editSettingStr = (path, promptText) => {
    // open modal editor instead of prompt
    handleModifySetting(path, promptText)
  }

  const editProfileField = (field, label) => {
    // not used anymore; inputs handle editing inline
  }

  // Action handlers for various buttons
  // inline editing replaces modal-based profile modifications
  const handleModifyProfile = (field, label) => {
    // kept for reference but no longer invoked
  }

  const handleModifySetting = (path, label) => {
    // language/region edited inline; do not open modal
    if (path[0] === 'language') return

    setModalMode('setting')
    setModalTitle(label)
    setModalPath(path)
    const cur = getSetting(path, '')
    setModalSelectOptions([])
    setModalInput(Array.isArray(cur) ? cur.join(', ') : cur)
    // always open modal for editing
    setModalIsAudience(false)
    setModalOpen(true)
  }

  const handleVerify = (path, label) => {
    // open modal to confirm verification and show timestamp
    setModalMode('verify')
    setModalTitle(label)
    setModalPath(path)
    setModalInput(`${t('common.lastVerification')}: ${new Date().toLocaleString()}`)
    setModalOpen(true)
  }

  const handleManage = (area) => {
    // open modal for management actions (ads or blocked lists)
    setModalMode('manage')
    setModalArea(area)
    if (area === 'ads') {
      setModalTitle(t('settings.manageInterests'))
      const cur = getSetting(['ads','interests'], [])
      setModalInput(Array.isArray(cur) ? cur.join(', ') : cur || '')
    } else if (area === 'blocked') {
      setModalTitle(t('settings.manageBlockedPeople'))
      const cur = getSetting(['blocking','blockedUsers'], [])
      setModalInput(Array.isArray(cur) ? cur.join(', ') : cur || '')
    } else {
      setModalTitle(t('settings.manage'))
      setModalInput('')
    }
    setModalOpen(true)
  }

  const handleConsult = (area) => {
    setModalMode('consult')
    setModalArea(area)
    if (area === 'ads') {
      setModalTitle(t('settings.interests'))
      const v = getSetting(['ads','interests'], [])
      setModalInput(Array.isArray(v) ? v.join(', ') : (v || ''))
    } else {
      setModalTitle(t('settings.consult'))
      setModalInput(t('settings.noDataAvailable'))
    }
    setModalOpen(true)
  }

  // inline password change form replaces modal
  const handleChangePassword = () => {
    // this function is no longer used; save triggered by button below
  }

  // toggle 2FA inline
  const handleManage2FA = () => {
    toggleSetting('security','twoFactor')
  }

  const handleVerifyDevices = async () => {
    const devices = getSetting(['security','devices'], [])
    setShowDevices(!showDevices)
  }





  useEffect(() => {
    // whenever we open blocked users list, fetch profile details
    const loadBlockedProfiles = async () => {
      const ids = getSetting(['blocking','blockedUsers'], [])
      if (ids && ids.length) {
        const profiles = []
        for (const id of ids) {
          try {
            const res = await fetch(`/api/user?userId=${id}`)
            const data = await res.json()
            if (data.user) profiles.push(data.user)
          } catch (e) {
            console.error('failed to load blocked user', id, e)
          }
        }
        setBlockedProfiles(profiles)
      } else setBlockedProfiles([])
    }
    if (showBlockedUsers) loadBlockedProfiles()
  }, [showBlockedUsers, userSettings])

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user')||'null')
    if (u?.email) {
      fetch(`/api/user?userEmail=${u.email}`)
        .then(r => r.json())
        .then(d => {
          if (d.user) {
            setUserInfo(d.user)
            setUserSettings(d.user.settings || {})
            // prefill personal edit fields
            setPersonalEdits({
              name: d.user.prenom ? `${d.user.prenom} ${d.user.nom || ''}` : '',
              email: d.user.email || '',
              phone: d.user.phone || ''
            })
            // prefill ads interests
            setAdsEdits({ interests: (d.user.settings?.ads?.interests || []).join(', ') })
            setBlockingEdits({
              users: (d.user.settings?.blocking?.blockedUsers || []).join(', '),
              pages: (d.user.settings?.blocking?.blockedPages || []).join(', ')
            })
          }
        })
    }
  }, [])

  // modal state for inline editors
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalInput, setModalInput] = useState('')
  const [modalMode, setModalMode] = useState('')
  const [modalPath, setModalPath] = useState(null)
  const [modalField, setModalField] = useState(null)
  const [modalArea, setModalArea] = useState(null)
  const [modalIsAudience, setModalIsAudience] = useState(false)
  // privacy option radio groups instead of dropdowns
  // no dropdownPath or ref needed any more

  const audienceOptions = [
    t('settings.public'),
    t('settings.friends'),
    t('settings.onlyMe')
  ]

  const formatAudience = (val) => {
    if (!val) return ''
    if (typeof val !== 'string') return String(val)
    if (val.includes('Public') || val.includes(t('settings.public'))) return t('settings.public')
    if (val.includes('Amis') || val.includes(t('settings.friends'))) return t('settings.friends')
    if (val.includes('Priv') || val.includes(t('settings.onlyMe'))) return t('settings.onlyMe')
    return val
  }

  const updatePrivacy = (key, value) => {
    // update local copy immediately for responsive UI
    const updated = { ...(userSettings || {}) }
    if (!updated.privacy) updated.privacy = {}
    updated.privacy[key] = value
    setUserSettings(updated)
    saveUser({ settings: updated })
  }

  const modalSave = () => {
    if (modalMode === 'profile') {
      if (modalField === 'name') {
        const parts = (modalInput || '').split(' ').filter(Boolean)
        const prenom = parts.shift() || ''
        const nom = parts.join(' ')
        saveUser({ prenom, nom })
      } else {
        const upd = {}
        upd[modalField] = modalInput
        saveUser(upd)
      }
    } else if (modalMode === 'setting') {
      const updated = { ...(userSettings || {}) }
      let node = updated
      const path = modalPath || []
      for (let i = 0; i < path.length - 1; i++) { const p = path[i]; if (!node[p]) node[p] = {}; node = node[p] }
      // if input looks like a list, split
      const val = modalInput && modalInput.includes(',') ? modalInput.split(',').map(s=>s.trim()).filter(Boolean) : modalInput
      node[path[path.length - 1]] = val
      saveUser({ settings: updated })
    } else if (modalMode === 'manage') {
      const updated = { ...(userSettings || {}) }
      if (modalArea === 'ads') {
        if (!updated.ads) updated.ads = {}
        updated.ads.interests = modalInput.split(',').map(s=>s.trim()).filter(Boolean)
      } else if (modalArea === 'blocked') {
        if (!updated.blocking) updated.blocking = {}
        updated.blocking.blockedUsers = modalInput.split(',').map(s=>s.trim()).filter(Boolean)
      }
      saveUser({ settings: updated })
    } else if (modalMode === 'verify') {
      const updated = { ...(userSettings || {}) }
      let node = updated
      const path = modalPath || []
      for (let i = 0; i < path.length - 1; i++) { const p = path[i]; if (!node[p]) node[p] = {}; node = node[p] }
      node[path[path.length - 1]] = modalInput
      saveUser({ settings: updated })
    } else if (modalMode === '2fa') {
      const updated = { ...(userSettings || {}) }
      if (!updated.security) updated.security = {}
      updated.security.twoFactor = String(modalInput).toLowerCase().includes('activ') || String(modalInput) === 'true'
      saveUser({ settings: updated })
    } else if (modalMode === 'changePassword') {
      console.log('Password change requested (server implementation needed)')
    }
    setModalOpen(false)
  }

  return (
    <div className="settings-layout" style={{padding:'16px'}}>
      <div className="settings-sidebar">
        <h2>{t('settings.title')}</h2>
        <div className={`settings-nav-item ${active==='privacy'?'active':''}`} onClick={()=>setActive('privacy')}><div className="settings-nav-icon"><i className="fas fa-lock"></i></div><span>{t('settings.privacy')}</span></div>
        <div className={`settings-nav-item ${active==='personal'?'active':''}`} onClick={()=>setActive('personal')}><div className="settings-nav-icon"><i className="fas fa-user-circle"></i></div><span>{t('settings.personalInfo')}</span></div>
        <div className={`settings-nav-item ${active==='security'?'active':''}`} onClick={()=>setActive('security')}><div className="settings-nav-icon"><i className="fas fa-shield-alt"></i></div><span>{t('settings.security')}</span></div>
        <div className={`settings-nav-item ${active==='notifications'?'active':''}`} onClick={()=>setActive('notifications')}><div className="settings-nav-icon"><i className="fas fa-bell"></i></div><span>{t('settings.notifications')}</span></div>
        <div className={`settings-nav-item ${active==='ads'?'active':''}`} onClick={()=>setActive('ads')}><div className="settings-nav-icon"><i className="fas fa-ad"></i></div><span>{t('settings.ads')}</span></div>
        <div className={`settings-nav-item ${active==='profile'?'active':''}`} onClick={()=>setActive('profile')}><div className="settings-nav-icon"><i className="fas fa-users"></i></div><span>{t('settings.profile')}</span></div>
        <div className={`settings-nav-item ${active==='blocking'?'active':''}`} onClick={()=>setActive('blocking')}><div className="settings-nav-icon"><i className="fas fa-ban"></i></div><span>{t('settings.blocking')}</span></div>
      </div>
      <div className="settings-content">
        {active === 'privacy' && (
          <div className="settings-section">
            <h3>{t('settings.accountPrivacy')}</h3>

            <div className="privacy-item">
              <h4>{t('settings.whoCanSeeFuturePosts')}</h4>
              <div className="privacy-options">
                {audienceOptions.map(opt => (
                  <label key={opt}>
                    <input
                      type="radio"
                      name="futurePosts"
                      value={opt}
                      checked={formatAudience(getSetting(['privacy','futurePosts'],t('settings.public')))===opt}
                      onChange={() => updatePrivacy('futurePosts', opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="privacy-item">
              <h4>{t('settings.whoCanSendFriendRequests')}</h4>
              <div className="privacy-options">
                {audienceOptions.map(opt => (
                  <label key={opt}>
                    <input
                      type="radio"
                      name="friendRequests"
                      value={opt}
                      checked={formatAudience(getSetting(['privacy','friendRequests'],t('settings.public')))===opt}
                      onChange={() => updatePrivacy('friendRequests', opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="privacy-item">
              <h4>{t('settings.whoCanSeeFriendList')}</h4>
              <div className="privacy-options">
                {audienceOptions.map(opt => (
                  <label key={opt}>
                    <input
                      type="radio"
                      name="friendList"
                      value={opt}
                      checked={formatAudience(getSetting(['privacy','friendList'],t('settings.friends')))===opt}
                      onChange={() => updatePrivacy('friendList', opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="settings-item privacy-item">
              <div className="settings-item-info">
                <h4>{t('settings.verifyAllPosts')}</h4>
                <p style={{fontSize:13,marginTop:4}}>
                  {t('settings.verifyAllPostsDesc')}
                </p>
              </div>
              <button className="btn-secondary" onClick={() => handleVerify(['privacy','reviewPosts'],t('settings.verifyAllPosts'))}>
                {t('settings.manage')}
              </button>
            </div>

          </div>
        )}
        {active === 'personal' && (
          <div className="settings-section">
            <h3>{t('settings.personalInfo')}</h3>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>{t('settings.yourName')}</h4>
              </div>
              <input
                type="text"
                value={personalEdits.name || ''}
                onChange={e => setPersonalEdits(prev => ({ ...prev, name: e.target.value }))}
                style={{marginRight:8,flex:'1 1 auto'}}
              />
              <button
                className="btn-secondary"
                onClick={() => {
                  const parts = (personalEdits.name||'').split(' ').filter(Boolean)
                  const prenom = parts.shift()||''
                  const nom = parts.join(' ')
                  saveUser({ prenom, nom })
                }}
              >
                {t('settings.save')}
              </button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>{t('settings.email')}</h4>
              </div>
              <input
                type="email"
                value={personalEdits.email || ''}
                onChange={e => setPersonalEdits(prev => ({ ...prev, email: e.target.value }))}
                style={{marginRight:8,flex:'1 1 auto'}}
              />
              <button
                className="btn-secondary"
                onClick={() => saveUser({ email: personalEdits.email })}
              >
                {t('settings.save')}
              </button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>{t('settings.phone')}</h4>
              </div>
              <input
                type="tel"
                value={personalEdits.phone || ''}
                onChange={e => setPersonalEdits(prev => ({ ...prev, phone: e.target.value }))}
                style={{marginRight:8,flex:'1 1 auto'}}
              />
              <button
                className="btn-secondary"
                onClick={() => saveUser({ phone: personalEdits.phone })}
              >
                {t('settings.save')}
              </button>
            </div>
          </div>
        )}
        {active === 'security' && (
          <div className="settings-section">
            <h3>{t('settings.security')}</h3>

            <div className="settings-item password-item" style={{position:'relative'}}>
              <div className="settings-item-info">
                <h4>{t('settings.changePassword')}</h4>
                <p>{t('settings.changePasswordDesc')}</p>
              </div>
              <button className="btn-secondary" onClick={()=>setShowPasswordForm(true)}>{t('settings.modify')}</button>

              {showPasswordForm && (
                <div className="password-overlay">
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <input
                      type="password"
                      placeholder={t('settings.currentPassword')}
                      value={passwords.current}
                      onChange={e=>setPasswords(p=>({...p,current:e.target.value}))}
                    />
                    <input
                      type="password"
                      placeholder={t('settings.newPassword')}
                      value={passwords.new}
                      onChange={e=>setPasswords(p=>({...p,new:e.target.value}))}
                    />
                    <input
                      type="password"
                      placeholder={t('settings.confirmPassword')}
                      value={passwords.confirm}
                      onChange={e=>setPasswords(p=>({...p,confirm:e.target.value}))}
                    />
                    <div style={{display:'flex',gap:8,marginTop:8}}>
                      <button className="btn-secondary" onClick={()=>setShowPasswordForm(false)}>{t('settings.cancel')}</button>
                      <button className="btn-primary" onClick={()=>{
                        if(passwords.new !== passwords.confirm) { alert('Les mots de passe ne correspondent pas'); return }
                        if(!passwords.new) { alert('Veuillez entrer un nouveau mot de passe'); return }
                        saveUser({ password: passwords.new })
                        setPasswords({current:'',new:'',confirm:''})
                        setShowPasswordForm(false)
                      }}>{t('settings.saveChanges')}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="settings-item">
              <div className="settings-item-info">
                <h4>{t('settings.twoFactorAuth')}</h4>
                <p>{t('settings.twoFactorDesc')}</p>
              </div>
              <button className="btn-secondary" onClick={handleManage2FA}>
                {getSetting(['security','twoFactor'],false) ? t('settings.enabled') : t('settings.disabled')}
              </button>
            </div>

            <div className="settings-item">
              <div className="settings-item-info">
                <h4>{t('settings.verifyDevices')}</h4>
              </div>
              <button className="btn-secondary" onClick={handleVerifyDevices}>{t('settings.view')}</button>
            </div>
            {showDevices && (
              <div style={{padding:'0 16px'}}>
                {(getSetting(['security','devices'],[])||[]).map((d,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,margin:'6px 0'}}>
                    <div style={{width:32,height:32,borderRadius:'4px',background:'#ccc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>📱</div>
                    <div style={{flex:1,fontSize:13}}>{d}</div>
                  </div>
                ))}
                {(!getSetting(['security','devices'],[])||[]).length===0 && (
                  <div style={{fontSize:13,color:'#606770'}}>{t('settings.noDevices')}</div>
                )}
              </div>
            )}

          </div>
        )}
        {active === 'notifications' && (
          <div className="settings-section">
            <h3>{t('settings.notifications')}</h3>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>{t('settings.pushNotifications')}</h4>
                <p>{t('settings.pushNotificationsDesc')}</p>
              </div>
              <button className="btn-secondary" onClick={()=>toggleSetting('notifications','push')}>
                {getSetting(['notifications','push'],true) ? t('settings.enabled') : t('settings.disabled')}
              </button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>{t('settings.emailNotifications')}</h4>
                <p>{t('settings.emailNotificationsDesc')}</p>
              </div>
              <button className="btn-secondary" onClick={()=>toggleSetting('notifications','email')}>
                {getSetting(['notifications','email'],true) ? t('settings.enabled') : t('settings.disabled')}
              </button>
            </div>
          </div>
        )}
        {active === 'ads' && (
          <div className="settings-section">
            <h3>{t('settings.ads')}</h3>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>{t('settings.interests')}</h4>
                <p>{t('settings.interestsDesc')}</p>
              </div>
              <button className="btn-secondary" onClick={()=>handleConsult('ads')}>{t('settings.view')}</button>
              <button className="btn-secondary" onClick={()=>handleManage('ads')} style={{marginLeft:8}}>{t('settings.modify')}</button>
            </div>
          </div>
        )}
        {active === 'profile' && (
          <div className="settings-section">
            <h3>{t('settings.profile')}</h3>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>{t('settings.reviewTags')}</h4>
                <p>{t('settings.reviewTagsDesc')}</p>
              </div>
              <button className="btn-secondary" onClick={()=>handleVerify(['profile','reviewTags'],t('settings.reviewTags'))}>
                {t('settings.manage')}
              </button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>{t('settings.whoCanTagYou')}</h4>
              </div>
              <button className="btn-secondary" onClick={()=>handleModifySetting(['profile','tagging'],t('settings.whoCanTagYou'))}>
                {getSetting(['profile','tagging'],t('settings.friends'))}
              </button>
            </div>
          </div>
        )}
        {active === 'blocking' && (
          <div className="settings-section">
            <h3>{t('settings.blocking')}</h3>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>{t('settings.blockedUsers')}</h4>
                <p>{t('settings.blockedUsersDesc')}</p>
              </div>
              <button className="btn-secondary" onClick={()=>handleManage('blocked')}>{t('settings.manage')}</button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>{t('settings.blockedPages')}</h4>
                <p>{t('settings.blockedPagesDesc')}</p>
              </div>
              <button className="btn-secondary" onClick={()=>setShowBlockedPages(!showBlockedPages)}>
                {showBlockedPages ? t('settings.hide') : t('settings.view')}
              </button>
            </div>
            {showBlockedPages && (
              <div style={{padding:'0 16px'}}>
                {(getSetting(['blocking','blockedPages'],[])||[]).map((p,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,margin:'6px 0'}}>
                    <div style={{width:32,height:32,borderRadius:'4px',background:'#ccc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'#fff'}}>📄</div>
                    <div style={{flex:1,fontSize:13}}>{p}</div>
                    <button className="btn-secondary" style={{fontSize:12,padding:'4px 8px'}} onClick={() => {
                      const updated = { ...(userSettings||{}) }
                      const arr = getSetting(['blocking','blockedPages'],[]).filter(id=>id!==p)
                      if (!updated.blocking) updated.blocking = {}
                      updated.blocking.blockedPages = arr
                      setUserSettings(updated)
                      saveUser({ settings: updated })
                      setBlockingEdits(prev=>({...prev,pages: arr.join(', ')}))
                    }}>{t('settings.unblock')}</button>
                  </div>
                ))}
                {(!getSetting(['blocking','blockedPages'],[])||[]).length===0 && (
                  <div style={{fontSize:13,color:'#606770'}}>{t('settings.noBlockedPages')}</div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={modalTitle} footer={(
        <div style={{display:'flex',gap:8}}>
          <button className="btn-secondary" onClick={()=>setModalOpen(false)}>{t('settings.cancel')}</button>
          <button className="btn-primary" onClick={modalSave}>{t('settings.saveChanges')}</button>
        </div>
      )}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {modalMode === 'consult' && (<div style={{whiteSpace:'pre-wrap'}}>{modalInput}</div>)}
          {modalMode === 'setting' && modalSelectOptions.length > 0 && (
            <select value={modalInput} onChange={e=>setModalInput(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid var(--fb-border)'}}>
              <option value="">--{t('settings.select')}--</option>
              {modalSelectOptions.map(opt => {
                if (typeof opt === 'object') {
                  return <option key={opt.code} value={opt.code}>{opt.name}</option>
                }
                return <option key={opt} value={opt}>{opt}</option>
              })}
            </select>
          )}
          {(modalMode === 'manage' || modalMode === 'profile' || modalMode === 'verify' || (modalMode==='setting' && modalSelectOptions.length===0)) && (
            <textarea value={modalInput} onChange={(e)=>setModalInput(e.target.value)} rows={6} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid var(--fb-border)'}} />
          )}
          {modalMode === 'verify' && (<div style={{fontSize:13,color:'var(--fb-text-secondary)'}}>{t('settings.clickSaveToMarkVerification')}</div>)}
        </div>
      </Modal>

    </div>
  )
}
