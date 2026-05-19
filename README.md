# 🚀 API Showcase - Multi-API Gateway

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Demo-black?style=for-the-badge&logo=vercel)](YOUR_VERCEL_URL_HERE)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](YOUR_GITHUB_REPO_HERE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

## 📊 Overview

A production-ready API Gateway that aggregates **10+ public APIs** with intelligent caching, rate limiting, and a beautiful unified interface. Built with Next.js 15 App Router and TypeScript.

### 🔥 Live Demo
[View Live Application](YOUR_VERCEL_URL_HERE)

## ✨ Features

### 🎯 Core Features
- **Unified API Proxy** - Single endpoint for 10+ different APIs
- **Smart Caching** - Redis-inspired caching with per-API TTL strategies
- **Type Safety** - Full TypeScript support with auto-generated types
- **Responsive Design** - Mobile-first with Tailwind CSS

### 🗺️ APIs Integrated
| Category | APIs |
|----------|------|
| 🌍 Maps & Location | OpenStreetMap, Map Explorer, OpenSky |
| 📡 Data & Utilities | REST Countries, Random User, JSONPlaceholder |
| 📰 News & Finance | GNews, CoinGecko, Alpha Vantage |
| 🎨 Media & Content | NASA APOD, TheMealDB, Open Library |
| 🌤️ Weather | Open-Meteo, OpenWeatherMap |

### ⚡ Performance Optimizations
- **Edge Caching** - Up to 24-hour cache for stable data
- **Real-time Updates** - 30-second TTL for flight data
- **Rate Limiting Protection** - Respects API usage policies
- **Automatic Retries** - Built-in error recovery

## 🛠️ Tech Stack

```typescript
const techStack = {
  framework: "Next.js 15 (App Router)",
  language: "TypeScript 5.0",
  styling: "Tailwind CSS 3.4",
  cache: "In-memory with TTL (Upstash ready)",
  deployment: "Vercel",
  apis: "10+ public REST APIs",
  patterns: "Proxy Pattern, Repository Pattern"
}