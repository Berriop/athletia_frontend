// Type declarations for Google Maps JavaScript API
// This avoids installing @types/google.maps while keeping TypeScript happy

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
      setCenter(latlng: LatLng | LatLngLiteral): void;
      panTo(latlng: LatLng | LatLngLiteral): void;
      getCenter(): LatLng;
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      addListener(event: string, handler: () => void): void;
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(map?: Map, anchor?: Marker): void;
      close(): void;
      setContent(content: string): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      styles?: object[];
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | MarkerIcon;
      animation?: Animation;
    }

    interface MarkerIcon {
      url?: string;
      scaledSize?: Size;
      origin?: Point;
      anchor?: Point;
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    interface InfoWindowOptions {
      content?: string;
      maxWidth?: number;
    }

    enum Animation {
      DROP = 2,
      BOUNCE = 1,
    }

    namespace places {
      class PlacesService {
        constructor(attrContainer: Map | HTMLDivElement);
        nearbySearch(
          request: PlaceSearchRequest,
          callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void
        ): void;
        textSearch(
          request: TextSearchRequest,
          callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void
        ): void;
      }

      class Autocomplete {
        constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
        addListener(event: string, handler: () => void): void;
        getPlace(): PlaceResult;
      }

      interface AutocompleteOptions {
        types?: string[];
        fields?: string[];
      }

      interface PlaceSearchRequest {
        location?: google.maps.LatLng | google.maps.LatLngLiteral;
        radius?: number;
        type?: string;
        keyword?: string;
        name?: string;
      }

      interface TextSearchRequest {
        query: string;
        location?: google.maps.LatLng | google.maps.LatLngLiteral;
        radius?: number;
        type?: string;
      }

      interface PlaceResult {
        place_id?: string;
        name?: string;
        vicinity?: string;
        formatted_address?: string;
        rating?: number;
        user_ratings_total?: number;
        opening_hours?: {
          isOpen: () => boolean;
          open_now?: boolean;
        };
        geometry?: {
          location?: google.maps.LatLng;
        };
        photos?: PlacePhoto[];
        types?: string[];
        business_status?: string;
      }

      interface PlacePhoto {
        getUrl(opts: { maxWidth: number }): string;
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        NOT_FOUND = 'NOT_FOUND',
        INVALID_REQUEST = 'INVALID_REQUEST',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      }
    }
  }
}
