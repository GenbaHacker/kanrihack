import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { auth } from '../firebase'

export default function InputScreen({ member, onBack, user }) {
  const [activeTab, setActiveTab] = useState('text')
  const [isShared, setIsShared] = useState(true)
  const [textValue, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleAddRecord = async () => {
    if (!textValue.trim()) {
      setMessage('テキストが空です')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const recordsRef = collection(db, 'orgs/sawada/records')
      await addDoc(recordsRef, {
        memberId: member.id,
        memberName: member.name,
        type: 'text',
        body: textValue,
        visibility: isShared ? 'shared' : 'private',
        createdBy: auth.currentUser.uid,
        createdByEmail: auth.currentUser.email,
        createdAt: serverTimestamp(),
      })

      setMessage('追記しました')
      setText('')
      setTimeout(() => setMessage(''), 2000)
    } catch (error) {
      console.error('保存エラー:', error)
      setMessage('エラー: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="input-screen-container">
      <div className="input-header">
        <button className="back-button" onClick={onBack}>
          ← 戻る
        </button>
        <div className="header-info">
          <h2>{member.name}</h2>
          <div className="share-toggle">
            <label>
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
              />
              <span>{isShared ? '共有' : '非公開'}</span>
            </label>
          </div>
        </div>
      </div>

      <div className="input-tabs">
        <button
          className={`tab-button ${activeTab === 'record' ? 'active' : ''}`}
          onClick={() => setActiveTab('record')}
        >
          録音
        </button>
        <button
          className={`tab-button ${activeTab === 'file' ? 'active' : ''}`}
          onClick={() => setActiveTab('file')}
        >
          ファイル
        </button>
        <button
          className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          テキスト
        </button>
      </div>

      <div className="input-content">
        {activeTab === 'record' && (
          <div className="tab-pane record-tab">
            <button className="primary-button" disabled>
              開始
            </button>
            <div className="timer">0:00</div>
          </div>
        )}

        {activeTab === 'file' && (
          <div className="tab-pane file-tab">
            <button className="secondary-button" disabled>
              Google Driveから選ぶ
            </button>
            <button className="secondary-button" disabled>
              この端末から選ぶ
            </button>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="tab-pane text-tab">
            <textarea
              className="input-textarea"
              placeholder="テキストを入力..."
              value={textValue}
              onChange={(e) => setText(e.target.value)}
              disabled={saving}
            />
            {message && (
              <div className={`message ${saving ? 'saving' : 'success'}`}>{message}</div>
            )}
            <button
              className="primary-button"
              onClick={handleAddRecord}
              disabled={saving || !textValue.trim()}
            >
              {saving ? '保存中...' : '追記'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
