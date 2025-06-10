import React from 'react';
import DroneCard from '../DroneCard/DroneCard';
import './DronesList.css';
import { drones } from '../../utils/constants';

const DronesList = ({ selectedDrone, onSelectDrone }) => {
    return (
        <div className="drones-container">
            <h2>Выберите дрон</h2>
            <div className="drones-grid">
                {drones.map(drone => (
                    <DroneCard
                        key={drone.id}
                        drone={drone}
                        isSelected={selectedDrone.id === drone.id}
                        onSelect={onSelectDrone}
                    />
                ))}
            </div>
        </div>
    );
};

export default DronesList;