import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { MEMBERS } from '../constants/members'

export default function MemberSelect({ onMemberSelect, onViewTimeline }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      const membersRef = collection(db, 'orgs/sawada/members')
      const q = query(membersRef, where('active', '==', true))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        // Auto-seed members from constants
        await seedMembers()
      } else {
        const loadedMembers = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        setMembers(loadedMembers)
      }
    } catch (error) {
      console.error('メンバー読み込みエラー:', error)
      // Fallback to constants if Firestore fails
      setMembers(
        MEMBERS.map((member, index) => ({
          ...member,
          order: index,
          active: true,
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  const seedMembers = async () => {
    try {
      const membersRef = collection(db, 'orgs/sawada/members')
      for (let i = 0; i < MEMBERS.length; i++) {
        await addDoc(membersRef, {
          name: MEMBERS[i].name,
          order: i,
          active: true,
        })
      }
      // Reload after seeding
      await loadMembers()
    } catch (error) {
      console.error('シード失敗:', error)
    }
  }

  const handleSelect = (member) => {
    setSelected(member.id)
    onMemberSelect(member)
  }

  const handleViewTimeline = (member, e) => {
    e.stopPropagation()
    setSelected(member.id)
    onViewTimeline(member)
  }

  if (loading) {
    return <div className="member-select-container">読み込み中...</div>
  }

  return (
    <div className="member-select-container">
      <h1>メンバーを選択</h1>
      <div className="member-grid">
        {members.map((member) => (
          <div key={member.id} className="member-button-wrapper">
            <button
              className={`member-button ${selected === member.id ? 'active' : ''}`}
              onClick={() => handleSelect(member)}
            >
              {member.name}
            </button>
            <button
              className="timeline-button"
              onClick={(e) => handleViewTimeline(member, e)}
              title="タイムライン表示"
            >
              📋
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
