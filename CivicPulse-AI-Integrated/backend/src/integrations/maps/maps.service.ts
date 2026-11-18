
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationInfo {
  formattedAddress: string;
  coordinates: Coordinates;
}

interface AddressResponse {
  display_name: string;
  lat: string;
  lon: string;
}

const BASE_URL = "https://nominatim.openstreetmap.org";

const requestHeaders = {
  "User-Agent": "CivicPulse/1.0 (Emergency Response Platform)",
  Accept: "application/json",
};

function isValidLocation(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<LocationInfo | null> {
  if (!isValidLocation(lat, lon)) {
    throw new Error("Invalid coordinates");
  }

  const query = new URLSearchParams();
  query.set("lat", String(lat));
  query.set("lon", String(lon));
  query.set("format", "jsonv2");

  const response = await fetch(
    `${BASE_URL}/reverse?${query.toString()}`,
    { headers: requestHeaders }
  );

  if (!response.ok) {
    throw new Error("Could not fetch location details");
  }

  const data: AddressResponse = await response.json();

  if (!data.display_name) {
    return null;
  }

  return {
    formattedAddress: data.display_name,
    coordinates: {
      latitude: lat,
      longitude: lon,
    },
  };
}

export async function geocodeAddress(
  address: string
): Promise<LocationInfo | null> {
  const searchAddress = address.trim();

  if (!searchAddress) {
    throw new Error("Address is required");
  }

  const query = new URLSearchParams({
    q: searchAddress,
    format: "jsonv2",
    limit: "1",
  });

  const response = await fetch(
    `${BASE_URL}/search?${query.toString()}`,
    { headers: requestHeaders }
  );

  if (!response.ok) {
    throw new Error("Could not find the requested address");
  }

  const results: AddressResponse[] = await response.json();

  if (results.length === 0) {
    return null;
  }

  const location = results[0];
  const latitude = Number(location.lat);
  const longitude = Number(location.lon);

  if (!isValidLocation(latitude, longitude)) {
    throw new Error("Invalid coordinates received from location service");
  }

  return {
    formattedAddress: location.display_name,
    coordinates: {
      latitude,
      longitude,
    },
  };
}
