import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-modal-overlay" onClick={onClose}>
      <div className="confirmation-modal-content" onClick={e => e.stopPropagation()}>
        <div className="confirmation-modal-title">{title}</div>
        <div className="confirmation-modal-message">{message}</div>
        <div className="confirmation-modal-actions">
          <button className="confirmation-btn cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className="confirmation-btn confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
