import { z } from 'zod';

// 📰 GNews schemas (keep as-is, they work well)
export const GNewsArticleSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  content: z.string().nullable(),
  url: z.string().url(),
  image: z.string().url().nullable(),
  publishedAt: z.string(),
  source: z.object({ name: z.string(), url: z.string().url() })
});

export const GNewsResponseSchema = z.object({
  status: z.string(),
  totalResults: z.number(),
  articles: z.array(GNewsArticleSchema)
});

// 🌍 REST Countries API Schema - LENIENT VERSION
export const CountrySchema = z.object({
  name: z.object({
    common: z.string().default('Unknown'),
    official: z.string().default('Unknown'),
    nativeName: z.record(
      z.string(),
      z.object({ 
        official: z.string().optional(), 
        common: z.string().optional() 
      })
    ).optional().nullable(),
  }),
  flags: z.object({
    // ✅ Accept empty strings OR valid URLs, default to empty
    png: z.string().url().or(z.literal('')).default(''),
    svg: z.string().url().or(z.literal('')).default(''),
    alt: z.string().optional().nullable(),
  }),
  // ✅ Handle null (API sometimes returns null instead of omitting)
  capital: z.array(z.string()).optional().nullable(),
  population: z.number().default(0),
  region: z.string().default('Unknown'),
  subregion: z.string().optional().nullable(),
  languages: z.record(z.string(), z.string()).optional().nullable(),
  currencies: z.record(
    z.string(),
    z.object({
      name: z.string().optional().default('Unknown'),
      symbol: z.string().optional().nullable(),
      code: z.string().optional().default(''), // ✅ Make optional + default
    })
  ).optional().nullable(),
  borders: z.array(z.string()).optional().nullable(),
  cca2: z.string().default(''),
  cca3: z.string().default(''),
  // ✅ Handle missing or empty map URLs
  maps: z.object({
    googleMaps: z.string().url().or(z.literal('')).optional().nullable(),
    openStreetMaps: z.string().url().or(z.literal('')).optional().nullable(),
  }).optional().nullable(),
});

export type Country = z.infer<typeof CountrySchema>;

// Helper with debug logging for development
export function parseCountriesResponse(raw: any): Country[] {
  if (!Array.isArray(raw)) {
    console.warn('⚠️ REST Countries: Expected array, got:', typeof raw);
    return [];
  }
  
  return raw
    .map((item, idx) => {
      const result = CountrySchema.safeParse(item);
      if (!result.success) {
        // Log first 5 failures to avoid console spam
        if (idx < 5) {
          console.warn(`⚠️ Country validation failed:`, {
            name: item.name?.common || 'Unknown',
            cca3: item.cca3 || '???',
            errors: result.error.issues.slice(0, 3).map((e: any) => ({
              path: e.path.join('.'),
              message: e.message
            }))
          });
        }
        return null;
      }
      return result.data;
    })
    .filter((c): c is Country => c !== null);
}

// 🌤️ Open-Meteo Weather API Schema
export const WeatherCurrentSchema = z.object({
  time: z.string(),
  interval: z.number(),
  temperature_2m: z.number(),
  relative_humidity_2m: z.number(),
  apparent_temperature: z.number(),
  precipitation: z.number(),
  rain: z.number(),
  weather_code: z.number(),
  wind_speed_10m: z.number(),
  wind_direction_10m: z.number(),
});

export const WeatherDailySchema = z.object({
  time: z.array(z.string()),
  temperature_2m_max: z.array(z.number()),
  temperature_2m_min: z.array(z.number()),
  precipitation_sum: z.array(z.number()),
  weather_code: z.array(z.number()),
  sunrise: z.array(z.string()),
  sunset: z.array(z.string()),
});

export const WeatherResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number(),
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  timezone_abbreviation: z.string(),
  elevation: z.number(),
  current_units: z.record(z.string(), z.string()).optional(),
  current: WeatherCurrentSchema.optional(),
  daily_units: z.record(z.string(), z.string()).optional(),
  daily: WeatherDailySchema.optional(),
});

