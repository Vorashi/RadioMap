import { useEffect, useRef, useState, useCallback } from 'react';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { XYZ, Vector as VectorSource, OSM } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Fill, Stroke, Circle } from 'ol/style';

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

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
  const tileCountRef = useRef({ loaded: 0, total: 0 });
  // eslint-disable-next-line no-unused-vars
  const requestQueueRef = useRef([]);
  // eslint-disable-next-line no-unused-vars
  const isRequestingRef = useRef(false);
  // eslint-disable-next-line no-unused-vars
  const cacheRef = useRef(new Map());

  const resetTileCounter = useCallback(() => {
    tileCountRef.current = { loaded: 0, total: 0 };
  }, []);

  const updateTileProgress = useCallback(() => {
    if (tileCountRef.current.total > 0 && 
        tileCountRef.current.loaded >= tileCountRef.current.total) {
      setIsMapLoaded(true);
    }
  }, []);

  const setupTileListeners = useCallback((source) => {
    if (!source) return;

    source.on('tileloadstart', () => {
      tileCountRef.current.total++;
    });
    
    source.on('tileloadend', () => {
      tileCountRef.current.loaded++;
      updateTileProgress();
    });
    
    source.on('tileloaderror', () => {
      tileCountRef.current.loaded++;
      updateTileProgress();
    });
  }, [updateTileProgress]);

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

    setupTileListeners(mapStyles.osm.layer.getSource());

    const obstacles = new VectorLayer({
      source: new VectorSource(),
      style: obstacleStyle,
      zIndex: 100,
      properties: { type: 'vector' }
    });

    mapInstance.addLayer(obstacles);
    setObstaclesLayer(obstacles);
    setMap(mapInstance);
    setIsMapLoaded(true);

    return () => {
      mapInstance.setTarget(undefined);
      setIsMapLoaded(false);
      resetTileCounter();
    };
  }, [resetTileCounter, setupTileListeners]);

  const changeMapStyle = useCallback((style) => {
    if (!map || !mapStyles[style]) return;
    
    resetTileCounter();
    setIsMapLoaded(false);
    
    // eslint-disable-next-line no-unused-vars
    const vectorLayers = map.getLayers().getArray()
      .filter(layer => layer.get('type') === 'vector');
    
    map.getLayers().getArray()
      .filter(layer => layer.get('type') === 'base')
      .forEach(layer => map.removeLayer(layer));
    
    const newLayer = mapStyles[style].layer;
    setupTileListeners(newLayer.getSource());
    
    map.addLayer(newLayer);
    setCurrentStyle(style);
    
    // Если нет тайлов для загрузки (кешированные)
    if (tileCountRef.current.total === 0) {
      setIsMapLoaded(true);
    }
  }, [map, resetTileCounter, setupTileListeners]);

  const toggleMapStyle = useCallback(() => {
    const styles = Object.keys(mapStyles);
    const currentIndex = styles.indexOf(currentStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    changeMapStyle(styles[nextIndex]);
  }, [changeMapStyle, currentStyle]);

  const getLoadingProgress = useCallback(() => {
    if (tileCountRef.current.total === 0) return 100;
    return Math.min(100, (tileCountRef.current.loaded / tileCountRef.current.total) * 100);
  }, []);

  return { 
    map, 
    mapRef,
    currentStyle,
    changeMapStyle,
    toggleMapStyle,
    mapStyles,
    obstaclesLayer,
    isMapLoaded,
    loadingProgress: getLoadingProgress()
  };
};