'use client';

import React from 'react';

interface ContextMenuProps {
  top: number;
  left: number;
  onClose: () => void;
  actions: Array<{ label: string; action: () => void }>;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ top, left, onClose, actions }) => {
  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    // Also close on escape key
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      style={{ top, left }}
      className="absolute z-50 min-w-[150px] bg-white rounded-md shadow-lg border border-gray-200 py-1"
      // Prevent click inside menu from closing it immediately
      onClick={(e) => e.stopPropagation()}
    >
      <ul>
        {actions.map((item, index) => (
          <li key={index}>
            <button
              onClick={() => {
                item.action();
                onClose(); // Close menu after action
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu; 