export type WeatherResponse = z.infer<typeof WeatherResponseSchema>;
export type WeatherCurrent = z.infer<typeof WeatherCurrentSchema>;
export type WeatherDaily = z.infer<typeof WeatherDailySchema>;

// Helper: Convert weather code to emoji + label
export function getWeatherInfo(code: number): { emoji: string; label: string } {
  const map: Record<number, { emoji: string; label: string }> = {
    0: { emoji: '☀️', label: 'Clear sky' },
    1: { emoji: '🌤️', label: 'Mainly clear' },
    2: { emoji: '⛅', label: 'Partly cloudy' },
    3: { emoji: '☁️', label: 'Overcast' },
    45: { emoji: '🌫️', label: 'Fog' },
    48: { emoji: '🌫️', label: 'Depositing rime fog' },
    51: { emoji: '🌦️', label: 'Light drizzle' },
    53: { emoji: '🌦️', label: 'Moderate drizzle' },
    55: { emoji: '🌧️', label: 'Dense drizzle' },
    61: { emoji: '🌧️', label: 'Slight rain' },
    63: { emoji: '🌧️', label: 'Moderate rain' },
    65: { emoji: '🌧️', label: 'Heavy rain' },
    71: { emoji: '🌨️', label: 'Slight snow' },
    73: { emoji: '🌨️', label: 'Moderate snow' },
    75: { emoji: '❄️', label: 'Heavy snow' },
    95: { emoji: '⛈️', label: 'Thunderstorm' },
    96: { emoji: '⛈️', label: 'Thunderstorm with hail' },
    99: { emoji: '⛈️', label: 'Thunderstorm with heavy hail' },
  };
  return map[code] || { emoji: '❓', label: 'Unknown' };
}

export const ApodResponseSchema = z.object({
  date: z.string(),
  explanation: z.string(),
  hdurl: z.string().url().optional(), // High-res image (images only)
  media_type: z.enum(['image', 'video']),
  service_version: z.string(),
  title: z.string(),
  url: z.string().url(), // Image URL or YouTube thumbnail
  copyright: z.string().optional(),
  thumbnail_url: z.string().url().optional(), // For video thumbnails (if thumbs=true)
});

export type ApodResponse = z.infer<typeof ApodResponseSchema>;

// Helper: Format NASA date (YYYY-MM-DD) to readable format
export const formatNasaDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};


// ✈️ OpenSky Network Flight Schema
// API returns array of arrays: [icao24, callsign, origin_country, time_position, last_contact, longitude, latitude, altitude, on_ground, velocity, heading, vertical_rate, sensors, geo_altitude, squawk, spi, position_source, category, ...]
export const FlightStateSchema = z.tuple([
  z.string(), // icao24: Unique ICAO 24-bit address (hex)
  z.string().nullable(), // callsign: Flight number (e.g., "UAL123")
  z.string(), // origin_country: Country name
  z.number(), // time_position: Unix timestamp of last position update
  z.number(), // last_contact: Unix timestamp of last message received
  z.number().nullable(), // longitude: Decimal degrees
  z.number().nullable(), // latitude: Decimal degrees
  z.number().nullable(), // altitude: Meters (null if on ground)
  z.boolean(), // on_ground: True if aircraft is on ground
  z.number().nullable(), // velocity: Meters/second
  z.number().nullable(), // heading: Degrees (0-360)
  z.number().nullable(), // vertical_rate: Meters/second (positive = climbing)
  z.array(z.number()).nullable(), // sensors: Sensor IDs that received data
  z.number().nullable(), // geo_altitude: Geometric altitude (GNSS)
  z.string().nullable(), // squawk: Transponder code (4 octal digits)
  z.boolean(), // spi: Special Position Identification flag
  z.number().nullable(), // position_source: 0=ADS-B, 1=ASTERIC, 2=MLAT, 3=FLARM
  z.number().nullable(), // category: Aircraft category code (A0-A7, B0-B7, etc.)
]).optional();

