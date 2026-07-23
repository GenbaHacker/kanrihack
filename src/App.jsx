import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import LoginScreen from './components/LoginScreen'
import MemberSelect from './components/MemberSelect'
import InputScreen from './components/InputScreen'
import Timeline from './components/Timeline'
import MemberManagement from './components/MemberManagement'
import ActionsList from './components/ActionsList'
import { MEMBERS } from './constants/members'
import './App.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [viewMode, setViewMode] = useState('members') // 'members', 'timeline', 'management', 'actions'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        // Check if user is admin via userProfiles
        try {
          const userProfileRef = doc(db, 'orgs/sawada/userProfiles', currentUser.uid)
          const userProfileDoc = await getDoc(userProfileRef)
          if (userProfileDoc.exists()) {
            setIsAdmin(userProfileDoc.data().isAdmin || false)
          } else {
            setIsAdmin(false)
          }
        } catch (error) {
          console.error('Admin check error:', error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
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

  const handleManagementMode = () => {
    setViewMode('management')
  }

  const handleBackFromManagement = () => {
    setViewMode('members')
  }

  const handleActionsMode = () => {
    setSelectedMember(null)
    setViewMode('actions')
  }

  const handleJumpToRecord = (recordId, memberName) => {
    const member = MEMBERS.find((m) => m.name === memberName)
    if (member) {
      setSelectedMember(member)
      setViewMode('timeline')
    }
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
          <div className="user-details">
            <span>{user.email}</span>
            {isAdmin && <span className="admin-badge">管理者</span>}
          </div>
          <span className="user-uid" title="UID をコピーして userProfiles で管理者設定">{user.uid}</span>
        </div>
        <div className="header-buttons">
          {viewMode === 'members' && !selectedMember && (
            <>
              <button className="actions-button" onClick={handleActionsMode}>
                📋 アクション一覧
              </button>
              {isAdmin && (
                <button className="management-button" onClick={handleManagementMode}>
                  ⚙ メンバー管理
                </button>
              )}
            </>
          )}
          <button className="logout-button" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </div>

      <div className="app-layout">
        {viewMode === 'management' ? (
          <MemberManagement onBack={handleBackFromManagement} />
        ) : viewMode === 'actions' ? (
          <ActionsList user={user} onBack={handleBack} onJumpToRecord={handleJumpToRecord} />
        ) : viewMode === 'members' && !selectedMember ? (
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
                <Timeline member={selectedMember} user={user} onBack={handleBack} isAdmin={isAdmin} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
