import { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { XYZ, Vector as VectorSource, OSM } from 'ol/source';
import { fromLonLat, toLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Fill, Stroke, Circle } from 'ol/style';

const mapStyles = {
  osm: {
    name: 'OSM Standard',
    layer: new TileLayer({ 
      source: new OSM(),
      properties: { type: 'base' }
    })
  },
  topo: {
    name: 'Topographic',
    layer: new TileLayer({
      source: new XYZ({
        url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png'
      }),
      properties: { type: 'base' }
    })
  },
  satellite: {
    name: 'Satellite',
    layer: new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      }),
      properties: { type: 'base' }
    })
  }
};

const obstacleStyle = (feature) => {
  const type = feature.get('type') || feature.get('natural') || feature.get('building');
  const height = feature.get('height') || (type === 'tree' ? 10 : 5);

  return new Style({
    fill: new Fill({
      color: type === 'tree' 
        ? 'rgba(0, 128, 0, 0.5)' 
        : 'rgba(200, 100, 50, 0.7)'
    }),
    stroke: new Stroke({
      color: type === 'tree' ? 'darkgreen' : '#333',
      width: 1
    }),
    image: type === 'tree' ? new Circle({
      radius: 5,
      fill: new Fill({ color: 'green' })
    }) : null,
    zIndex: height
  });
};

export const useMap = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [currentStyle, setCurrentStyle] = useState('osm');
  const [obstaclesLayer, setObstaclesLayer] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    const view = new View({ 
      center: fromLonLat([37.6, 55.7]),
      zoom: 10 
    });

    const mapInstance = new Map({
      target: mapRef.current,
      layers: [mapStyles.osm.layer],
      view,
      controls: defaultControls({
        zoom: false,
        rotate: false
      })
    });

    const obstacles = new VectorLayer({
      source: new VectorSource(),
      style: obstacleStyle,
      zIndex: 100,
      properties: { type: 'vector' }
    });

    mapInstance.addLayer(obstacles);
    setObstaclesLayer(obstacles);
    setMap(mapInstance);

    mapInstance.once('postrender', () => {
      setIsMapLoaded(true);
    });

    return () => {
      mapInstance.setTarget(undefined);
      setIsMapLoaded(false);
    };
  }, []);

  const changeMapStyle = (style) => {
    if (!map || !mapStyles[style]) return;
    
    // Удаляем все векторные слои (включая маркеры и радиус)
    map.getLayers().getArray().forEach(layer => {
      if (layer.get('type') === 'vector') {
        map.removeLayer(layer);
      }
    });
    
    // Удаляем все базовые слои
    map.getLayers().getArray().forEach(layer => {
      if (layer.get('type') === 'base') {
        map.removeLayer(layer);
      }
    });
    
    // Добавляем новый базовый слой
    const newLayer = mapStyles[style].layer;
    map.addLayer(newLayer);
    
    // Восстанавливаем слой препятствий
    if (obstaclesLayer) {
      map.addLayer(obstaclesLayer);
    }
    
    setCurrentStyle(style);
  };

  const toggleMapStyle = () => {
    const styles = Object.keys(mapStyles);
    const currentIndex = styles.indexOf(currentStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    changeMapStyle(styles[nextIndex]);
  };

  const updateObstacles = (bbox) => {
    if (!obstaclesLayer) return;
    
    const southWest = toLonLat([bbox[0], bbox[1]]);
    const northEast = toLonLat([bbox[2], bbox[3]]);
    
    const overpassBbox = `${southWest[1]},${southWest[0]},${northEast[1]},${northEast[0]}`;
    
    const query = `[out:json];
      (
        way["building"](${overpassBbox});
        node["natural"="tree"](${overpassBbox});
        way["barrier"](${overpassBbox});
      );
      out body;
      >;
      out skel qt;`;
    
    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        const features = new GeoJSON().readFeatures(data);
        obstaclesLayer.getSource().addFeatures(features);
      })
      .catch(error => {
        console.error('Error fetching obstacles:', error);
      });
  };

  return { 
    map, 
    mapRef,
    currentStyle,
    changeMapStyle,
    toggleMapStyle,
    mapStyles,
    obstaclesLayer,
    updateObstacles,
    isMapLoaded
  };
};