export const OpenSkyStatesResponseSchema = z.object({
  time: z.number(), // Unix timestamp of data acquisition
  states: z.array(FlightStateSchema),
});

export type FlightState = z.infer<typeof FlightStateSchema>;
export type OpenSkyStatesResponse = z.infer<typeof OpenSkyStatesResponseSchema>;

// Helper: Convert FlightState tuple to readable object
export function parseFlightState(flight: FlightState) {
  if (!flight) return null;
  return {
    icao24: flight[0],
    callsign: flight[1]?.trim() || 'Unknown',
    originCountry: flight[2],
    timePosition: flight[3],
    lastContact: flight[4],
    longitude: flight[5],
    latitude: flight[6],
    altitude: flight[7], // meters
    onGround: flight[8],
    velocity: flight[9], // m/s
    heading: flight[10], // degrees
    verticalRate: flight[11], // m/s
    sensors: flight[12],
    geoAltitude: flight[13],
    squawk: flight[14],
    spi: flight[15],
    positionSource: flight[16],
    category: flight[17],
  };
}

// Helper: Format altitude in feet
export const formatAltitude = (meters: number | null) => {
  if (meters === null) return 'N/A';
  const feet = meters * 3.28084;
  return `${Math.round(feet).toLocaleString()} ft`;
};

// Helper: Format velocity in knots
export const formatVelocity = (metersPerSecond: number | null) => {
  if (metersPerSecond === null) return 'N/A';
  const knots = metersPerSecond * 1.94384;
  return `${Math.round(knots).toLocaleString()} kts`;
};

// Helper: Format heading with compass emoji
export const formatHeading = (degrees: number | null) => {
  if (degrees === null) return 'N/A';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return `${Math.round(degrees)}° ${directions[index]}`;
};

// Helper: Get aircraft category label
export const getCategoryLabel = (code: number | null) => {
  if (!code) return 'Unknown';
  const labels: Record<number, string> = {
    0: 'No info', 1: 'Light < 7t', 2: 'Small 7-17t', 3: 'Small 17-35t',
    4: 'Large 35-70t', 5: 'Large 70-135t', 6: 'High Vortex', 7: 'Heavy > 135t',
    8: 'High Performance', 9: 'Rotorcraft', 10: 'Glider', 11: 'Lighter-than-air',
    12: 'Parachutist', 13: 'Ultralight', 14: 'UAV', 15: 'Space vehicle',
  };
  return labels[code] || `Category ${code}`;
};


export const MealIngredientSchema = z.object({
  name: z.string(),
  measure: z.string(),
});

