import { useState, useRef, useCallback } from 'react';
import { searchLocations } from '../utils/api';
import { fromLonLat } from 'ol/proj';

export const useLocationSearch = (map) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);

    const handleSearchChange = useCallback(async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (!query || query.length < 3) {
            setSearchResults([]);
            return;
        }
        
        try {
            const results = await searchLocations(query);
            setSearchResults(results);
        } catch (error) {
            console.error('Ошибка поиска:', error);
            setSearchResults([]);
        }
    }, []);

    const handleSelectLocation = useCallback((location) => {
        setSelectedLocation(location);
        setSearchQuery(location.display_name);
        setShowSuggestions(false);
        
        if (map) {
            const coords = fromLonLat([
                parseFloat(location.lon), 
                parseFloat(location.lat)
            ]);
            
            // Только приближение к координатам, без добавления маркера
            map.getView().animate({
                center: coords,
                zoom: 14,
                duration: 1000
            });
        }
    }, [map]);

    const clearSearch = useCallback(() => {
        setSearchQuery("");
        setSearchResults([]);
        setSelectedLocation(null);
        setShowSuggestions(false);
    }, []);

    return {
        searchQuery,
        searchResults,
        selectedLocation,
        showSuggestions,
        searchRef,
        handleSearchChange,
        handleSelectLocation,
        clearSearch,
        setShowSuggestions
    };
};