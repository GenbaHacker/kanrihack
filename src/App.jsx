import { useState } from 'react';
import MemberSelect from './components/MemberSelect';
import InputScreen from './components/InputScreen';
import './App.css';

export default function App() {
  const [selectedMember, setSelectedMember] = useState(null);

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
  };

  const handleBack = () => {
    setSelectedMember(null);
  };

  return (
    <div className="app">
      <div className="app-layout">
        {!selectedMember ? (
          <MemberSelect onMemberSelect={handleMemberSelect} />
        ) : (
          <>
            {/* PC: 左側メンバーリスト常時表示 */}
            <div className="sidebar">
              <MemberSelect onMemberSelect={handleMemberSelect} />
            </div>
            {/* PC/モバイル: 右側入力エリア */}
            <div className="main-content">
              <InputScreen member={selectedMember} onBack={handleBack} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
