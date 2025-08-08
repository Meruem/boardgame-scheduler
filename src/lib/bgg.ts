interface BGGGame {
  id: string;
  name: string;
  complexity: number;
  playingTime: number;
  minPlayers: number;
  maxPlayers: number;
  description?: string;
  thumbnail?: string;
}

interface BGGSearchResult {
  id: string;
  name: string;
  year?: string;
}

export async function searchBoardGames(query: string): Promise<BGGSearchResult[]> {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(`/api/bgg/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from BGG API');
    }

    const results = await response.json();
    return results;
  } catch (error) {
    console.error('Error searching board games:', error);
    return [];
  }
}

export async function getBoardGameDetails(id: string): Promise<BGGGame | null> {
  try {
    const response = await fetch(`/api/bgg/details?id=${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch game details from BGG API');
    }

    const game = await response.json();
    return game;
  } catch (error) {
    console.error('Error fetching board game details:', error);
    return null;
  }
}

// Fallback data for when BGG API is unavailable
export const fallbackGames = [
  { id: '1', name: 'Catan', complexity: 2.3, playingTime: 90, minPlayers: 3, maxPlayers: 4 },
  { id: '2', name: 'Ticket to Ride', complexity: 1.9, playingTime: 60, minPlayers: 2, maxPlayers: 5 },
  { id: '3', name: 'Pandemic', complexity: 2.4, playingTime: 45, minPlayers: 2, maxPlayers: 4 },
  { id: '4', name: 'Carcassonne', complexity: 1.9, playingTime: 45, minPlayers: 2, maxPlayers: 5 },
  { id: '5', name: 'Settlers of Catan', complexity: 2.3, playingTime: 90, minPlayers: 3, maxPlayers: 4 },
  { id: '6', name: 'Dominion', complexity: 2.4, playingTime: 30, minPlayers: 2, maxPlayers: 4 },
  { id: '7', name: '7 Wonders', complexity: 2.3, playingTime: 30, minPlayers: 3, maxPlayers: 7 },
  { id: '8', name: 'Agricola', complexity: 3.6, playingTime: 150, minPlayers: 1, maxPlayers: 5 },
  { id: '9', name: 'Puerto Rico', complexity: 3.3, playingTime: 150, minPlayers: 3, maxPlayers: 5 },
  { id: '10', name: 'Power Grid', complexity: 3.3, playingTime: 120, minPlayers: 2, maxPlayers: 6 },
];

export function searchFallbackGames(query: string): BGGSearchResult[] {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  return fallbackGames
    .filter(game => game.name.toLowerCase().includes(lowerQuery))
    .map(game => ({
      id: game.id,
      name: game.name,
    }))
    .slice(0, 10);
}

export function getFallbackGameDetails(id: string): BGGGame | null {
  const game = fallbackGames.find(g => g.id === id);
  if (!game) return null;
  
  return {
    id: game.id,
    name: game.name,
    complexity: game.complexity,
    playingTime: game.playingTime,
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
  };
}
