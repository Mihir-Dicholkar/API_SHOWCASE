import { connectDB } from './db';
import { ApiCache } from '@/models/ApiCache';

// ✅ Sanitize data to ensure it's JSON-serializable for MongoDB
function sanitizeForStorage<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMinutes: number = 30
): Promise<T> {
  try {
    await connectDB();

    // 1️⃣ Check cache
    const cached = await ApiCache.findOne({ key });
    if (cached && cached.expiresAt > new Date()) {
      return cached.data as T;
    }

    // 2️⃣ Cache miss → fetch fresh data
    const freshData = await fetcher();

    // 3️⃣ Sanitize + save to MongoDB
    const sanitizedData = sanitizeForStorage(freshData);
    
  await ApiCache.findOneAndUpdate(
  { key },
  {
     sanitizedData,
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000)
  },
  { 
    upsert: true, 
    // ✅ Use new option name
    // @ts-ignore
    returnDocument: 'after'
  }
);
    return freshData;
  } catch (error) {
    // 🔹 Fallback: if DB fails, bypass cache and return fresh data directly
    console.warn('⚠️ Cache bypassed (DB unavailable):', error);
    return await fetcher();
  }
}

// Optional: Clear specific or all cache entries
export async function clearCache(key?: string) {
  try {
    await connectDB();
    if (key) await ApiCache.deleteOne({ key });
    else await ApiCache.deleteMany({});
    return true;
  } catch {
    return false;
  }
}