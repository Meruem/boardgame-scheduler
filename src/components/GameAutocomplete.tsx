'use client';

import { useState, useEffect, useRef } from 'react';
import { searchBoardGames, getBoardGameDetails, searchFallbackGames, getFallbackGameDetails } from '@/lib/bgg';

interface BGGSearchResult {
  id: string;
  name: string;
  year?: string;
  relevanceScore?: number;
}

interface BGGGame {
  id: string;
  name: string;
  complexity: number;
  minPlayingTime: number;
  maxPlayingTime: number;
  minPlayers: number;
  maxPlayers: number;
  description?: string;
  thumbnail?: string;
}

interface GameAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onGameSelect: (game: BGGGame) => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function GameAutocomplete({ 
  value, 
  onChange, 
  onGameSelect, 
  placeholder = "Search for a board game...",
  className = "",
  inputRef
}: GameAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<BGGSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [useFallback, setUseFallback] = useState(false);
  
  const internalInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Use the passed ref if provided, otherwise use internal ref
  const currentInputRef = inputRef || internalInputRef;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchGames = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      let results: BGGSearchResult[] = [];
      
      if (!useFallback) {
        try {
          results = await searchBoardGames(query);
          // BGG API worked fine, even if no results found
          // Don't switch to fallback just because no games matched the search
        } catch {
          console.log('BGG API failed, using fallback data');
          setUseFallback(true);
          results = searchFallbackGames(query);
        }
      } else {
        results = searchFallbackGames(query);
      }
      
      setSuggestions(results);
    } catch (error) {
      console.error('Error searching games:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
    setShowSuggestions(true);

    // Reset to BGG mode when input is cleared or user starts fresh
    if (newValue.trim().length === 0) {
      setUseFallback(false);
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchGames(newValue);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion: BGGSearchResult) => {
    onChange(suggestion.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    // Fetch game details and auto-fill
    try {
      let gameDetails: BGGGame | null = null;
      
      if (useFallback) {
        gameDetails = getFallbackGameDetails(suggestion.id);
      } else {
        try {
          gameDetails = await getBoardGameDetails(suggestion.id);
        } catch {
          console.log('BGG API failed for details, using fallback');
          gameDetails = getFallbackGameDetails(suggestion.id);
        }
      }

      if (gameDetails) {
        console.log('Game details received:', gameDetails);
        onGameSelect(gameDetails);
      } else {
        console.log('No game details received');
      }
    } catch (error) {
      console.error('Error fetching game details:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={currentInputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-100' : ''
              }`}
            >
              <div className="font-medium text-gray-900">{suggestion.name}</div>
              {suggestion.year && (
                <div className="text-sm text-gray-500">({suggestion.year})</div>
              )}
            </div>
          ))}
        </div>
      )}

      {showSuggestions && !isLoading && suggestions.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <div className="text-gray-500 text-center">No games found</div>
        </div>
      )}
    </div>
  );
}
