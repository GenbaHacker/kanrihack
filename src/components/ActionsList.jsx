import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { parseMeetingNotes } from '../utils/parseMeetingNotes'
import { MEMBERS } from '../constants/members'

export default function ActionsList({ user, onBack, onJumpToRecord }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabMode, setTabMode] = useState('actions') // 'actions' or 'questions'
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterMember, setFilterMember] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // 未完了系状態
  const incompleteStatuses = ['未着手', '確認中', '着手予定', '今後の予定', '']

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const recordsRef = collection(db, 'orgs/sawada/records')

      // Query A: shared records
      const qA = query(
        recordsRef,
        where('visibility', '==', 'shared'),
        orderBy('createdAt', 'desc')
      )
      const snapshotA = await getDocs(qA)

      // Query B: private records
      const qB = query(
        recordsRef,
        where('visibility', '==', 'private'),
        where('createdBy', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      const snapshotB = await getDocs(qB)

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
          const aDate = a.meetingDate || a.createdAt.toISOString().split('T')[0]
          const bDate = b.meetingDate || b.createdAt.toISOString().split('T')[0]
          return bDate.localeCompare(aDate)
        })

      setRecords(allRecords)
    } catch (error) {
      console.error('記録読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const extractItems = () => {
    const items = []

    records.forEach((record) => {
      const parsed = parseMeetingNotes(record.body)
      const member = MEMBERS.find((m) => m.id === record.memberId)

      if (tabMode === 'actions') {
        parsed.actionItems.forEach((action) => {
          // フィルター適用（未完了系のみ表示がデフォルト）
          if (!incompleteStatuses.includes(action.status)) {
            return // スキップ
          }
          if (filterAssignee && action.assignee !== filterAssignee) {
            return
          }
          if (filterMember && record.memberId !== filterMember) {
            return
          }
          if (filterStatus && action.status !== filterStatus) {
            return
          }

          items.push({
            recordId: record.id,
            meetingDate: record.meetingDate || record.createdAt.toISOString().split('T')[0],
            memberName: member?.name || record.memberName,
            assignee: action.assignee,
            description: action.description,
            status: action.status,
          })
        })
      } else {
        // Open Questions
        parsed.openQuestions.forEach((question) => {
          if (filterMember && record.memberId !== filterMember) {
            return
          }

          items.push({
            recordId: record.id,
            meetingDate: record.meetingDate || record.createdAt.toISOString().split('T')[0],
            memberName: member?.name || record.memberName,
            question,
          })
        })
      }
    })

    return items
  }

  const getUniqueCandidates = () => {
    if (tabMode === 'actions') {
      const assignees = new Set()
      records.forEach((record) => {
        const parsed = parseMeetingNotes(record.body)
        parsed.actionItems.forEach((action) => {
          if (incompleteStatuses.includes(action.status)) {
            assignees.add(action.assignee)
          }
        })
      })
      return Array.from(assignees).sort()
    }
    return []
  }

  const getUniqueStatuses = () => {
    if (tabMode === 'actions') {
      const statuses = new Set()
      records.forEach((record) => {
        const parsed = parseMeetingNotes(record.body)
        parsed.actionItems.forEach((action) => {
          if (incompleteStatuses.includes(action.status)) {
            statuses.add(action.status || '(未定)')
          }
        })
      })
      return Array.from(statuses).sort()
    }
    return []
  }

  const items = extractItems()
  const assignees = getUniqueCandidates()
  const statuses = getUniqueStatuses()

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-')
    return `${month}/${day}`
  }

  return (
    <div className="actions-list-container">
      <div className="actions-header">
        <button className="back-button" onClick={onBack}>
          ← 戻る
        </button>
        <h2>アクション/未決事項</h2>
      </div>

      <div className="actions-tabs">
        <button
          className={`tab-button ${tabMode === 'actions' ? 'active' : ''}`}
          onClick={() => setTabMode('actions')}
        >
          アクション
        </button>
        <button
          className={`tab-button ${tabMode === 'questions' ? 'active' : ''}`}
          onClick={() => setTabMode('questions')}
        >
          未決事項
        </button>
      </div>

      <div className="actions-filters">
        {tabMode === 'actions' && (
          <>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="filter-select"
            >
              <option value="">全担当者</option>
              {assignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">全状態</option>
              {statuses.map((s) => (
                <option key={s} value={s === '(未定)' ? '' : s}>
                  {s}
                </option>
              ))}
            </select>
          </>
        )}

        <select
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          className="filter-select"
        >
          <option value="">全メンバー</option>
          {MEMBERS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="actions-content">
        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="no-items">
            {tabMode === 'actions' ? 'アクションがありません' : '未決事項がありません'}
          </div>
        ) : (
          <div className="items-table">
            {items.map((item, idx) => (
              <div
                key={`${item.recordId}-${idx}`}
                className="item-row"
                onClick={() => onJumpToRecord(item.recordId, item.memberName)}
              >
                <span className="item-date">{formatDate(item.meetingDate)}</span>
                <span className="item-member">{item.memberName}</span>
                {tabMode === 'actions' ? (
                  <>
                    <span className="item-assignee">{item.assignee}</span>
                    <span className="item-description">{item.description}</span>
                    <span className={`item-status status-${item.status || 'undefined'}`}>
                      {item.status || '未定'}
                    </span>
                  </>
                ) : (
                  <span className="item-question">{item.question}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
