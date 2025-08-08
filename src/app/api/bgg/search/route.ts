import { NextResponse } from "next/server";

interface BGGSearchResult {
  id: string;
  name: string;
  year?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from BGG API');
    }

    const xmlText = await response.text();
    
    // Simple XML parsing using regex (for basic extraction)
    const itemMatches = xmlText.match(/<item[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/item>/g);
    const results: BGGSearchResult[] = [];

    if (itemMatches) {
      itemMatches.slice(0, 10).forEach((itemXml) => {
        const idMatch = itemXml.match(/id="([^"]*)"/);
        const nameMatch = itemXml.match(/<name[^>]*>([^<]*)<\/name>/);
        const yearMatch = itemXml.match(/<yearpublished>([^<]*)<\/yearpublished>/);
        
        if (idMatch && nameMatch) {
          results.push({
            id: idMatch[1],
            name: nameMatch[1],
            year: yearMatch ? yearMatch[1] : undefined,
          });
        }
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching board games:', error);
    return NextResponse.json([]);
  }
}
