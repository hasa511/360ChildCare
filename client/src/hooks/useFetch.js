import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';
import { getError } from '../utils/format.js';

/**
 * Loads `url` with optional query params. Returns the full JSON body as `data`.
 * Pass url = null to skip loading.
 */
export default function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState(null);
  const key = JSON.stringify(params || {});

  const load = useCallback(
    async (silent = false) => {
      if (!url) return;
      if (!silent) setLoading(true);
      try {
        const res = await api.get(url, { params: JSON.parse(key) });
        setData(res.data);
        setError(null);
      } catch (err) {
        setError(getError(err));
      } finally {
        setLoading(false);
      }
    },
    [url, key]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}
