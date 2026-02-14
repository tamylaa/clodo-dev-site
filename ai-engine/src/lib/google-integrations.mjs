/**
 * Google Integrations Module
 *
 * Handles OAuth flows and API calls for Google Search Console,
 * Analytics, and PageSpeed Insights. Provides data enrichment
 * for AI capabilities.
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';

const logger = createLogger('google-integrations');

// OAuth configuration (would be stored securely in KV)
const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'https://ai-engine.test.workers.dev/auth/google/callback',
  scopes: [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/pagespeedonline'
  ]
};

// In-memory token store (in production, use KV or external storage)
const tokenStore = new Map();

export async function initiateGoogleOAuth(siteUrl) {
  const state = generateState(siteUrl);
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
      scope: GOOGLE_OAUTH_CONFIG.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      state: state
    });

  return {
    authUrl,
    state
  };
}

export async function handleGoogleOAuthCallback(code, state) {
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_OAUTH_CONFIG.clientId,
        client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri
      })
    });

    const tokens = await tokenResponse.json();
    if (tokens.error) throw new Error(tokens.error_description);

    // Store tokens (simplified - use KV in production)
    const siteUrl = decodeState(state);
    tokenStore.set(siteUrl, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000)
    });

    return { success: true, siteUrl };
  } catch (error) {
    logger.error('OAuth callback failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

export async function getGoogleData(siteUrl, dataType, env) {
  const tokens = tokenStore.get(siteUrl);
  if (!tokens) return { error: 'No OAuth tokens found for this site' };

  const accessToken = await ensureValidToken(siteUrl, tokens);

  try {
    switch (dataType) {
      case 'search-console':
        return await getSearchConsoleData(siteUrl, accessToken);
      case 'analytics':
        return await getAnalyticsData(siteUrl, accessToken);
      case 'pagespeed':
        return await getPageSpeedData(siteUrl, accessToken);
      default:
        return { error: 'Unsupported data type' };
    }
  } catch (error) {
    logger.error('Google API call failed', { dataType, error: error.message });
    return { error: error.message };
  }
}

async function getSearchConsoleData(siteUrl, accessToken) {
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      method: 'POST',
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['query', 'page'],
        rowLimit: 100
      })
    }
  );

  const data = await response.json();
  return {
    queries: data.rows?.map(row => ({
      query: row.keys[0],
      page: row.keys[1],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    })) || []
  };
}

async function getAnalyticsData(siteUrl, accessToken) {
  // Simplified - would need property ID mapping
  const response = await fetch(
    `https://www.googleapis.com/v4/reports:batchGet`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      method: 'POST',
      body: JSON.stringify({
        reportRequests: [{
          viewId: 'ga:123456789', // Would be mapped from siteUrl
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [{ expression: 'ga:sessions' }, { expression: 'ga:pageviews' }],
          dimensions: [{ name: 'ga:date' }]
        }]
      })
    }
  );

  const data = await response.json();
  return data;
}

async function getPageSpeedData(siteUrl, accessToken) {
  const response = await fetch(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(siteUrl)}&strategy=mobile`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  const data = await response.json();
  return {
    score: data.lighthouseResult?.categories?.performance?.score * 100,
    metrics: data.lighthouseResult?.audits
  };
}

async function ensureValidToken(siteUrl, tokens) {
  if (Date.now() < tokens.expiresAt) return tokens.accessToken;

  // Refresh token
  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      refresh_token: tokens.refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const newTokens = await refreshResponse.json();
  if (newTokens.error) throw new Error(newTokens.error_description);

  const updatedTokens = {
    ...tokens,
    accessToken: newTokens.access_token,
    expiresAt: Date.now() + (newTokens.expires_in * 1000)
  };

  tokenStore.set(siteUrl, updatedTokens);
  return updatedTokens.accessToken;
}

function generateState(siteUrl) {
  return Buffer.from(JSON.stringify({ siteUrl, timestamp: Date.now() })).toString('base64');
}

function decodeState(state) {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
    return decoded.siteUrl;
  } catch {
    throw new Error('Invalid state parameter');
  }
}