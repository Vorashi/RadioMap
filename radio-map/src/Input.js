import React, { useState } from 'react';

const Input = ({ onAddPoint, onReset }) => {
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');

    const handleAddPoint = (e) => {
        e.preventDefault();
        if (lat && lng) {
            onAddPoint(parseFloat(lat), parseFloat(lng));
            setLat('');
            setLng('');
        }
    };

    const handleReset = () => {
        setLat('');
        setLng('');
        onReset();
    };

    return (
        <form onSubmit={handleAddPoint}>
            <input
                type="text"
                placeholder="Широта"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
            />
            <input
                type="text"
                placeholder="Долгота"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
            />
            <button type="submit" style={{ marginRight: '10px' }}>
                Добавить точку
            </button>
            <button type="button" onClick={handleReset}>
                Сбросить
            </button>
        </form>
    );
};

export default Input;