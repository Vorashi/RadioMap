import { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import { Tile as TileLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import { fromLonLat } from 'ol/proj';

export const useMap = () => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);

    useEffect(() => {
        if (!mapRef.current) return;

        const newMap = new Map({
            target: mapRef.current,
            layers: [new TileLayer({ source: new OSM() })],
            view: new View({ 
                center: fromLonLat([37.6, 55.7]),
                zoom: 10 
            }),
        });

        setMap(newMap);

        return () => {
            newMap.setTarget(undefined);
        };
    }, []);

    return { map, mapRef }; // Теперь возвращаем и карту и ref
};