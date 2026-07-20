import { useState, useEffect } from 'react'
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../firebase'

export default function MemberManagement({ onBack }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newOrder, setNewOrder] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingOrder, setEditingOrder] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const membersRef = collection(db, 'orgs/sawada/members')
      const q = query(membersRef, orderBy('order'))
      const snapshot = await getDocs(q)
      const loadedMembers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setMembers(loadedMembers)
    } catch (error) {
      console.error('メンバー読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!newName.trim() || newOrder === '') {
      alert('名前とorder を入力してください')
      return
    }

    setAdding(true)
    try {
      const membersRef = collection(db, 'orgs/sawada/members')
      await addDoc(membersRef, {
        name: newName,
        order: parseInt(newOrder),
        active: true,
      })
      setNewName('')
      setNewOrder('')
      await loadMembers()
    } catch (error) {
      console.error('追加エラー:', error)
      alert('メンバー追加に失敗しました')
    } finally {
      setAdding(false)
    }
  }

  const handleEditStart = (member) => {
    setEditingId(member.id)
    setEditingName(member.name)
    setEditingOrder(member.order)
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingName('')
    setEditingOrder('')
  }

  const handleEditSave = async (memberId) => {
    if (!editingName.trim()) {
      alert('名前を入力してください')
      return
    }

    setUpdating(true)
    try {
      const memberRef = doc(db, 'orgs/sawada/members', memberId)
      await updateDoc(memberRef, {
        name: editingName,
        order: parseInt(editingOrder),
      })
      await loadMembers()
      setEditingId(null)
    } catch (error) {
      console.error('更新エラー:', error)
      alert('メンバー更新に失敗しました')
    } finally {
      setUpdating(false)
    }
  }

  const handleToggleActive = async (member) => {
    setUpdating(true)
    try {
      const memberRef = doc(db, 'orgs/sawada/members', member.id)
      await updateDoc(memberRef, {
        active: !member.active,
      })
      await loadMembers()
    } catch (error) {
      console.error('トグルエラー:', error)
      alert('ステータス変更に失敗しました')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="member-management-container">
      <div className="management-header">
        <button className="back-button" onClick={onBack}>
          ← 戻る
        </button>
        <h2>メンバー管理</h2>
      </div>

      <div className="management-content">
        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : (
          <>
            <div className="add-member-form">
              <h3>新規メンバー追加</h3>
              <div className="form-inputs">
                <input
                  type="text"
                  placeholder="名前"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={adding}
                />
                <input
                  type="number"
                  placeholder="order"
                  value={newOrder}
                  onChange={(e) => setNewOrder(e.target.value)}
                  disabled={adding}
                />
                <button onClick={handleAddMember} disabled={adding} className="add-btn">
                  {adding ? '追加中...' : '追加'}
                </button>
              </div>
            </div>

            <div className="members-list">
              <h3>メンバー一覧</h3>
              <table className="members-table">
                <thead>
                  <tr>
                    <th>名前</th>
                    <th>Order</th>
                    <th>状態</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className={member.active ? '' : 'inactive'}>
                      <td>
                        {editingId === member.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            disabled={updating}
                          />
                        ) : (
                          member.name
                        )}
                      </td>
                      <td>
                        {editingId === member.id ? (
                          <input
                            type="number"
                            value={editingOrder}
                            onChange={(e) => setEditingOrder(e.target.value)}
                            disabled={updating}
                          />
                        ) : (
                          member.order
                        )}
                      </td>
                      <td>
                        <span className={member.active ? 'status-active' : 'status-inactive'}>
                          {member.active ? '有効' : '無効'}
                        </span>
                      </td>
                      <td className="actions">
                        {editingId === member.id ? (
                          <>
                            <button
                              onClick={() => handleEditSave(member.id)}
                              disabled={updating}
                              className="save-btn"
                            >
                              ✓
                            </button>
                            <button onClick={handleEditCancel} disabled={updating} className="cancel-btn">
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditStart(member)}
                              disabled={updating}
                              className="edit-btn"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleToggleActive(member)}
                              disabled={updating}
                              className={member.active ? 'deactivate-btn' : 'activate-btn'}
                            >
                              {member.active ? '無効化' : '再有効化'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
