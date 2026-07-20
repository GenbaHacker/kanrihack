import { useState } from 'react';

export default function InputScreen({ member, onBack }) {
  const [activeTab, setActiveTab] = useState('text');
  const [isShared, setIsShared] = useState(false);
  const [textValue, setText] = useState('');

  return (
    <div className="input-screen-container">
      <div className="input-header">
        <button className="back-button" onClick={onBack}>← 戻る</button>
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
            <button className="primary-button">開始</button>
            <div className="timer">0:00</div>
          </div>
        )}

        {activeTab === 'file' && (
          <div className="tab-pane file-tab">
            <button className="secondary-button">Google Driveから選ぶ</button>
            <button className="secondary-button">この端末から選ぶ</button>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="tab-pane text-tab">
            <textarea
              className="input-textarea"
              placeholder="テキストを入力..."
              value={textValue}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="primary-button">追記</button>
          </div>
        )}
      </div>
    </div>
  );
}
