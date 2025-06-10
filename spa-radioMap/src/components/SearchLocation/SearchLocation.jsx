import React from 'react';
import './SearchLocation.css';

const SearchLocation = ({
    searchQuery,
    searchResults,
    showSuggestions,
    searchRef,
    handleSearchChange,
    handleSelectLocation,
    clearSearch,
    setShowSuggestions
}) => {
    return (
        <div className="search-container" ref={searchRef}>
            <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Поиск места..."
                className="search-input"
            />
            {searchQuery && (
                <button 
                    onClick={clearSearch} 
                    className="clear-search-button"
                    aria-label="Очистить поиск"
                >
                    &times;
                </button>
            )}
            {showSuggestions && searchResults.length > 0 && (
                <ul className="suggestions-list">
                    {searchResults.map((result, index) => (
                        <li 
                            key={index} 
                            onClick={() => handleSelectLocation(result)}
                            className="suggestion-item"
                        >
                            <span className="suggestion-main">{result.display_name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchLocation;