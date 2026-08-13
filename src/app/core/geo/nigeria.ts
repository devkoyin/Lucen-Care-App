/**
 * Nigerian states and their geopolitical zones.
 *
 * Lives on the client because it is presentation data: the API stores and returns a
 * plain state name, and the coverage map colours it by zone. Keeping the zone table
 * here means the backend never has to know Nigerian geography to serve a count.
 */
export const NIGERIA_ZONES = [
  'North-Central',
  'North-East',
  'North-West',
  'South-East',
  'South-South',
  'South-West',
] as const;

export type NigeriaZone = (typeof NIGERIA_ZONES)[number];

export const STATE_ZONES: Record<string, NigeriaZone> = {
  Abia: 'South-East',
  Adamawa: 'North-East',
  'Akwa Ibom': 'South-South',
  Anambra: 'South-East',
  Bauchi: 'North-East',
  Bayelsa: 'South-South',
  Benue: 'North-Central',
  Borno: 'North-East',
  'Cross River': 'South-South',
  Delta: 'South-South',
  Ebonyi: 'South-East',
  Edo: 'South-South',
  Ekiti: 'South-West',
  Enugu: 'South-East',
  'FCT — Abuja': 'North-Central',
  Gombe: 'North-East',
  Imo: 'South-East',
  Jigawa: 'North-West',
  Kaduna: 'North-West',
  Kano: 'North-West',
  Katsina: 'North-West',
  Kebbi: 'North-West',
  Kogi: 'North-Central',
  Kwara: 'North-Central',
  Lagos: 'South-West',
  Nasarawa: 'North-Central',
  Niger: 'North-Central',
  Ogun: 'South-West',
  Ondo: 'South-West',
  Osun: 'South-West',
  Oyo: 'South-West',
  Plateau: 'North-Central',
  Rivers: 'South-South',
  Sokoto: 'North-West',
  Taraba: 'North-East',
  Yobe: 'North-East',
  Zamfara: 'North-West',
};

export const NIGERIA_STATES: string[] = Object.keys(STATE_ZONES);

export const ZONE_COLORS: Record<NigeriaZone, string> = {
  'South-West': '#059669',
  'North-West': '#2563EB',
  'South-East': '#7C3AED',
  'North-Central': '#D97706',
  'South-South': '#0891B2',
  'North-East': '#DC2626',
};

/** Rows the API returns for patients with no state recorded, and anything unmapped. */
export const UNSPECIFIED_STATE = 'Unspecified';

export function zoneOf(state: string): NigeriaZone | null {
  return STATE_ZONES[state] ?? null;
}

export function colorForState(state: string): string {
  const zone = zoneOf(state);
  return zone ? ZONE_COLORS[zone] : '#6B7280';
}
