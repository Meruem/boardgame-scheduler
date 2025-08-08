import { NextResponse } from "next/server";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch game details from BGG API');
    }

    const xmlText = await response.text();
    
    // Parse XML using regex for basic extraction
    // Try to find name with value attribute first, then fallback to text content
    let nameMatch = xmlText.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"[^>]*\/>/);
    if (!nameMatch) {
      nameMatch = xmlText.match(/<name[^>]*type="primary"[^>]*>([^<]*)<\/name>/);
    }
    
    // Parse complexity (averageweight) - try different possible locations
    let complexityMatch = xmlText.match(/<averageweight>([^<]*)<\/averageweight>/);
    if (!complexityMatch) {
      complexityMatch = xmlText.match(/<statistics[^>]*>[\s\S]*?<ratings[^>]*>[\s\S]*?<averageweight>([^<]*)<\/averageweight>/);
    }
    
    // Parse playing time - try different possible locations
    let playingTimeMatch = xmlText.match(/<playingtime>([^<]*)<\/playingtime>/);
    if (!playingTimeMatch) {
      playingTimeMatch = xmlText.match(/<statistics[^>]*>[\s\S]*?<playingtime>([^<]*)<\/playingtime>/);
    }
    
    const minPlayersMatch = xmlText.match(/<minplayers>([^<]*)<\/minplayers>/);
    const maxPlayersMatch = xmlText.match(/<maxplayers>([^<]*)<\/maxplayers>/);
    const descriptionMatch = xmlText.match(/<description>([\s\S]*?)<\/description>/);
    const thumbnailMatch = xmlText.match(/<thumbnail>([^<]*)<\/thumbnail>/);

    const complexity = complexityMatch ? parseFloat(complexityMatch[1]) : 0;
    const playingTime = playingTimeMatch ? parseInt(playingTimeMatch[1]) : 0;
    const minPlayers = minPlayersMatch ? parseInt(minPlayersMatch[1]) : 1;
    const maxPlayers = maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : 4;
    const description = descriptionMatch ? descriptionMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : undefined;
    const thumbnail = thumbnailMatch ? thumbnailMatch[1] : undefined;

    const game: BGGGame = {
      id,
      name: nameMatch ? nameMatch[1] : '',
      complexity: Math.min(5, Math.max(0, complexity)), // Clamp to 0-5 range
      minPlayingTime: playingTime,
      maxPlayingTime: playingTime,
      minPlayers,
      maxPlayers,
      description,
      thumbnail,
    };

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error fetching board game details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game details' }, 
      { status: 500 }
    );
  }
}
