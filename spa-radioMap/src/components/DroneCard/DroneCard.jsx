import React from 'react';
import './DroneCard.css';

const DroneCard = ({ drone, isSelected, onSelect }) => {
    return (
        <div 
            className={`drone-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(drone)}
        >
            <div className="drone-image">
                <img src={drone.image} alt={drone.name} />
            </div>
            <div className="drone-info">
                <h3>{drone.name}</h3>
                <div className="drone-specs">
                    {drone.range && <p><strong>Дальность:</strong> {drone.range} км</p>}
                    {drone.speed && <p><strong>Скорость:</strong> {drone.speed} км/ч</p>}
                    {drone.weight && <p><strong>Вес:</strong> {drone.weight} г</p>}
                </div>
                <p className="drone-description">{drone.description}</p>
            </div>
            <button className="select-button">
                {isSelected ? 'Выбран' : 'Выбрать'}
            </button>
        </div>
    );
};

export default DroneCard;