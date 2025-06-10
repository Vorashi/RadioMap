import { useState } from 'react';
import { drones } from '../utils/constants';

export const useDroneSelection = () => {
    const [selectedDrone, setSelectedDrone] = useState(drones[0]);
    
    return { selectedDrone, setSelectedDrone };
};