import React from 'react';
import './MapControls.css';

const MapControls = ({ onReset, isLoading }) => {
    return (
        <div className="controls">
            <button onClick={onReset} className="reset-button">
                Сбросить маршрут
            </button>
            {isLoading && <div className="loading">Загрузка данных о высотах...</div>}
        </div>
    );
};

export default MapControls;