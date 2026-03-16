const DEFAULT_ML_HEALTH_URL = 'http://127.0.0.1:5001/health';

const checkMlService = async (healthUrl) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    if (typeof fetch !== 'function') {
      return {
        online: false,
        reason: 'fetch_unavailable',
      };
    }

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return {
        online: false,
        reason: `http_${response.status}`,
      };
    }

    const payload = await response.json().catch(() => ({}));
    return {
      online: true,
      reason: 'ok',
      payload,
    };
  } catch (error) {
    const isAbort = error?.name === 'AbortError';
    return {
      online: false,
      reason: isAbort ? 'timeout' : (error?.code || 'unreachable'),
    };
  } finally {
    clearTimeout(timeout);
  }
};

exports.getMlHealth = async (req, res) => {
  try {
    const configuredUrl = process.env.ML_API_HEALTH_URL || process.env.ML_API_URL || DEFAULT_ML_HEALTH_URL;
    const healthUrl = String(configuredUrl).includes('/health')
      ? configuredUrl
      : `${String(configuredUrl).replace(/\/$/, '')}/health`;

    const status = await checkMlService(healthUrl);

    return res.status(200).json({
      success: true,
      mode: status.online ? 'online' : 'fallback',
      online: status.online,
      checked_url: healthUrl,
      checked_at: new Date().toISOString(),
      reason: status.reason,
      details: status.payload || null,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      mode: 'fallback',
      online: false,
      checked_at: new Date().toISOString(),
      reason: error?.message || 'health_check_failed',
    });
  }
};
