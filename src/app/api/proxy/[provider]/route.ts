import { NextRequest } from "next/server";
import { getCached } from "@/lib/cache";

// ✅ Safe 10-field list for REST Countries (max allowed by API)
const RESTCOUNTRIES_SAFE_FIELDS = "name,flags,capital,population,region,languages,currencies,borders,cca2,cca3";

// Base URLs + config for each provider
const API_CONFIG: Record<string, { 
  baseUrl: string; 
  defaultEndpoint?: string; 
  keyParam?: string;
  isPathBased?: boolean;
  forceEndpoint?: string;
}> = {
  restcountries: { 
    baseUrl: "https://restcountries.com/v3.1", 
    defaultEndpoint: "all",
    isPathBased: true,
  },
  openmeteo: { 
    baseUrl: "https://api.open-meteo.com/v1",
    forceEndpoint: "forecast",
  },
  openlibrary: { baseUrl: "https://openlibrary.org" },
  coingecko: { baseUrl: "https://api.coingecko.com/api/v3" },
  themealdb: { baseUrl: "https://www.themealdb.com/api/json/v1/1" },
  randomuser: { baseUrl: "https://randomuser.me/api" },
  nasa: { baseUrl: "https://api.nasa.gov/planetary/apod", keyParam: "api_key" },
  gnews: { baseUrl: "https://gnews.io/api/v4", defaultEndpoint: "search", keyParam: "apikey" },
  opensky: { 
    baseUrl: "https://opensky-network.org/api",
    forceEndpoint: "states/all",
  },
  osm: { baseUrl: "https://nominatim.openstreetmap.org" },
};

