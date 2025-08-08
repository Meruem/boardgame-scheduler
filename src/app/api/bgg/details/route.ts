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
      `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1&type=boardgame`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch game details from BGG API');
    }

    const xmlText = await response.text();
    
    // Debug: Log the XML response
    console.log(`BGG Details for ID ${id}: XML length: ${xmlText.length}`);
    console.log(`XML sample: ${xmlText.substring(0, 2000)}...`);
    
    // Debug: Search for specific patterns in the XML
    const hasAverageweight = xmlText.includes('averageweight');
    const hasPlayingtime = xmlText.includes('playingtime');
    const hasMinplayers = xmlText.includes('minplayers');
    const hasMaxplayers = xmlText.includes('maxplayers');
    
    console.log(`XML contains:`, {
      averageweight: hasAverageweight,
      playingtime: hasPlayingtime,
      minplayers: hasMinplayers,
      maxplayers: hasMaxplayers,
    });
    
    // Debug: Find the actual positions of these fields
    if (hasAverageweight) {
      const avgIndex = xmlText.indexOf('averageweight');
      console.log(`averageweight found at position: ${avgIndex}`);
      console.log(`averageweight context: ${xmlText.substring(avgIndex - 50, avgIndex + 100)}`);
    }
    if (hasPlayingtime) {
      const timeIndex = xmlText.indexOf('playingtime');
      console.log(`playingtime found at position: ${timeIndex}`);
      console.log(`playingtime context: ${xmlText.substring(timeIndex - 50, timeIndex + 100)}`);
    }
    
    // Parse XML using regex for basic extraction
    // Try to find name with value attribute first, then fallback to text content
    let nameMatch = xmlText.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"[^>]*\/>/);
    if (!nameMatch) {
      nameMatch = xmlText.match(/<name[^>]*type="primary"[^>]*>([^<]*)<\/name>/);
    }
    
    // Parse complexity (averageweight) - try multiple patterns
    let complexityMatch = xmlText.match(/<averageweight>([^<]*)<\/averageweight>/);
    if (!complexityMatch) {
      complexityMatch = xmlText.match(/<statistics[^>]*>[\s\S]*?<ratings[^>]*>[\s\S]*?<averageweight>([^<]*)<\/averageweight>/);
    }
    if (!complexityMatch) {
      complexityMatch = xmlText.match(/<statistics[^>]*>[\s\S]*?<averageweight>([^<]*)<\/averageweight>/);
    }
    if (!complexityMatch) {
      // Try to find averageweight in the entire XML
      complexityMatch = xmlText.match(/<averageweight[^>]*>([^<]*)<\/averageweight>/);
    }
    
    // Parse playing time - try multiple patterns
    let playingTimeMatch = xmlText.match(/<playingtime>([^<]*)<\/playingtime>/);
    if (!playingTimeMatch) {
      playingTimeMatch = xmlText.match(/<statistics[^>]*>[\s\S]*?<playingtime>([^<]*)<\/playingtime>/);
    }
    if (!playingTimeMatch) {
      // Try to find playingtime in the main item section
      playingTimeMatch = xmlText.match(/<item[^>]*>[\s\S]*?<playingtime>([^<]*)<\/playingtime>/);
    }
    if (!playingTimeMatch) {
      // Try to find playingtime anywhere in the XML
      playingTimeMatch = xmlText.match(/<playingtime[^>]*>([^<]*)<\/playingtime>/);
    }
    
    // Parse player counts - try multiple patterns
    let minPlayersMatch = xmlText.match(/<minplayers>([^<]*)<\/minplayers>/);
    if (!minPlayersMatch) {
      minPlayersMatch = xmlText.match(/<minplayers[^>]*>([^<]*)<\/minplayers>/);
    }
    
    let maxPlayersMatch = xmlText.match(/<maxplayers>([^<]*)<\/maxplayers>/);
    if (!maxPlayersMatch) {
      maxPlayersMatch = xmlText.match(/<maxplayers[^>]*>([^<]*)<\/maxplayers>/);
    }
    const descriptionMatch = xmlText.match(/<description>([\s\S]*?)<\/description>/);
    const thumbnailMatch = xmlText.match(/<thumbnail>([^<]*)<\/thumbnail>/);

    const complexity = complexityMatch ? parseFloat(complexityMatch[1]) : 0;
    const playingTime = playingTimeMatch ? parseInt(playingTimeMatch[1]) : 0;
    const minPlayers = minPlayersMatch ? parseInt(minPlayersMatch[1]) : 1;
    const maxPlayers = maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : 4;

    console.log(`Raw parsed values:`, {
      complexityMatch: complexityMatch ? complexityMatch[1] : 'not found',
      playingTimeMatch: playingTimeMatch ? playingTimeMatch[1] : 'not found',
      minPlayersMatch: minPlayersMatch ? minPlayersMatch[1] : 'not found',
      maxPlayersMatch: maxPlayersMatch ? maxPlayersMatch[1] : 'not found',
    });
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

    console.log(`Parsed game data:`, {
      id,
      name: game.name,
      complexity: game.complexity,
      playingTime: game.minPlayingTime,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error fetching board game details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game details' }, 
      { status: 500 }
    );
  }
}
