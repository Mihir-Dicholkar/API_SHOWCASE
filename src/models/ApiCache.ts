import mongoose from 'mongoose';

const ApiCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  fetchedAt: { type: Date, default: Date.now },
  // ✅ Remove inline index: true → use schema.index() below only
  expiresAt: { type: Date, required: true }
});

// ✅ Single TTL index definition (avoids duplicate warning)
ApiCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ApiCache = mongoose.models.ApiCache || mongoose.model('ApiCache', ApiCacheSchema);