// ✅ Helper: Create Basic Auth header (server-side only)
function getBasicAuthHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const config = API_CONFIG[provider];
  
  if (!config) {
    return Response.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  
  // Build query string from URL params
  const queryParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (value) queryParams.append(key, value);
  }

  // Add API key if required (for query-param based auth like NASA, GNews)
  if (config.keyParam && process.env[`${provider.toUpperCase()}_API_KEY`]) {
    queryParams.set(config.keyParam, process.env[`${provider.toUpperCase()}_API_KEY`]!);
  } else if (config.keyParam && provider === "nasa") {
    queryParams.set(config.keyParam, process.env.NASA_API_KEY || "DEMO_KEY");
  }

  // ✅ Determine endpoint
  let endpoint = "";
  let finalQueryParams = new URLSearchParams(queryParams);
  
  // 1. Special case: OSM (Nominatim)
  if (provider === "randomuser") {
  // Random User API uses base URL + query params only
  // e.g., https://randomuser.me/api?results=10&gender=female
  // ✅ Do NOT set endpoint - leave it empty
  endpoint = ""; 
  // ✅ Do NOT modify finalQueryParams - pass all params through
}
else if (provider === "coingecko") {
  const endpointParam = finalQueryParams.get("endpoint");
  if (endpointParam) {
    endpoint = endpointParam; // e.g., "coins/markets", "coins/bitcoin"
    finalQueryParams.delete("endpoint");
  } else {
    endpoint = "coins/markets"; // Default endpoint for crypto page
  }
}

 else if (provider === "osm") {
    // Extract endpoint from URL path (e.g., /api/proxy/osm/search -> "search")
    const pathSegments = request.nextUrl.pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Check if last segment is a valid OSM endpoint
    if (lastSegment && ['search', 'reverse', 'lookup', 'status'].includes(lastSegment)) {
      endpoint = lastSegment;
    } else {
      // Fallback to query param or default
      const endpointParam = finalQueryParams.get("endpoint");
      if (endpointParam && ['search', 'reverse', 'lookup', 'status'].includes(endpointParam)) {
        endpoint = endpointParam;
        finalQueryParams.delete("endpoint");
      } else {
        endpoint = "search"; // Default to search
      }
    }
    
    // Add required headers for Nominatim
    // Note: You'll need to add these headers when making the actual fetch
  }
  // 2. Special case: Open Library uses path-based endpoints like /search.json, /books/OL123456M.json
  else if (provider === "openlibrary") {
    const endpointParam = finalQueryParams.get("endpoint");
    if (endpointParam) {
      endpoint = endpointParam;
      finalQueryParams.delete("endpoint");
    } else {
      endpoint = "search.json";
    }
  }
  // 3. Special case: TheMealDB uses file-based endpoints
  else if (provider === "themealdb") {
    const endpointParam = finalQueryParams.get("endpoint");
    if (endpointParam) {
      endpoint = endpointParam;
      finalQueryParams.delete("endpoint");
    } else {
      endpoint = "search.php";
    }
  }
  // 4. Force endpoint for APIs that always use one path
  else if (config.forceEndpoint) {
    endpoint = config.forceEndpoint;
  }
  // 5. Path-based APIs (REST Countries)
  else if (provider === "restcountries" && config.isPathBased) {
    const nameParam = finalQueryParams.get("name");
    const regionParam = finalQueryParams.get("region");
    
    if (nameParam) {
      endpoint = `name/${encodeURIComponent(nameParam)}`;
      finalQueryParams.delete("name");
    } else if (regionParam) {
      endpoint = `region/${encodeURIComponent(regionParam)}`;
      finalQueryParams.delete("region");
    } else {
      endpoint = "all";
    }
    
    // REST Countries requires 'fields' param (max 10)
    const requestedFields = queryParams.get("fields");
    if (requestedFields) {
      const fieldCount = requestedFields.split(",").filter(f => f.trim()).length;
      if (fieldCount <= 10) {
        finalQueryParams.set("fields", requestedFields);
      } else {
        console.warn(`⚠️ REST Countries: ${fieldCount} fields requested (max 10). Using safe defaults.`);
        finalQueryParams.set("fields", RESTCOUNTRIES_SAFE_FIELDS);
      }
    } else {
      finalQueryParams.set("fields", RESTCOUNTRIES_SAFE_FIELDS);
    }
  }
  // 6. Default endpoint for providers like GNews
  else if (config.defaultEndpoint) {
    endpoint = config.defaultEndpoint;
  }

  // ✅ Build the upstream URL
  const path = endpoint ? `/${endpoint}` : "";
  const queryString = finalQueryParams.toString();
  const upstreamUrl = `${config.baseUrl}${path}${queryString ? `?${queryString}` : ""}`;

  // Debug log
  console.log(`🔗 [${provider}] Fetching:`, upstreamUrl);

  // Cache key (hash query to avoid URL encoding issues)
  const cacheKey = `proxy:${provider}:${Buffer.from(queryString).toString("base64")}`;

  // ✅ Determine cache TTL per provider
  const getTTL = () => {
    if (provider === "restcountries") return 1440; // 24 hours
    if (provider === "opensky") return 0.5; // 30 seconds (near-real-time)
    if (provider === "openmeteo") return 5; // 5 minutes
    if (provider === "nasa") return 60; // 1 hour
    if (provider === "themealdb") return 60; // 1 hour (recipes don't change)
    if (provider === "openlibrary") return 60; // 1 hour (books don't change often)
    if (provider === "osm") return 5; // 5 minutes for OSM (respect usage policy)
     if (provider === "randomuser") return 5;
    if (provider === "coingecko") return 1; // 1 minute for crypto (fast-changing)
    return 30; // Default 30 minutes
  };

  try {
    const data = await getCached(cacheKey, async () => {
      // ✅ Build headers per provider
      const headers: Record<string, string> = {
        "User-Agent": "API-Showcase/1.0 (your-email@example.com)",
      };
      
      // 🔐 OpenSky: Add HTTP Basic Auth if credentials exist
      if (provider === "opensky") {
        const clientId = process.env.OPENSKY_CLIENT_ID;
        const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
        
        if (clientId && clientSecret) {
          headers["Authorization"] = getBasicAuthHeader(clientId, clientSecret);
          console.log(`🔐 [${provider}] Using authenticated request`);
        } else {
          console.warn(`⚠️ [${provider}] No credentials found - using anonymous access (rate limited)`);
        }
      }
      
      // 🌍 OSM Nominatim specific headers
      if (provider === "osm") {
        headers["Accept"] = "application/json";
        headers["Accept-Language"] = "en-US,en;q=0.9";
        // Nominatim requires a valid email or identifying User-Agent
        headers["User-Agent"] = "API-Showcase/1.0 (your-email@example.com)";
      }

      const res = await fetch(upstreamUrl, { headers });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => "No error body");
        
        // Handle specific auth errors
        if (provider === "opensky" && res.status === 401) {
          console.error(`❌ OpenSky Auth failed: Check OPENSKY_CLIENT_ID/SECRET in .env.local`);
        }
        
        // Handle OSM rate limiting
        if (provider === "osm" && res.status === 429) {
          console.error(`❌ OSM Rate limited: Too many requests. Please wait.`);
        }
        
        console.error(`❌ Upstream error [${provider}]: ${res.status}`, {
          url: upstreamUrl,
          error: errorText.slice(0, 300)
        });
        throw new Error(`Upstream failed: ${res.status} ${res.statusText}`);
      }
      
      const jsonData = await res.json();
      return jsonData;
    }, getTTL());

    return Response.json(data);
  } catch (error: any) {
    // ✅ Handle JSON serialization errors specifically
    if (error.message?.includes('JSON') || error.message?.includes('serializable')) {
      console.error(`💥 Serialization error for ${provider}:`, {
        message: error.message,
        cacheKey
      });
      // Fallback: return fresh data without caching
      try {
        const headers: Record<string, string> = { 
          "User-Agent": "API-Showcase/1.0"
        };
        if (provider === "opensky") {
          const clientId = process.env.OPENSKY_CLIENT_ID;
          const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
          if (clientId && clientSecret) {
            headers["Authorization"] = getBasicAuthHeader(clientId, clientSecret);
          }
        }
        if (provider === "osm") {
          headers["Accept"] = "application/json";
          headers["User-Agent"] = "API-Showcase/1.0 (your-email@example.com)";
        }
        const res = await fetch(upstreamUrl, { headers });
        return Response.json(await res.json());
      } catch {
        return Response.json({ error: "Failed to fetch data" }, { status: 502 });
      }
    }
    
    console.error(`💥 Proxy error for ${provider}:`, error.message);
    return Response.json(
      { error: "Failed to fetch data", details: error.message },
      { status: 502 }
    );
  }
}