import { useState, useEffect } from 'react';
import axios from 'axios';

export const useDroneSelection = () => {
    const [selectedDrone, setSelectedDrone] = useState(null);
    const [drones, setDrones] = useState([]); // Инициализируем пустым массивом
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDrones = async () => {
						console.log('Fetching drones...'); // Добавьте это
            try {
                const response = await axios.get('http://localhost:5000/api/drones');
								console.log('Drones response:', response);
                setDrones(response.data || []); // Добавляем fallback на случай если response.data undefined
                if (response.data && response.data.length > 0) {
                    setSelectedDrone(response.data[0]);
                }
            } catch (err) {
                console.error('Error fetching drones:', err);
                setError(err.message);
                setDrones([]); // Убедимся что drones всегда массив
            } finally {
                setLoading(false);
            }
        };

        fetchDrones();
    }, []);

    return { 
        selectedDrone, 
        setSelectedDrone, 
        drones,
        loading,
        error
    };
};