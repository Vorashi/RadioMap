import React from 'react';
import DroneCard from '../DroneCard/DroneCard';
import './DronesList.css';

const DronesList = ({ selectedDrone, onSelectDrone, drones = [], loading, error }) => {
    if (loading) return <div className="loading-message">Загрузка дронов...</div>;
    if (error) return <div className="error-message">Ошибка: {error}</div>;
    if (!drones || drones.length === 0) return <div className="no-drones-message">Нет доступных дронов</div>;
    
    return (
        <div className="drones-container">
            <h2>Выберите дрон</h2>
            <div className="drones-grid">
                {drones.map(drone => (
                    <DroneCard
                        key={drone.id}
                        drone={drone}
                        isSelected={selectedDrone && selectedDrone.id === drone.id}
                        onSelect={onSelectDrone}
                    />
                ))}
            </div>
        </div>
    );
};

export default DronesList;