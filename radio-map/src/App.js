/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Point, LineString } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Icon, Stroke, Fill, Text } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import axios from 'axios';
import 'ol/ol.css';
import './App.css';

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const drones = [
    { 
        id: 1,
        name: 'DJI Mavic 3', 
        range: 10,
        speed: 65, // км/ч
        weight: 895, // г
        description: 'Компактный дрон для аэрофотосъемки с камерой Hasselblad',
        image: 'https://mydrone.ru/images/ab__webp/thumbnails/550/450/detailed/121/Квадрокоптер_DJI_Mavic_3_Classic__без_пульта__jpg.webp'
    },
    { 
        id: 2,
        name: 'DJI Matrice 300', 
        range: 50,
        speed: 82,
        weight: 3700,
        description: 'Профессиональный промышленный дрон для сложных задач',
        image: 'https://m-files.cdn1.cc/lpfile/b/b/e/bbe19b5a1c7370bc972efa77de5a0122/-/resize/1920/f.jpg?11899100'
    },
    { 
        id: 3,
        name: 'Autel EVO II', 
        range: 100,
        speed: 72,
        weight: 1127,
        description: 'Дрон с 8K камерой и продвинутыми функциями съемки',
        image: 'https://static.insales-cdn.com/r/Z3PCB95Z-tI/rs:fit:550:550:1/plain/images/products/1/4950/932778838/kvadrokopter-autel-robotics-evo-ii-dual-640t-rtk-rugged-bundle-v2.jpg@webp'
    },
    { 
        id: 4,
        name: 'WingtraOne', 
        range: 1000,
        speed: 58,
        weight: 3100,
        description: 'Дрон-самолет для картографии и геодезии',
        image: 'https://i.pinimg.com/originals/b3/65/e7/b365e7f94b29bb230e955de85631520d.png'
    },
    { 
        id: 5,
        name: 'Особый дрон', 
        range: null,
        speed: null,
        weight: null,
        description: 'Кастомная модель без ограничений по дальности',
        image: 'https://cdn-icons-png.flaticon.com/512/3447/3447594.png'
    },
];

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

