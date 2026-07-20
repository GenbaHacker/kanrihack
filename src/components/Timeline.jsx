import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

export default function Timeline({ member, user, onBack }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

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
                  <span className="record-date">
                    {record.meetingDate ? (
                      <>
                        <span className="meeting-date">[面談: {formatMeetingDate(record.meetingDate)}]</span>
                        <span className="created-date">{formatDate(record.createdAt)}</span>
                      </>
                    ) : (
                      formatDate(record.createdAt)
                    )}
                  </span>
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
