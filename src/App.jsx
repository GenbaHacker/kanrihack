import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import LoginScreen from './components/LoginScreen'
import MemberSelect from './components/MemberSelect'
import InputScreen from './components/InputScreen'
import Timeline from './components/Timeline'
import './App.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [viewMode, setViewMode] = useState('members') // 'members' or 'timeline'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    setSelectedMember(null)
    setViewMode('members')
  }

  const handleMemberSelect = (member) => {
    setSelectedMember(member)
    setViewMode('input')
  }

  const handleViewTimeline = (member) => {
    setSelectedMember(member)
    setViewMode('timeline')
  }

  const handleBack = () => {
    setSelectedMember(null)
    setViewMode('members')
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="user-info">
          <span>{user.email}</span>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          ログアウト
        </button>
      </div>

      <div className="app-layout">
        {viewMode === 'members' && !selectedMember ? (
          <MemberSelect onMemberSelect={handleMemberSelect} onViewTimeline={handleViewTimeline} />
        ) : (
          <>
            {/* PC: 左側メンバーリスト常時表示 */}
            <div className="sidebar">
              <MemberSelect onMemberSelect={handleMemberSelect} onViewTimeline={handleViewTimeline} />
            </div>
            {/* PC/モバイル: 右側入力エリア */}
            <div className="main-content">
              {viewMode === 'input' && (
                <InputScreen member={selectedMember} user={user} onBack={handleBack} />
              )}
              {viewMode === 'timeline' && (
                <Timeline member={selectedMember} user={user} onBack={handleBack} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
