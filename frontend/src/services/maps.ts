export interface LatLng {
  lat: number
  lng: number
}

export interface PlaceSuggestion {
  id: string
  description: string
  location: LatLng
}

/** Google Maps Platform sits behind this interface (Geocoding, Places, navigation). */
export interface MapService {
  geocode(address: string): Promise<LatLng | null>
  searchPlaces(query: string): Promise<PlaceSuggestion[]>
  navigationUrl(destination: LatLng): string
}

const GUADALAJARA_CENTER: LatLng = { lat: 20.6597, lng: -103.3496 }

export function createMockMapService(): MapService {
  return {
    async geocode(address) {
      return address.trim() ? GUADALAJARA_CENTER : null
    },
    async searchPlaces(query) {
      if (!query.trim()) return []
      return [
        { id: 'mock-place-1', description: `${query}, Guadalajara`, location: GUADALAJARA_CENTER },
      ]
    },
    /**
     * A public Google Maps directions link: no API key and no SDK, so it is not an integration.
     * It opens the Maps app on a phone and the website on a computer.
     */
    navigationUrl({ lat, lng }) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    },
  }
}
