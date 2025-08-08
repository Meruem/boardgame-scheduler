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
    
    // Debug: Log a sample of the XML response
    console.log(`BGG Search for "${query}": XML length: ${xmlText.length}`);
    console.log(`XML sample: ${xmlText.substring(0, 500)}...`);
    
    // Parse BGG API response format
    const results: BGGSearchResult[] = [];
    
    // Find all item tags with their content
    const itemRegex = /<item[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/item>/g;
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(xmlText)) !== null && results.length < 10) {
      const [, id, itemContent] = itemMatch;
      
      // Extract name with value attribute (BGG format)
      const nameMatch = itemContent.match(/<name[^>]*value="([^"]*)"[^>]*\/>/);
      const yearMatch = itemContent.match(/<yearpublished[^>]*value="([^"]*)"[^>]*\/>/);
      
      if (nameMatch) {
        results.push({
          id,
          name: nameMatch[1],
          year: yearMatch ? yearMatch[1] : undefined,
        });
      }
    }
    
    // If no results found with value attributes, try text content approach
    if (results.length === 0) {
      const itemRegex2 = /<item[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/item>/g;
      let itemMatch2;
      
      while ((itemMatch2 = itemRegex2.exec(xmlText)) !== null && results.length < 10) {
        const [, id, itemContent] = itemMatch2;
        
        // Try to find name with text content
        const nameMatch = itemContent.match(/<name[^>]*>([^<]*)<\/name>/);
        const yearMatch = itemContent.match(/<yearpublished[^>]*>([^<]*)<\/yearpublished>/);
        
        if (nameMatch) {
          results.push({
            id,
            name: nameMatch[1],
            year: yearMatch ? yearMatch[1] : undefined,
          });
        }
      }
    }
    
    console.log(`Found ${results.length} results for "${query}"`);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching board games:', error);
    return NextResponse.json([]);
  }
}
