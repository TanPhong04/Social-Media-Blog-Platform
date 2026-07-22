import React, { useState } from 'react';

const EMOJI_CATEGORIES = [
  { icon: '🕒', title: 'Gần đây', emojis: ['😊', '😂', '🤣', '👍', '❤️', '🔥', '🎉', '✨', '👏', '😍', '🥰', '😘'] },
  { icon: '😀', title: 'Mặt cười & con người', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😓', '🤔'] },
  { icon: '🐱', title: 'Động vật & thiên nhiên', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞'] },
  { icon: '🍎', title: 'Đồ ăn & thức uống', emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🧅', '🥖', '🥨', '🧀', '🍕', '🌭', '🍔', '🍟', '🍺', '🍻', '🍷', '🥤', '🧋'] },
  { icon: '⚽', title: 'Hoạt động & thể thao', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🏆', '🥇', '🥈', '🥉', '🎖️', '🎗️', '🎫', '🎟️', '🎪', '🎨', '🎭', '🎬', '🎤', '🎧', '🎼', '🥁'] },
  { icon: '🚗', title: 'Du lịch & địa điểm', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🚲', '🛴', '🛺', '🚂', '🚆', '🚄', '🚅', '🚈', '🚇', '🚀', '🛸', '🚁', '🛶', '⛵', '🛥️', '🛳️', '🚢', '✈️', '🛫', '🛬', '🪂', '🪟', '🌋', '🗻', '🏠'] },
  { icon: '💡', title: 'Đồ vật & bóng đèn', emojis: ['💡', '🔦', '🕯️', '🔌', '🔋', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🎛️', '🎞️', '📷', '📸', '📹', '🎥', '📻', '🎙️', '🎚️', '🎛️', '📺', '⏰', '⌚', '🧭', '⌛', '⏳', '🪓', '🛡️', '🔑', '🗝️', '🔨', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣'] },
  { icon: '🔣', title: 'Ký hiệu & biểu tượng', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐'] }
];

const EMOJI_KEYWORDS: { [key: string]: string } = {
  '😊': 'cuoi vui ve mat cuoi smile happy',
  '😂': 'cuoi ra nuoc mat haha cuoi to lol joy',
  '🤣': 'cuoi lan lon haha rofl',
  '😍': 'yeu thich love heart eyes',
  '🥰': 'yeu thuong hanh phuc love hearts',
  '😘': 'hon kiss blowing kiss',
  '👍': 'like thich tot nhat ok good yes',
  '👎': 'dislike khong thich bad no',
  '❤️': 'tim do love heart red',
  '🔥': 'lua hot fire trend',
  '🎉': 'chuc mung party celebrate',
  '✨': 'lap lanh lanh lay sparkle',
  '👏': 'vo tay clap bravo',
  '😭': 'khoc to cry sad'
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [searchEmoji, setSearchEmoji] = useState('');
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  const allEmojis = EMOJI_CATEGORIES.flatMap(c => c.emojis);
  const filteredEmojis = searchEmoji.trim()
    ? allEmojis.filter(emoji => {
        const keywords = EMOJI_KEYWORDS[emoji] || '';
        return keywords.toLowerCase().includes(searchEmoji.toLowerCase()) || emoji === searchEmoji.trim();
      })
    : EMOJI_CATEGORIES[activeTab].emojis;

  return (
    <div className="absolute right-0 top-10 bg-surface border border-border-default rounded-2xl p-3.5 shadow-2xl z-50 w-72 flex flex-col gap-2.5 animate-fade-in">
      {/* Search box */}
      <div className="relative">
        <input
          type="text"
          value={searchEmoji}
          onChange={(e) => setSearchEmoji(e.target.value)}
          placeholder="Tìm kiếm biểu tượng cảm xúc"
          className="w-full bg-base border border-border-default text-text-primary text-xs rounded-full pl-8 pr-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary placeholder-text-muted transition-colors"
        />
        <span className="absolute left-3 top-2 text-text-muted text-xs">🔍</span>
      </div>

      {/* Category tabs */}
      <div className="flex justify-between border-b border-border-default pb-1.5 overflow-x-auto">
        {EMOJI_CATEGORIES.map((cat, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setActiveTab(idx);
              setSearchEmoji('');
            }}
            className={`text-lg p-1.5 rounded transition-all cursor-pointer ${searchEmoji === '' && activeTab === idx ? 'bg-primary/20 scale-110 border-b-2 border-primary' : 'hover:bg-surface-elevated opacity-70 hover:opacity-100'}`}
            title={cat.title}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      <div className="text-xs font-bold text-text-secondary">
        {searchEmoji.trim() ? 'Kết quả tìm kiếm' : EMOJI_CATEGORIES[activeTab].title}
      </div>
      
      <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
        {filteredEmojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onMouseEnter={() => setHoveredEmoji(emoji)}
            onClick={() => onEmojiSelect(emoji)}
            className="text-xl hover:bg-surface-elevated p-1.5 rounded transition-colors cursor-pointer text-center"
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border-default pt-2 mt-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{hoveredEmoji || '😊'}</span>
          <span className="text-[10px] text-text-secondary font-medium">Nhấp để chèn</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center font-bold text-xs shadow cursor-pointer transition-all hover:scale-105"
          title="Hoàn tất"
        >
          ✓
        </button>
      </div>
    </div>
  );
};
