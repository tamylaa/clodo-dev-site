/**
 * Webhook Utilities
 *
 * Handles outbound webhooks for real-time alerts and notifications.
 * Supports retry logic and failure handling.
 */

import { createLogger } from './framework-shims.mjs';

const logger = createLogger('webhooks');

export async function sendWebhook(url, payload, options = {}) {
  const {
    maxRetries = 3,
    timeout = 5000,
    headers = {}
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Engine-Webhook/1.0',
          ...headers
        },
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          attempt
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        logger.info('Webhook sent successfully', { url, attempt, status: response.status });
        return { success: true, status: response.status };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      lastError = error;
      logger.warn('Webhook attempt failed', { url, attempt, error: error.message });

      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  logger.error('Webhook failed after all retries', { url, maxRetries, error: lastError.message });
  return { success: false, error: lastError.message };
}

export async function sendAnomalyAlert(siteUrl, anomaly, webhookUrl, env) {
  const payload = {
    event: 'anomaly_detected',
    siteUrl,
    anomaly: {
      type: anomaly.type,
      severity: anomaly.severity,
      description: anomaly.description,
      detectedAt: new Date().toISOString()
    },
    actions: [
      'Check Google Analytics for traffic patterns',
      'Review recent content changes',
      'Monitor for recovery in next 24 hours'
    ]
  };

  return await sendWebhook(webhookUrl, payload, {
    headers: {
      'X-AI-Engine-Event': 'anomaly-alert'
    }
  });
}

export async function sendCapabilityAlert(capability, result, webhookUrl, env) {
  const payload = {
    event: 'capability_completed',
    capability,
    result: {
      success: !result.error,
      durationMs: result.metadata?.durationMs,
      cost: result.metadata?.cost,
      timestamp: new Date().toISOString()
    },
    insights: result.explanation ? [result.explanation] : []
  };

  return await sendWebhook(webhookUrl, payload, {
    headers: {
      'X-AI-Engine-Event': 'capability-result'
    }
  });
}

export function validateWebhookUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}