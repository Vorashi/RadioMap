import { useCallback } from 'react';
import axios from 'axios';

export const useRadioAnalysis = () => {
    const analyzeRoute = useCallback(async (points, droneRange, frequency = 2.4) => {
        try {
            const response = await axios.post('http://localhost:5000/radio-analysis', {
                points,
                droneRange,
                frequency
            });
            return response.data.analysis;
        } catch (error) {
            console.error('Radio analysis error:', error);
            return [];
        }
    }, []);

    return { analyzeRoute };
};