const App = () => {
    const [map, setMap] = useState(null);
    const [selectedDrone, setSelectedDrone] = useState(drones[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
		const [isMapFullscreen, setIsMapFullscreen] = useState(false);
    const modalRef = useRef(null);
    
    const mapRef = useRef(null);
    const searchRef = useRef(null);
    
    const layersRef = useRef({
        startMarker: null,
        endMarker: null,
        radiusLayer: null,
        lineLayer: null,
        elevationMarkers: null,
        hoverMarker: null,
        searchMarker: null
    });

    // Инициализация карты
    useEffect(() => {
        const newMap = new Map({
            target: mapRef.current,
            layers: [new TileLayer({ source: new OSM() })],
            view: new View({ 
                center: fromLonLat([37.6, 55.7]),
                zoom: 10 
            }),
        });
        setMap(newMap);
        
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            newMap.setTarget(undefined);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

		 // Обработчик клика вне модального окна
		useEffect(() => {
		const handleClickOutside = (event) => {
				if (modalRef.current && !modalRef.current.contains(event.target) && 
						!event.target.closest('.fullscreen-button')) {
						setIsMapFullscreen(false);
				}
		};
		document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Поиск мест
    const searchLocations = async (query) => {
        if (!query || query.length < 3) {
            setSearchResults([]);
            return;
        }
        
        try {
            const response = await axios.get(NOMINATIM_URL, {
                params: {
                    q: query,
                    format: 'json',
                    addressdetails: 1,
                    limit: 10,
                    'accept-language': 'ru'
                }
            });
            
            setSearchResults(response.data);
        } catch (error) {
            console.error('Ошибка поиска:', error);
            setSearchResults([]);
        }
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        searchLocations(query);
    };

    const handleSelectLocation = (location) => {
        setSelectedLocation(location);
        setSearchQuery(location.display_name);
        setShowSuggestions(false);
        
        const coords = fromLonLat([parseFloat(location.lon), parseFloat(location.lat)]);
        
        if (layersRef.current.searchMarker) {
            map.removeLayer(layersRef.current.searchMarker);
        }
        
        const marker = new Feature({
            geometry: new Point(coords)
        });
        
        marker.setStyle(new Style({
            image: new Icon({
                src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                scale: 0.05,
                anchor: [0.5, 1],
            })
        }));
        
        const markerLayer = new VectorLayer({
            source: new VectorSource({ features: [marker] }),
            zIndex: 5
        });
        
        map.addLayer(markerLayer);
        layersRef.current.searchMarker = markerLayer;
        
        map.getView().animate({
            center: coords,
            zoom: 14,
            duration: 1000
        });
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSearchResults([]);
        setSelectedLocation(null);
        setShowSuggestions(false);
        
        if (layersRef.current.searchMarker) {
            map.removeLayer(layersRef.current.searchMarker);
            layersRef.current.searchMarker = null;
        }
    };

    // Очистка всех слоев
    const clearAllLayers = () => {
        if (!map) return;
        
        Object.values(layersRef.current).forEach(layer => {
            if (layer) map.removeLayer(layer);
        });
        
        layersRef.current = {
            startMarker: null,
            endMarker: null,
            radiusLayer: null,
            lineLayer: null,
            elevationMarkers: null,
            hoverMarker: null,
            searchMarker: null
        };
        setHoveredPoint(null);
    };

    // Расчет расстояния
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI/180;
        const dLon = (lon2 - lon1) * Math.PI/180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * 
            Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Проверка точки на попадание в радиус
    const isPointInRadius = (center, point, radius) => {
        if (radius === null) return true;
        const [centerLon, centerLat] = toLonLat(center);
        const [pointLon, pointLat] = toLonLat(point);
        return getDistance(centerLat, centerLon, pointLat, pointLon) <= radius;
    };

    // Создание кругового полигона
    const createRadiusPolygon = (center, radius) => {
        const coordinates = [];
        const [lon, lat] = toLonLat(center);
        const R = 6371;
        
        for (let i = 0; i <= 360; i++) {
            const angle = i * Math.PI / 180;
            const lat2 = Math.asin(Math.sin(lat * Math.PI/180) * 
                         Math.cos(radius/R) + 
                         Math.cos(lat * Math.PI/180) * 
                         Math.sin(radius/R) * 
                         Math.cos(angle));
            const lon2 = lon * Math.PI/180 + Math.atan2(
                Math.sin(angle) * Math.sin(radius/R) * Math.cos(lat * Math.PI/180),
                Math.cos(radius/R) - Math.sin(lat * Math.PI/180) * Math.sin(lat2)
            );
            coordinates.push(fromLonLat([lon2 * 180/Math.PI, lat2 * 180/Math.PI]));
        }
        
        return coordinates;
    };

    // Получение высот точек вдоль маршрута
    const fetchElevationData = async (start, end) => {
        setIsLoading(true);
        try {
            const [startLon, startLat] = toLonLat(start);
            const [endLon, endLat] = toLonLat(end);
            
            const distance = getDistance(startLat, startLon, endLat, endLon);
            const numPoints = Math.max(3, Math.min(20, Math.floor(distance * 2)));
            
            const points = [];
            for (let i = 0; i <= numPoints; i++) {
                const ratio = i / numPoints;
                const lat = startLat + (endLat - startLat) * ratio;
                const lon = startLon + (endLon - startLon) * ratio;
                points.push({ lat, lng: lon });
            }
            
            const response = await axios.post('http://localhost:5000/elevation', { points });
            const elevations = response.data.elevations;
            
            const filteredPoints = [];
            let lastElevation = null;
            
            for (let i = 0; i < points.length; i++) {
                const currentElevation = Math.round(elevations[i]);
                if (currentElevation !== lastElevation || i === 0 || i === points.length - 1) {
                    filteredPoints.push({
                        coords: fromLonLat([points[i].lng, points[i].lat]),
                        elevation: currentElevation
                    });
                    lastElevation = currentElevation;
                }
            }
            
            return filteredPoints;
        } catch (error) {
            console.error('Error fetching elevation data:', error);
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    // Отображение точек с высотами
    const showElevationPoints = (points) => {
        if (!map || !points.length) return;
        
        if (layersRef.current.elevationMarkers) {
            map.removeLayer(layersRef.current.elevationMarkers);
        }
        
        const features = points.map(point => {
            const feature = new Feature({
                geometry: new Point(point.coords),
                elevation: point.elevation
            });
            
            feature.setStyle(new Style({
                image: new Icon({
                    src: 'https://cdn-icons-png.flaticon.com/512/484/484167.png',
                    scale: 0.03,
                    anchor: [0.5, 1],
                })
            }));
            
            return feature;
        });
        
        const markersLayer = new VectorLayer({
            source: new VectorSource({ features }),
            zIndex: 3
        });
        
        map.addLayer(markersLayer);
        layersRef.current.elevationMarkers = markersLayer;
        
        const lineCoords = [
            points[0].coords,
            points[points.length - 1].coords
        ];
        
        const lineExtent = new LineString(lineCoords).getExtent();
        map.getView().fit(lineExtent, {
            padding: [50, 50, 50, 50],
            duration: 1000
        });
    };

    // Показ высоты при наведении
    const showHoverMarker = (point) => {
        if (!map) return;
        
        if (layersRef.current.hoverMarker) {
            map.removeLayer(layersRef.current.hoverMarker);
        }
        
        if (!point) {
            setHoveredPoint(null);
            return;
        }
        
        const feature = new Feature({
            geometry: new Point(point.coords)
        });
        
        feature.setStyle(new Style({
            text: new Text({
                text: `${point.elevation}m`,
                offsetY: -20,
                font: 'bold 14px Arial',
                fill: new Fill({ color: '#000' }),
                stroke: new Stroke({ color: '#fff', width: 3 })
            })
        }));
        
        const markerLayer = new VectorLayer({
            source: new VectorSource({ features: [feature] }),
            zIndex: 4
        });
        
        map.addLayer(markerLayer);
        layersRef.current.hoverMarker = markerLayer;
        setHoveredPoint(point);
    };

    // Обновление радиуса при смене дрона
    const updateRadius = () => {
        if (!map || !layersRef.current.startMarker) return;
        
        if (layersRef.current.radiusLayer) {
            map.removeLayer(layersRef.current.radiusLayer);
        }
        
        const startCoords = layersRef.current.startMarker.getSource().getFeatures()[0].getGeometry().getCoordinates();
        
        if (selectedDrone.range !== null) {
            const radiusCoords = createRadiusPolygon(startCoords, selectedDrone.range);
            const radiusFeature = new Feature({
                geometry: new LineString(radiusCoords)
            });

            const radiusLayer = new VectorLayer({
                source: new VectorSource({ features: [radiusFeature] }),
                style: new Style({
                    stroke: new Stroke({
                        color: 'rgba(0, 0, 255, 0.7)',
                        width: 2
                    }),
                    fill: new Fill({
                        color: 'rgba(0, 0, 255, 0.1)'
                    })
                }),
                zIndex: 1
            });
            
            map.addLayer(radiusLayer);
            layersRef.current.radiusLayer = radiusLayer;
        }
        
        if (layersRef.current.endMarker) {
            const endCoords = layersRef.current.endMarker.getSource().getFeatures()[0].getGeometry().getCoordinates();
            
            if (selectedDrone.range !== null && !isPointInRadius(startCoords, endCoords, selectedDrone.range)) {
                map.removeLayer(layersRef.current.endMarker);
                map.removeLayer(layersRef.current.lineLayer);
                if (layersRef.current.elevationMarkers) {
                    map.removeLayer(layersRef.current.elevationMarkers);
                }
                layersRef.current.endMarker = null;
                layersRef.current.lineLayer = null;
                layersRef.current.elevationMarkers = null;
                setHoveredPoint(null);
            }
        }
    };

    // Обработчик клика
    const handleMapClick = async (event) => {
        if (!selectedDrone) {
            alert('Сначала выберите дрон!');
            return;
        }

        const coordinates = event.coordinate;
        const [lng, lat] = toLonLat(coordinates);

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            alert('Координаты вне допустимого диапазона!');
            return;
        }

        if (!layersRef.current.startMarker) {
            const marker = new Feature({
                geometry: new Point(coordinates)
            });
            
            marker.setStyle(new Style({
                image: new Icon({
                    src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                    scale: 0.05,
                    anchor: [0.5, 1],
                })
            }));

            const markerLayer = new VectorLayer({
                source: new VectorSource({ features: [marker] }),
                zIndex: 2
            });
            
            map.addLayer(markerLayer);
            layersRef.current.startMarker = markerLayer;

            if (selectedDrone.range !== null) {
                updateRadius();
            }
        }
        else if (!layersRef.current.endMarker) {
            const startCoords = layersRef.current.startMarker.getSource().getFeatures()[0].getGeometry().getCoordinates();
            const [startLng, startLat] = toLonLat(startCoords);
            
            const distance = getDistance(startLat, startLng, lat, lng);

            if (selectedDrone.range !== null && distance > selectedDrone.range) {
                alert(`Точка должна быть в пределах ${selectedDrone.range} км от старта!`);
                return;
            }

            const marker = new Feature({
                geometry: new Point(coordinates)
            });
            
            marker.setStyle(new Style({
                image: new Icon({
                    src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                    scale: 0.05,
                    anchor: [0.5, 1],
                })
            }));

            const markerLayer = new VectorLayer({
                source: new VectorSource({ features: [marker] }),
                zIndex: 2
            });
            
            map.addLayer(markerLayer);
            layersRef.current.endMarker = markerLayer;

            const line = new Feature({
                geometry: new LineString([startCoords, coordinates])
            });

            const lineLayer = new VectorLayer({
                source: new VectorSource({ features: [line] }),
                style: new Style({
                    stroke: new Stroke({
                        color: '#3887be',
                        width: 3
                    })
                }),
                zIndex: 1
            });
            
            map.addLayer(lineLayer);
            layersRef.current.lineLayer = lineLayer;

            const elevationPoints = await fetchElevationData(startCoords, coordinates);
            showElevationPoints(elevationPoints);
        }
    };

    // Подписка на события
    useEffect(() => {
        if (!map) return;
        
        const clickHandler = (event) => handleMapClick(event);
        map.on('click', clickHandler);
        
        const pointerMoveHandler = (event) => {
            if (!layersRef.current.elevationMarkers) return;
            
            const features = map.getFeaturesAtPixel(event.pixel, {
                layerFilter: layer => layer === layersRef.current.elevationMarkers,
                hitTolerance: 10
            });
            
            if (features && features.length > 0) {
                const feature = features[0];
                showHoverMarker({
                    coords: feature.getGeometry().getCoordinates(),
                    elevation: feature.get('elevation')
                });
            } else {
                showHoverMarker(null);
            }
        };
        
        map.on('pointermove', pointerMoveHandler);
        
        return () => {
            map.un('click', clickHandler);
            map.un('pointermove', pointerMoveHandler);
        };
    }, [map, selectedDrone]);

    // Обновляем радиус при смене дрона
    useEffect(() => {
        if (layersRef.current.startMarker) {
            updateRadius();
            
            if (selectedDrone.range === null && layersRef.current.radiusLayer) {
                map.removeLayer(layersRef.current.radiusLayer);
                layersRef.current.radiusLayer = null;
            }
        }
    }, [selectedDrone]);

		return (
			<div className="app-container">
					<h1>Маршрут дрона</h1>
					
					<div className="controls">
							<div className="search-container" ref={searchRef}>
								{/* Поисковая строка*/}
							</div>
							
							<button onClick={clearAllLayers} className="reset-button">
									Сбросить маршрут
							</button>
							
							{isLoading && <div className="loading">Загрузка данных о высотах...</div>}
					</div>

					<div className={`map-wrapper ${isMapFullscreen ? 'fullscreen' : ''}`}>
							<div 
									ref={mapRef} 
									className="map-container"
									style={{ height: isMapFullscreen ? '100vh' : '50vh' }}
							/>
							<button 
									className="fullscreen-button"
									onClick={() => setIsMapFullscreen(!isMapFullscreen)}
							>
									{isMapFullscreen ? (
											<svg viewBox="0 0 24 24" width="24" height="24">
													<path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
											</svg>
									) : (
											<svg viewBox="0 0 24 24" width="24" height="24">
													<path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
											</svg>
									)}
							</button>
					</div>

					{isMapFullscreen && (
							<div className="modal-overlay">
									<div className="modal-content" ref={modalRef}>
											<div className="modal-header">
													<h2>Карта маршрута</h2>
													<button 
															className="close-button"
															onClick={() => setIsMapFullscreen(false)}
													>
															&times;
													</button>
											</div>
											<div className="modal-map-container">
													<div 
															ref={mapRef} 
															className="map-container"
															style={{ height: 'calc(100vh - 60px)' }}
													/>
											</div>
									</div>
							</div>
					)}

					<div className="drones-container">
							<h2>Выберите дрон</h2>
							<div className="drones-grid">
									{drones.map(drone => (
											<DroneCard
													key={drone.id}
													drone={drone}
													isSelected={selectedDrone.id === drone.id}
													onSelect={setSelectedDrone}
											/>
									))}
							</div>
					</div>
			</div>
		);
	};

export default App;