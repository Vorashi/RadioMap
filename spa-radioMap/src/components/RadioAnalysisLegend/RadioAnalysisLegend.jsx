import React from 'react';
import '../../App.css';

const RadioAnalysisLegend = ({ visible }) => {
    if (!visible) return null;
    
    return (
        <div className="radio-legend map-overlay">
            <h4>Легенда радиосвязи</h4>
            <div className="legend-item">
                <div className="legend-color green"></div>
                <span>Хорошая связь (LOS + сильный сигнал)</span>
            </div>
            <div className="legend-item">
                <div className="legend-color orange"></div>
                <span>Нет прямой видимости (No LOS)</span>
            </div>
            <div className="legend-item">
                <div className="legend-color red"></div>
                <span>Критическая зона (слабый сигнал или нет LOS)</span>
            </div>
            <div className="legend-item">
                <div className="legend-line dashed"></div>
                <span>Прерывистая связь (возможны потери)</span>
            </div>
        </div>
    );
};

export default RadioAnalysisLegend;