import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ElevationProfile.css';

const ElevationProfile = ({ elevationData, radioAnalysis }) => {
    if (!elevationData || elevationData.length === 0) return null;

    const data = elevationData.map((point, index) => {
        const segment = radioAnalysis?.find(s => s.segment === index);
        return {
            name: `Точка ${index + 1}`,
            elevation: point.elevation,
            status: segment?.isCritical ? 2 : 
                   !segment?.hasLOS ? 1 : 0,
            signalQuality: segment?.signalQuality ? segment.signalQuality * 100 : 0
        };
    });

    return (
        <div className="elevation-profile">
            <h3>Профиль высот и качества связи</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" label={{ value: 'Высота (м)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Качество связи (%)', angle: -90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="elevation" 
                        name="Высота" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                    />
                    <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="signalQuality" 
                        name="Качество связи" 
                        stroke="#82ca9d"
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
            <div className="profile-notes">
                <p>Красные участки на карте соответствуют критическим зонам на графике</p>
            </div>
        </div>
    );
};

export default ElevationProfile;