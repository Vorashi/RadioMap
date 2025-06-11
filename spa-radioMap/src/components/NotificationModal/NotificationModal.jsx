import React from 'react';
import './NotificationModal.css';

const NotificationModal = ({ message, isOpen, onClose, type = 'info' }) => {
  if (!isOpen) return null;

  const modalConfig = {
    info: {
      title: 'Информация',
      icon: 'ℹ️',
      color: '#3887be'
    },
    warning: {
      title: 'Внимание',
      icon: '⚠️',
      color: '#ff9800'
    },
    error: {
      title: 'Ошибка',
      icon: '❌',
      color: '#f44336'
    },
    success: {
      title: 'Успех',
      icon: '✅',
      color: '#4caf50'
    }
  };

  const { title, icon, color } = modalConfig[type];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header" style={{ backgroundColor: color }}>
          <span className="modal-icon">{icon}</span>
          <h3 className="modal-title">{title}</h3>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        <div className="modal-footer">
          <button 
            className="modal-close-button"
            onClick={onClose}
            style={{ backgroundColor: color }}
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;