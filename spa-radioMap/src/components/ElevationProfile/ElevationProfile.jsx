import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../App.css';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const elevation = payload[0].value;
    const signalQuality = payload[1].value;
    const status = payload[0].payload.status;

    let statusText = '';
    let statusClass = '';
    
    if (status === 'good') {
        statusText = 'Хорошая связь';
        statusClass = 'signal-good';
    } else if (status === 'no-los') {
        statusText = 'Нет прямой видимости';
        statusClass = 'signal-warning';
    } else {
        statusText = 'Критическая зона';
        statusClass = 'signal-critical';
    }

    return (
        <div className="chart-tooltip">
            <p>Точка: <strong>{label}</strong></p>
            <p>Высота: <strong>{elevation} м</strong></p>
            <p>Качество связи: <strong>{signalQuality}%</strong></p>
            <p>Статус: <span className={`signal-status ${statusClass}`}>{statusText}</span></p>
        </div>
    );
};

const ElevationProfile = ({ elevationData, radioAnalysis }) => {
    if (!elevationData || elevationData.length === 0) return null;

    const chartData = elevationData.map((point, index) => {
        const segment = radioAnalysis && radioAnalysis[index];
        return {
            point: `Точка ${index + 1}`,
            elevation: point.elevation,
            signalQuality: segment ? Math.round(segment.signalQuality * 100) : 100,
            status: segment ? (segment.isCritical ? 'critical' : !segment.hasLOS ? 'no-los' : 'good') : 'good'
        };
    });

    return (
        <div className="elevation-profile-container">
            <h3>Анализ маршрута</h3>
            <p>Профиль высот и качества связи между точками</p>
            
            <div className="elevation-chart">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis 
                            dataKey="point" 
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Точки маршрута', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                            yAxisId="left" 
                            label={{ value: 'Высота (м)', angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            label={{ value: 'Качество (%)', angle: -90, position: 'insideRight' }}
                            domain={[0, 100]}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="elevation" 
                            name="Высота" 
                            stroke="#8884d8"
                            strokeWidth={2}
                            activeDot={{ r: 6 }} 
                            dot={{ r: 2 }}
                        />
                        <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="signalQuality" 
                            name="Качество связи" 
                            stroke="#82ca9d"
                            strokeWidth={2}
                            dot={{ r: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            <div className="profile-notes">
                {radioAnalysis && radioAnalysis.some(s => s.isCritical) ? (
                    <p className="signal-critical">
                        ⚠️ Внимание! На маршруте есть критические участки с плохой связью (отмечены красным на карте)
                    </p>
                ) : (
                    <p className="signal-good">
                        ✓ Качество связи на маршруте стабильное
                    </p>
                )}
            </div>
        </div>
    );
};

export default ElevationProfile;