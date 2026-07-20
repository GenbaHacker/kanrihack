import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { MEMBERS } from '../constants/members'

export default function Timeline({ member, user, onBack }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editingDate, setEditingDate] = useState('')
  const [editingNote, setEditingNote] = useState('')
  const [editingMemberId, setEditingMemberId] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadRecords()
  }, [member])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const recordsRef = collection(db, 'orgs/sawada/records')

      // Query A: shared records (everyone can see)
      const qA = query(
        recordsRef,
        where('memberId', '==', member.id),
        where('visibility', '==', 'shared'),
        orderBy('createdAt', 'desc')
      )
      const snapshotA = await getDocs(qA)

      // Query B: private records (only creator can see)
      const qB = query(
        recordsRef,
        where('memberId', '==', member.id),
        where('visibility', '==', 'private'),
        where('createdBy', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      const snapshotB = await getDocs(qB)

      // Merge and sort by meetingDate descending, then createdAt descending
      const allRecords = [
        ...snapshotA.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })),
        ...snapshotB.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })),
      ]
        .filter((record) => !record.deleted)
        .sort((a, b) => {
          // Sort by meetingDate descending (use createdAt date as fallback)
          const aDate = a.meetingDate || a.createdAt.toISOString().split('T')[0]
          const bDate = b.meetingDate || b.createdAt.toISOString().split('T')[0]
          const dateCompare = bDate.localeCompare(aDate)
          if (dateCompare !== 0) return dateCompare
          // If same date, sort by createdAt descending
          return b.createdAt - a.createdAt
        })

      setRecords(allRecords)
    } catch (error) {
      console.error('記録読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    return date.toLocaleDateString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatMeetingDate = (meetingDate) => {
    if (!meetingDate) return ''
    const [year, month, day] = meetingDate.split('-')
    return `${month}/${day}`
  }

  const handleEditStart = (record, field) => {
    setEditingId(record.id)
    setEditingField(field)
    if (field === 'meetingDate') {
      setEditingDate(record.meetingDate || '')
    } else if (field === 'note') {
      setEditingNote(record.note || '')
    } else if (field === 'memberId') {
      setEditingMemberId(record.memberId || '')
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingField(null)
    setEditingDate('')
    setEditingNote('')
    setEditingMemberId('')
  }

  const handleEditSave = async (recordId) => {
    setUpdating(true)
    try {
      const recordRef = doc(db, 'orgs/sawada/records', recordId)
      const updateData = {}

      if (editingField === 'meetingDate') {
        if (!editingDate.trim()) {
          alert('面談日を入力してください')
          setUpdating(false)
          return
        }
        updateData.meetingDate = editingDate
      } else if (editingField === 'note') {
        updateData.note = editingNote
      } else if (editingField === 'memberId') {
        if (!editingMemberId.trim()) {
          alert('メンバーを選択してください')
          setUpdating(false)
          return
        }
        const selectedMember = MEMBERS.find((m) => m.id === editingMemberId)
        updateData.memberId = editingMemberId
        updateData.memberName = selectedMember.name
      }

      await updateDoc(recordRef, updateData)

      // Reload records
      await loadRecords()
      setEditingId(null)
      setEditingField(null)
    } catch (error) {
      console.error('更新エラー:', error)
      alert('更新に失敗しました: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (recordId) => {
    if (!confirm('この記録を削除してもよろしいですか？（メンバーは変わりません）')) {
      return
    }

    setUpdating(true)
    try {
      const recordRef = doc(db, 'orgs/sawada/records', recordId)
      await updateDoc(recordRef, {
        deleted: true,
      })

      // Reload records
      await loadRecords()
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <button className="back-button" onClick={onBack}>
          ← 戻る
        </button>
        <h2>{member.name} のタイムライン</h2>
      </div>

      <div className="timeline-content">
        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : records.length === 0 ? (
          <div className="no-records">記録がありません</div>
        ) : (
          <div className="records-list">
            {records.map((record) => (
              <div key={record.id} className="record-item">
                <div className="record-meta">
                  <span className="record-type">[{record.type}]</span>
                  {editingId === record.id && editingField === 'meetingDate' ? (
                    <div className="record-date-edit">
                      <input
                        type="date"
                        value={editingDate}
                        onChange={(e) => setEditingDate(e.target.value)}
                        disabled={updating}
                      />
                      <button
                        className="edit-save-btn"
                        onClick={() => handleEditSave(record.id)}
                        disabled={updating}
                      >
                        ✓
                      </button>
                      <button className="edit-cancel-btn" onClick={handleEditCancel} disabled={updating}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="record-date">
                      {record.meetingDate ? (
                        <>
                          <span className="meeting-date">[面談: {formatMeetingDate(record.meetingDate)}]</span>
                          <span className="created-date">{formatDate(record.createdAt)}</span>
                        </>
                      ) : (
                        formatDate(record.createdAt)
                      )}
                      {record.createdBy === user.uid && (
                        <button
                          className="edit-btn"
                          onClick={() => handleEditStart(record, 'meetingDate')}
                          title="面談日を編集"
                        >
                          ✎
                        </button>
                      )}
                    </span>
                  )}
                  <span className="record-visibility">
                    {record.visibility === 'private' ? '🔒' : '🌐'}
                  </span>
                </div>

                <div className="record-body">{record.body}</div>

                {editingId === record.id && editingField === 'note' ? (
                  <div className="record-note-edit">
                    <textarea
                      className="note-textarea"
                      value={editingNote}
                      onChange={(e) => setEditingNote(e.target.value)}
                      placeholder="メモを入力..."
                      disabled={updating}
                    />
                    <div className="note-edit-buttons">
                      <button
                        className="edit-save-btn"
                        onClick={() => handleEditSave(record.id)}
                        disabled={updating}
                      >
                        保存
                      </button>
                      <button className="edit-cancel-btn" onClick={handleEditCancel} disabled={updating}>
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : record.note ? (
                  <div className="record-note">
                    <strong>メモ:</strong> {record.note}
                    {record.createdBy === user.uid && (
                      <button
                        className="edit-btn-inline"
                        onClick={() => handleEditStart(record, 'note')}
                        title="メモを編集"
                      >
                        ✎
                      </button>
                    )}
                  </div>
                ) : (
                  record.createdBy === user.uid && (
                    <button
                      className="add-note-btn"
                      onClick={() => handleEditStart(record, 'note')}
                      title="メモを追加"
                    >
                      + メモを追加
                    </button>
                  )
                )}

                {record.createdBy === user.uid && (
                  <div className="record-actions">
                    {editingId === record.id && editingField === 'memberId' ? (
                      <div className="member-select-edit">
                        <select
                          value={editingMemberId}
                          onChange={(e) => setEditingMemberId(e.target.value)}
                          disabled={updating}
                        >
                          <option value="">メンバーを選択...</option>
                          {MEMBERS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="edit-save-btn"
                          onClick={() => handleEditSave(record.id)}
                          disabled={updating}
                        >
                          変更
                        </button>
                        <button className="edit-cancel-btn" onClick={handleEditCancel} disabled={updating}>
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="action-btn member-btn"
                          onClick={() => handleEditStart(record, 'memberId')}
                          disabled={updating}
                          title="メンバーを変更"
                        >
                          👤 メンバー変更
                        </button>
                        <button
                          className="action-btn note-btn"
                          onClick={() => handleEditStart(record, 'note')}
                          disabled={updating}
                          title="メモを編集"
                        >
                          📝 メモ
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(record.id)}
                          disabled={updating}
                          title="記録を削除"
                        >
                          🗑 削除
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="record-author">{record.createdByEmail}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