export const MealSchema = z.object({
  idMeal: z.string(),
  strMeal: z.string(),
  strDrinkAlternate: z.string().nullable(),
  strCategory: z.string(),
  strArea: z.string(), // Cuisine/region (e.g., "Italian", "Indian")
  strInstructions: z.string(),
  strMealThumb: z.string().url(),
  strTags: z.string().nullable(),
  strYoutube: z.string().url().nullable(),
  strIngredient1: z.string().nullable(),
  strIngredient2: z.string().nullable(),
  strIngredient3: z.string().nullable(),
  strIngredient4: z.string().nullable(),
  strIngredient5: z.string().nullable(),
  strIngredient6: z.string().nullable(),
  strIngredient7: z.string().nullable(),
  strIngredient8: z.string().nullable(),
  strIngredient9: z.string().nullable(),
  strIngredient10: z.string().nullable(),
  strIngredient11: z.string().nullable(),
  strIngredient12: z.string().nullable(),
  strIngredient13: z.string().nullable(),
  strIngredient14: z.string().nullable(),
  strIngredient15: z.string().nullable(),
  strIngredient16: z.string().nullable(),
  strIngredient17: z.string().nullable(),
  strIngredient18: z.string().nullable(),
  strIngredient19: z.string().nullable(),
  strIngredient20: z.string().nullable(),
  strMeasure1: z.string().nullable(),
  strMeasure2: z.string().nullable(),
  strMeasure3: z.string().nullable(),
  strMeasure4: z.string().nullable(),
  strMeasure5: z.string().nullable(),
  strMeasure6: z.string().nullable(),
  strMeasure7: z.string().nullable(),
  strMeasure8: z.string().nullable(),
  strMeasure9: z.string().nullable(),
  strMeasure10: z.string().nullable(),
  strMeasure11: z.string().nullable(),
  strMeasure12: z.string().nullable(),
  strMeasure13: z.string().nullable(),
  strMeasure14: z.string().nullable(),
  strMeasure15: z.string().nullable(),
  strMeasure16: z.string().nullable(),
  strMeasure17: z.string().nullable(),
  strMeasure18: z.string().nullable(),
  strMeasure19: z.string().nullable(),
  strMeasure20: z.string().nullable(),
  strSource: z.string().url().nullable(),
  strImageSource: z.string().url().nullable(),
  strCreativeCommonsConfirmed: z.string().nullable(),
  dateModified: z.string().nullable(),
});

export const MealsResponseSchema = z.object({
  meals: z.array(MealSchema).nullable(),
});

export type Meal = z.infer<typeof MealSchema>;
export type MealIngredient = z.infer<typeof MealIngredientSchema>;
export type MealsResponse = z.infer<typeof MealsResponseSchema>;

