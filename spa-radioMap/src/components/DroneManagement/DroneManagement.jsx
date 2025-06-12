import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DroneManagement.css';

const DroneManagement = () => {
    const [drones, setDrones] = useState([]);
    const [newDrone, setNewDrone] = useState({
        name: '',
        range: '',
        speed: '',
        weight: '',
        frequency: 2.4,
        camera: '',
        payload: false,
        batteryLife: '',
        description: '',
        image: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchDrones();
    }, []);

    const fetchDrones = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/drones');
            setDrones(response.data);
        } catch (error) {
            console.error('Ошибка при загрузке дронов:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewDrone({
            ...newDrone,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`http://localhost:5000/api/drones/${editingId}`, newDrone);
            } else {
                await axios.post('http://localhost:5000/api/drones', newDrone);
            }
            fetchDrones();
            setNewDrone({
                name: '',
                range: '',
                speed: '',
                weight: '',
                frequency: 2.4,
                camera: '',
                payload: false,
                batteryLife: '',
                description: '',
                image: ''
            });
            setEditingId(null);
        } catch (error) {
            console.error('Ошибка при сохранении дрона:', error);
        }
    };

    const handleEdit = (drone) => {
        setNewDrone(drone);
        setEditingId(drone.id);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/drones/${id}`);
            fetchDrones();
        } catch (error) {
            console.error('Ошибка при удалении дрона:', error);
        }
    };

    return (
        <div className="drone-management">
            <h2>Управление дронами</h2>
            
            <form onSubmit={handleSubmit} className="drone-form">
                <div className="form-row">
                    <label>
                        Название:
                        <input
                            type="text"
                            name="name"
                            value={newDrone.name}
                            onChange={handleInputChange}
                            required
                        />
                    </label>
                    
                    <label>
                        Дальность (км):
                        <input
                            type="number"
                            name="range"
                            value={newDrone.range}
                            onChange={handleInputChange}
                        />
                    </label>
                </div>
                
                <div className="form-row">
                    <label>
                        Скорость (км/ч):
                        <input
                            type="number"
                            name="speed"
                            value={newDrone.speed}
                            onChange={handleInputChange}
                        />
                    </label>
                    
                    <label>
                        Вес (г):
                        <input
                            type="number"
                            name="weight"
                            value={newDrone.weight}
                            onChange={handleInputChange}
                        />
                    </label>
                </div>
                
                <div className="form-row">
                    <label>
                        Частота (ГГц):
                        <select
                            name="frequency"
                            value={newDrone.frequency}
                            onChange={handleInputChange}
                        >
                            <option value="2.4">2.4</option>
                            <option value="5.8">5.8</option>
                        </select>
                    </label>
                    
                    <label>
                        Камера:
                        <input
                            type="text"
                            name="camera"
                            value={newDrone.camera}
                            onChange={handleInputChange}
                        />
                    </label>
                </div>
                
                <div className="form-row">
                    <label className="checkbox-label">
                        Полезная нагрузка:
                        <input
                            type="checkbox"
                            name="payload"
                            checked={newDrone.payload}
                            onChange={handleInputChange}
                        />
                    </label>
                    
                    <label>
                        Время полета (мин):
                        <input
                            type="number"
                            name="batteryLife"
                            value={newDrone.batteryLife}
                            onChange={handleInputChange}
                        />
                    </label>
                </div>
                
                <div className="form-row full-width">
                    <label>
                        Описание:
                        <textarea
                            name="description"
                            value={newDrone.description}
                            onChange={handleInputChange}
                        />
                    </label>
                </div>
                
                <div className="form-row full-width">
                    <label>
                        URL изображения:
                        <input
                            type="text"
                            name="image"
                            value={newDrone.image}
                            onChange={handleInputChange}
                        />
                    </label>
                </div>
                
                <button type="submit" className="submit-button">
                    {editingId ? 'Обновить дрон' : 'Добавить дрон'}
                </button>
            </form>
            
            <div className="drones-list">
                <h3>Список дронов</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Дальность</th>
                            <th>Скорость</th>
                            <th>Камера</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drones.map(drone => (
                            <tr key={drone.id}>
                                <td>{drone.name}</td>
                                <td>{drone.range} км</td>
                                <td>{drone.speed} км/ч</td>
                                <td>{drone.camera || 'Нет'}</td>
                                <td>
                                    <button onClick={() => handleEdit(drone)}>✏️</button>
                                    <button onClick={() => handleDelete(drone.id)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DroneManagement;