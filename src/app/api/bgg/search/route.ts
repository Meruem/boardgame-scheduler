import { NextResponse } from "next/server";

interface BGGSearchResult {
  id: string;
  name: string;
  year?: string;
  relevanceScore?: number;
}

function calculateRelevanceScore(gameName: string, query: string): number {
  const lowerGameName = gameName.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 0);
  
  let score = 0;
  
  // Exact match gets highest score
  if (lowerGameName === lowerQuery) {
    score += 1000;
  }
  
  // Starts with query gets high score
  if (lowerGameName.startsWith(lowerQuery)) {
    score += 500;
  }
  
  // Contains all query words in order
  if (lowerGameName.includes(lowerQuery)) {
    score += 300;
  }
  
  // Check for word matches
  let matchedWords = 0;
  let consecutiveMatches = 0;
  let lastMatchIndex = -1;
  
  for (const word of queryWords) {
    const wordIndex = lowerGameName.indexOf(word);
    if (wordIndex !== -1) {
      matchedWords++;
      
      // Bonus for consecutive word matches
      if (lastMatchIndex !== -1 && wordIndex > lastMatchIndex) {
        consecutiveMatches++;
      }
      lastMatchIndex = wordIndex;
    }
  }
  
  // Score based on word matches
  score += matchedWords * 100;
  score += consecutiveMatches * 50;
  
  // Bonus for shorter names (more specific matches)
  if (gameName.length < 30) {
    score += 20;
  }
  
  // Penalty for very long names (likely expansions or fan content)
  if (gameName.length > 60) {
    score -= 50;
  }
  
  // Penalty for names containing "fan", "expansion", "promo" (unless explicitly searched)
  if (!lowerQuery.includes('fan') && !lowerQuery.includes('expansion') && !lowerQuery.includes('promo')) {
    if (lowerGameName.includes('fan') || lowerGameName.includes('expansion') || lowerGameName.includes('promo')) {
      score -= 100;
    }
  }
  
  return score;
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
    const allResults: BGGSearchResult[] = [];
    
    // Find all item tags with their content
    const itemRegex = /<item[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/item>/g;
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(xmlText)) !== null) {
      const [, id, itemContent] = itemMatch;
      
      // Extract name with value attribute (BGG format)
      const nameMatch = itemContent.match(/<name[^>]*value="([^"]*)"[^>]*\/>/);
      const yearMatch = itemContent.match(/<yearpublished[^>]*value="([^"]*)"[^>]*\/>/);
      
      if (nameMatch) {
        allResults.push({
          id,
          name: nameMatch[1],
          year: yearMatch ? yearMatch[1] : undefined,
        });
      }
    }
    
    // If no results found with value attributes, try text content approach
    if (allResults.length === 0) {
      const itemRegex2 = /<item[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/item>/g;
      let itemMatch2;
      
      while ((itemMatch2 = itemRegex2.exec(xmlText)) !== null) {
        const [, id, itemContent] = itemMatch2;
        
        // Try to find name with text content
        const nameMatch = itemContent.match(/<name[^>]*>([^<]*)<\/name>/);
        const yearMatch = itemContent.match(/<yearpublished[^>]*>([^<]*)<\/yearpublished>/);
        
        if (nameMatch) {
          allResults.push({
            id,
            name: nameMatch[1],
            year: yearMatch ? yearMatch[1] : undefined,
          });
        }
      }
    }
    
    // Calculate relevance scores and sort by best match
    const results = allResults
      .map(result => {
        const relevanceScore = calculateRelevanceScore(result.name, query);
        return { ...result, relevanceScore };
      })
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 10);
    
    console.log(`Found ${results.length} results for "${query}"`);
    console.log(`Top results:`, results.slice(0, 3).map(r => `${r.name} (score: ${r.relevanceScore})`));
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching board games:', error);
    return NextResponse.json(
      { error: "Failed to search board games" },
      { status: 500 }
    );
  }
}