// Helper: Parse ingredients array from flat API response
export function parseMealIngredients(meal: Meal): MealIngredient[] {
  const ingredients: MealIngredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}` as keyof Meal];
    const measure = meal[`strMeasure${i}` as keyof Meal];
    if (name && name.trim() && measure && measure.trim()) {
      ingredients.push({
        name: name.trim(),
        measure: measure.trim(),
      });
    }
  }
  return ingredients;
}

// Helper: Get available cuisines (areas) from API
export const CUISINES = [
  'All', 'American', 'British', 'Canadian', 'Chinese', 'Croatian', 
  'Dutch', 'Egyptian', 'Filipino', 'French', 'Greek', 'Indian', 
  'Irish', 'Italian', 'Jamaican', 'Japanese', 'Kenyan', 'Malaysian', 
  'Mexican', 'Moroccan', 'Polish', 'Portuguese', 'Russian', 'Spanish', 
  'Thai', 'Tunisian', 'Turkish', 'Ukrainian', 'Vietnamese'
] as const;

export type Cuisine = typeof CUISINES[number];


export const OpenLibraryBookSchema = z.object({
  key: z.string(), // e.g., "/books/OL123456M"
  title: z.string(),
  subtitle: z.string().optional(),
  authors: z.array(z.object({
    key: z.string(), // e.g., "/authors/OL123456A"
    name: z.string(),
  })).optional(),
  publish_date: z.string().optional(),
  publishers: z.array(z.string()).optional(),
  number_of_pages: z.number().optional(),
  subjects: z.array(z.string()).optional(),
  cover_i: z.number().optional(), // Cover image ID
  isbn_10: z.array(z.string()).optional(),
  isbn_13: z.array(z.string()).optional(),
  description: z.union([
    z.string(),
    z.object({ value: z.string() })
  ]).optional(),
  first_publish_year: z.number().optional(),
  languages: z.array(z.object({
    key: z.string(), // e.g., "/languages/eng"
  })).optional(),
});

export const OpenLibrarySearchResponseSchema = z.object({
  numFound: z.number(),
  start: z.number(),
  docs: z.array(z.object({
    key: z.string(),
    title: z.string(),
    author_name: z.array(z.string()).optional(),
    first_publish_year: z.number().optional(),
    subject: z.array(z.string()).optional(),
    cover_i: z.number().optional(),
    isbn: z.array(z.string()).optional(),
    language: z.array(z.string()).optional(),
  })),
});

export type OpenLibraryBook = z.infer<typeof OpenLibraryBookSchema>;
export type OpenLibrarySearchDoc = z.infer<typeof OpenLibrarySearchResponseSchema>['docs'][0];
export type OpenLibrarySearchResponse = z.infer<typeof OpenLibrarySearchResponseSchema>;

// Helper: Get cover image URL from cover_i
export const getCoverUrl = (coverId: number | undefined, size: 'S' | 'M' | 'L' = 'M') => {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
};

// Helper: Format author list
export const formatAuthors = (authors: Array<{ name?: string }> | string[] | undefined) => {
  if (!authors || authors.length === 0) return 'Unknown author';
  const names = authors.map(a => typeof a === 'string' ? a : a.name).filter(Boolean);
  return names.slice(0, 3).join(', ') + (names.length > 3 ? ' et al.' : '');
};

// Helper: Truncate long text
export const truncateText = (text: string | undefined, maxLength: number = 200) => {
  if (!text) return 'No description available.';
  const clean = typeof text === 'object' ? (text as any).value : text;
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + '...';
};

// Popular subjects for quick filtering
export const BOOK_SUBJECTS = [
  'All', 'Fiction', 'Mystery', 'Science Fiction', 'Fantasy', 
  'Romance', 'History', 'Biography', 'Science', 'Technology',
  'Cooking', 'Travel', 'Children', 'Young Adult', 'Poetry'
] as const;

export type BookSubject = typeof BOOK_SUBJECTS[number];
// Re-export GNews types


// 🗺️ OpenStreetMap / Nominatim API Schema
export const NominatimResultSchema = z.object({
  place_id: z.number(),
  licence: z.string(),
  osm_type: z.enum(['node', 'way', 'relation']),
  osm_id: z.number(),
  lat: z.string(), // Decimal degrees as string
  lon: z.string(),
  category: z.string(), // e.g., "place", "amenity", "highway"
  type: z.string(), // e.g., "city", "restaurant", "primary"
  place_rank: z.number(),
  importance: z.number().nullable(),
  addresstype: z.string().nullable(),
  name: z.string(),
  display_name: z.string(),
  address: z.record(z.string(), z.string()).optional(), // { country: "Germany", city: "Berlin", ... }
  boundingbox: z.array(z.string()), // [minLat, maxLat, minLon, maxLon]
});

export const NominatimSearchResponseSchema = z.array(NominatimResultSchema);

export type NominatimResult = z.infer<typeof NominatimResultSchema>;
export type NominatimSearchResponse = z.infer<typeof NominatimSearchResponseSchema>;

// Helper: Parse coordinates to numbers
export const parseCoordinates = (lat: string, lon: string) => ({
  lat: parseFloat(lat),
  lng: parseFloat(lon),
});

// Helper: Format address for display
export const formatAddress = (address: Record<string, string> | undefined) => {
  if (!address) return '';
  const parts = [
    address.road, address.suburb, address.city, address.town, address.village,
    address.county, address.state, address.postcode, address.country
  ].filter(Boolean);
  return parts.join(', ');
};

// Helper: Get map bounds from bounding box
export const getMapBounds = (boundingBox: string[]) => {
  const [minLat, maxLat, minLon, maxLon] = boundingBox.map(parseFloat);
  return {
    southWest: { lat: minLat, lng: minLon } as L.LatLngExpression,
    northEast: { lat: maxLat, lng: maxLon } as L.LatLngExpression,
  };
};

// Popular place types for filtering
export const PLACE_TYPES = [
  'All', 'City', 'Town', 'Village', 'Restaurant', 'Cafe', 'Hotel', 
  'Museum', 'Park', 'Hospital', 'School', 'Station', 'Airport'
] as const;


export const RandomUserNameSchema = z.object({
  title: z.string(),
  first: z.string(),
  last: z.string(),
});

export type RandomUserName = z.infer<typeof RandomUserNameSchema>;

export const RandomUserLocationSchema = z.object({
  street: z.object({
    number: z.number(),
    name: z.string(),
  }),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postcode: z.union([z.string(), z.number()]),
  coordinates: z.object({
    latitude: z.string(),
    longitude: z.string(),
  }),
  timezone: z.object({
    offset: z.string(),
    description: z.string(),
  }),
});

export const RandomUserLoginSchema = z.object({
  uuid: z.string(),
  username: z.string(),
  password: z.string(),
  salt: z.string(),
  md5: z.string(),
  sha1: z.string(),
  sha256: z.string(),
});

export const RandomUserDobSchema = z.object({
  date: z.string(),
  age: z.number(),
});

export const RandomUserIdSchema = z.object({
  name: z.string(),
  value: z.string().nullable(),
});

export const RandomUserSchema = z.object({
  gender: z.enum(['male', 'female', 'n/a']),
  name: RandomUserNameSchema,
  location: RandomUserLocationSchema,
  email: z.string().email(),
  login: RandomUserLoginSchema,
  dob: RandomUserDobSchema,
  registered: RandomUserDobSchema,
  phone: z.string(),
  cell: z.string(),
  id: RandomUserIdSchema,
  picture: z.object({
    large: z.string().url(),
    medium: z.string().url(),
    thumbnail: z.string().url(),
  }),
  nat: z.string(), // Nationality code
});

export const RandomUserResponseSchema = z.object({
  results: z.array(RandomUserSchema),
  info: z.object({
    seed: z.string(),
    results: z.number(),
    page: z.number(),
    version: z.string(),
  }),
});

export type RandomUser = z.infer<typeof RandomUserSchema>;
export type RandomUserResponse = z.infer<typeof RandomUserResponseSchema>;

// Helper: Format full name
export const formatFullName = (name: RandomUserName) => {
  return `${name.title}. ${name.first} ${name.last}`;
};

// Helper: Format address


// Helper: Format age with label
export const formatAge = (age: number) => {
  return `${age} years old`;
};

// Helper: Format phone number
export const formatPhone = (phone: string) => {
  return phone.replace(/\s+/g, '.');
};

// Gender options for filtering
export const GENDER_OPTIONS = ['all', 'male', 'female'] as const;
export type GenderOption = typeof GENDER_OPTIONS[number];

// Nationality options (common codes)
export const NATIONALITY_OPTIONS = [
  'all', 'us', 'gb', 'ca', 'au', 'de', 'fr', 'es', 'it', 'nl', 'br', 'jp', 'cn', 'in'
] as const;
export type NationalityOption = typeof NATIONALITY_OPTIONS[number];


// 🪙 CoinGecko API Schema
export const CoinMarketSchema = z.object({
  id: z.string(), // e.g., "bitcoin"
  symbol: z.string(), // e.g., "btc"
  name: z.string(), // e.g., "Bitcoin"
  image: z.string().url(), // Logo URL
  current_price: z.number().nullable(),
  market_cap: z.number().nullable(),
  market_cap_rank: z.number().nullable(),
  fully_diluted_valuation: z.number().nullable(),
  total_volume: z.number().nullable(),
  high_24h: z.number().nullable(),
  low_24h: z.number().nullable(),
  price_change_24h: z.number().nullable(),
  price_change_percentage_24h: z.number().nullable(),
  market_cap_change_24h: z.number().nullable(),
  market_cap_change_percentage_24h: z.number().nullable(),
  circulating_supply: z.number().nullable(),
  total_supply: z.number().nullable(),
  max_supply: z.number().nullable(),
  ath: z.number().nullable(), // All-time high
  ath_change_percentage: z.number().nullable(),
  ath_date: z.string().nullable(),
  atl: z.number().nullable(), // All-time low
  atl_change_percentage: z.number().nullable(),
  atl_date: z.string().nullable(),
  last_updated: z.string().nullable(),
  sparkline_in_7d: z.object({
    price: z.array(z.number()),
  }).optional(),
});

export const CoinDetailSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  description: z.record(z.string(), z.string()), // { en: "description text", ... }
  image: z.object({
    thumb: z.string().url(),
    small: z.string().url(),
    large: z.string().url(),
  }),
  market_data: z.object({
    current_price: z.record(z.string(), z.number().nullable()), // { usd: 50000, eur: 45000, ... }
    market_cap: z.record(z.string(), z.number().nullable()),
    total_volume: z.record(z.string(), z.number().nullable()),
    high_24h: z.record(z.string(), z.number().nullable()),
    low_24h: z.record(z.string(), z.number().nullable()),
    price_change_24h: z.number().nullable(),
    price_change_percentage_24h: z.number().nullable(),
    market_cap_change_percentage_24h: z.number().nullable(),
    market_cap_rank: z.number().nullable(),
    circulating_supply: z.number().nullable(),
    total_supply: z.number().nullable(),
    max_supply: z.number().nullable(),
    ath: z.record(z.string(), z.number().nullable()),
    ath_date: z.record(z.string(), z.string().nullable()),
    atl: z.record(z.string(), z.number().nullable()),
    atl_date: z.record(z.string(), z.string().nullable()),
  }),
  community_data: z.object({
    twitter_followers: z.number().nullable(),
    reddit_subscribers: z.number().nullable(),
  }).optional(),
  developer_data: z.object({
    forks: z.number().nullable(),
    stars: z.number().nullable(),
    subscribers: z.number().nullable(),
    total_issues: z.number().nullable(),
    closed_issues: z.number().nullable(),
    pull_requests_merged: z.number().nullable(),
    commit_count_4_weeks: z.number().nullable(),
  }).optional(),
  links: z.object({
    homepage: z.array(z.string().url().nullable()),
    blockchain_site: z.array(z.string().url().nullable()),
    twitter_screen_name: z.string().nullable(),
    telegram_channel_identifier: z.string().nullable(),
    subreddit_url: z.string().url().nullable(),
  }),
  last_updated: z.string().nullable(),
});

export type CoinMarket = z.infer<typeof CoinMarketSchema>;
export type CoinDetail = z.infer<typeof CoinDetailSchema>;

// Helper: Format currency with symbol
export const formatCurrency = (value: number | null, currency: string = 'usd') => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
};

// Helper: Format percentage with color indicator
export const formatPercent = (value: number | null) => {
  if (value === null || value === undefined) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  const color = value >= 0 ? 'text-green-600' : 'text-red-600';
  return `<span class="${color}">${sign}${value.toFixed(2)}%</span>`;
};

// Helper: Format large numbers (K, M, B, T)
export const formatCompactNumber = (num: number | null) => {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

// Popular currencies for price display
export const CRYPTO_CURRENCIES = ['usd', 'eur', 'gbp', 'jpy', 'krw', 'btc', 'eth'] as const;
export type CryptoCurrency = typeof CRYPTO_CURRENCIES[number];

// Sort options for market data
export const SORT_OPTIONS = [
  { value: 'market_cap_desc', label: 'Market Cap ↓' },
  { value: 'market_cap_asc', label: 'Market Cap ↑' },
  { value: 'volume_desc', label: 'Volume ↓' },
  { value: 'volume_asc', label: 'Volume ↑' },
  { value: 'id_asc', label: 'Name A-Z' },
  { value: 'id_desc', label: 'Name Z-A' },
] as const;
export type SortOption = typeof SORT_OPTIONS[number]['value'];


export type PlaceType = typeof PLACE_TYPES[number];
export type GNewsArticle = z.infer<typeof GNewsArticleSchema>;
export type GNewsResponse = z.infer<typeof GNewsResponseSchema>;