import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function Timeline({ member, user, onBack }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editingDate, setEditingDate] = useState('')
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
      ].sort((a, b) => {
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
    // meetingDate is YYYY-MM-DD format
    const [year, month, day] = meetingDate.split('-')
    return `${month}/${day}`
  }

  const handleEditStart = (record) => {
    setEditingId(record.id)
    setEditingDate(record.meetingDate || '')
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingDate('')
  }

  const handleEditSave = async (recordId) => {
    if (!editingDate.trim()) {
      alert('面談日を入力してください')
      return
    }

    setUpdating(true)
    try {
      const recordRef = doc(db, 'orgs/sawada/records', recordId)
      await updateDoc(recordRef, {
        meetingDate: editingDate,
      })

      // Reload records to apply sorting
      await loadRecords()
      setEditingId(null)
      setEditingDate('')
    } catch (error) {
      console.error('更新エラー:', error)
      alert('更新に失敗しました: ' + error.message)
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
                  {editingId === record.id ? (
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
                      <button
                        className="edit-cancel-btn"
                        onClick={handleEditCancel}
                        disabled={updating}
                      >
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
                          onClick={() => handleEditStart(record)}
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
                <div className="record-author">{record.createdByEmail}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
