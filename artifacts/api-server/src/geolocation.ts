export interface GeoData {
  ip: string;
  country: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

export function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.toString().split(',');
    return ips[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) return realIp.toString().trim();
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

export async function lookupGeo(ip: string): Promise<GeoData | null> {
  try {
    if (!ip || ip === 'unknown' || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127')) {
      return null;
    }

    const cleanIp = ip.replace('::ffff:', '');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,message,country,regionName,city,lat,lon,timezone,isp,org,as,query`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();

    if (data.status === 'fail') {
      console.log(`[GEO] Lookup failed for ${cleanIp}: ${data.message}`);
      return null;
    }

    return {
      ip: data.query || cleanIp,
      country: data.country || '',
      region: data.regionName || '',
      city: data.city || '',
      lat: data.lat || 0,
      lon: data.lon || 0,
      timezone: data.timezone || '',
      isp: data.isp || '',
      org: data.org || '',
      as: data.as || '',
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log(`[GEO] Timeout for IP: ${ip}`);
    } else {
      console.log(`[GEO] Error looking up ${ip}:`, err.message);
    }
    return null;
  }
}
