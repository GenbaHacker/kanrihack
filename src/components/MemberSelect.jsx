import { useState } from 'react';
import { MEMBERS } from '../constants/members';

export default function MemberSelect({ onMemberSelect }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (member) => {
    setSelected(member.id);
    onMemberSelect(member);
  };

  return (
    <div className="member-select-container">
      <h1>メンバーを選択</h1>
      <div className="member-grid">
        {MEMBERS.map((member) => (
          <button
            key={member.id}
            className={`member-button ${selected === member.id ? 'active' : ''}`}
            onClick={() => handleSelect(member)}
          >
            {member.name}
          </button>
        ))}
      </div>
    </div>
  );
}
