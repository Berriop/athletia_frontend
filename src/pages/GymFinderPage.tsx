import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, Star, Clock, Navigation, Loader, AlertCircle, X } from 'lucide-react';
import './GymFinderPage.css';

interface Gym {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  isOpen?: boolean;
  lat: number;
  lng: number;
  photoUrl?: string;
}

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as Record<string, unknown>).google) {
      resolve();
      return;
    }
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));
    document.head.appendChild(script);
  });
}

export const GymFinderPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [searchMode, setSearchMode] = useState<'nearby' | 'search'>('nearby');

  // Load Google Maps script on mount
  useEffect(() => {
    if (!MAPS_API_KEY || MAPS_API_KEY === 'TU_API_KEY_AQUI') {
      setError('⚠️ Falta configurar VITE_GOOGLE_MAPS_API_KEY en el archivo .env');
      setIsLoading(false);
      return;
    }
    loadGoogleMapsScript()
      .then(() => setMapsReady(true))
      .catch(() => {
        setError('No se pudo cargar Google Maps. Verifica tu API Key.');
        setIsLoading(false);
      });
  }, []);

  // Initialize map once script is ready
  useEffect(() => {
    if (!mapsReady || !mapRef.current) return;

    const initMap = (lat: number, lng: number) => {
      const darkStyle: google.maps.MapOptions['styles'] = [
        { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#a0aec0' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d3748' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#718096' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f23' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2d3748' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2e1a' }] },
        { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2d3748' }] },
      ];

      mapInstanceRef.current = new google.maps.Map(mapRef.current!, {
        center: { lat, lng },
        zoom: 14,
        styles: darkStyle,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      infoWindowRef.current = new google.maps.InfoWindow();

      // Add user location marker
      new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        title: 'Tu ubicación',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" fill="#667eea" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
        },
      });

      searchNearbyGyms(lat, lng);
    };

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        initMap(lat, lng);
      },
      () => {
        // Fallback: Bogotá, Colombia
        const lat = 4.711, lng = -74.0721;
        setUserLocation({ lat, lng });
        initMap(lat, lng);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [mapsReady]);

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  };

  const addGymMarker = useCallback((gym: Gym) => {
    if (!mapInstanceRef.current) return;

    const marker = new google.maps.Marker({
      position: { lat: gym.lat, lng: gym.lng },
      map: mapInstanceRef.current,
      title: gym.name,
      animation: google.maps.Animation.DROP,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
            <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" fill="#667eea"/>
          </svg>
        `),
      },
    });

    marker.addListener('click', () => {
      setSelectedGym(gym);
      mapInstanceRef.current?.panTo({ lat: gym.lat, lng: gym.lng });
      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(`
          <div style="color:#1a1a2e;padding:8px;max-width:200px;">
            <strong style="font-size:14px;">${gym.name}</strong>
            <p style="margin:4px 0;font-size:12px;color:#4a5568;">${gym.vicinity}</p>
            ${gym.rating ? `<p style="margin:2px 0;font-size:12px;">⭐ ${gym.rating} (${gym.user_ratings_total ?? 0} reseñas)</p>` : ''}
            ${gym.isOpen !== undefined ? `<p style="margin:2px 0;font-size:12px;color:${gym.isOpen ? '#38a169' : '#e53e3e'}">${gym.isOpen ? '🟢 Abierto' : '🔴 Cerrado'}</p>` : ''}
          </div>
        `);
        infoWindowRef.current.open(mapInstanceRef.current!, marker);
      }
    });

    markersRef.current.push(marker);
  }, []);

  const searchNearbyGyms = useCallback((lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;
    setIsLoading(true);
    setError('');
    setSearchMode('nearby');

    const service = new google.maps.places.PlacesService(mapInstanceRef.current);
    service.nearbySearch(
      {
        location: { lat, lng },
        radius: 3000,
        type: 'gym',
        keyword: 'gym fitness',
      },
      (results, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          clearMarkers();
          const gymData: Gym[] = results.slice(0, 20).map(p => ({
            place_id: p.place_id ?? '',
            name: p.name ?? 'Gimnasio',
            vicinity: p.vicinity ?? p.formatted_address ?? '',
            rating: p.rating,
            user_ratings_total: p.user_ratings_total,
            isOpen: p.opening_hours?.isOpen?.(),
            lat: p.geometry?.location?.lat() ?? lat,
            lng: p.geometry?.location?.lng() ?? lng,
            photoUrl: p.photos?.[0]?.getUrl({ maxWidth: 400 }),
          }));
          setGyms(gymData);
          gymData.forEach(addGymMarker);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setGyms([]);
          setError('No se encontraron gimnasios en un radio de 3 km.');
        } else {
          setError('Error al buscar gimnasios. Verifica que las APIs de Maps y Places estén activas.');
        }
      }
    );
  }, [addGymMarker]);

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    setIsLoading(true);
    setError('');
    setSearchMode('search');

    const service = new google.maps.places.PlacesService(mapInstanceRef.current);
    service.textSearch(
      {
        query: `gimnasio ${searchQuery}`,
        type: 'gym',
      },
      (results, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          clearMarkers();
          const gymData: Gym[] = results.slice(0, 20).map(p => ({
            place_id: p.place_id ?? '',
            name: p.name ?? 'Gimnasio',
            vicinity: p.formatted_address ?? p.vicinity ?? '',
            rating: p.rating,
            user_ratings_total: p.user_ratings_total,
            isOpen: p.opening_hours?.isOpen?.(),
            lat: p.geometry?.location?.lat() ?? 0,
            lng: p.geometry?.location?.lng() ?? 0,
            photoUrl: p.photos?.[0]?.getUrl({ maxWidth: 400 }),
          }));
          setGyms(gymData);
          gymData.forEach(addGymMarker);
          if (gymData.length > 0) {
            mapInstanceRef.current?.setCenter({ lat: gymData[0].lat, lng: gymData[0].lng });
            mapInstanceRef.current?.panTo({ lat: gymData[0].lat, lng: gymData[0].lng });
          }
        } else {
          setGyms([]);
          setError('No se encontraron resultados para esa búsqueda.');
        }
      }
    );
  };

  const handleGymClick = (gym: Gym) => {
    setSelectedGym(gym);
    mapInstanceRef.current?.panTo({ lat: gym.lat, lng: gym.lng });
    mapInstanceRef.current?.setCenter({ lat: gym.lat, lng: gym.lng });
  };

  const handleMyLocation = () => {
    if (!userLocation) return;
    mapInstanceRef.current?.panTo(userLocation);
    mapInstanceRef.current?.setCenter(userLocation);
    searchNearbyGyms(userLocation.lat, userLocation.lng);
    setSearchQuery('');
    setSelectedGym(null);
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  return (
    <div className="gym-finder-page">
      {/* Left Panel */}
      <div className="gym-panel">
        <div className="gym-panel-header">
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
            <MapPin size={24} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--accent)' }} />
            Gimnasios Cercanos
          </h1>
          <p className="page-subtitle">Encuentra dónde entrenar cerca de ti</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleTextSearch} className="gym-search-form">
          <div className="gym-search-input-wrapper">
            <Search size={18} className="gym-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar ciudad o zona..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="gym-search-input"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="gym-search-clear">
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary gym-search-btn" disabled={isLoading}>
            Buscar
          </button>
        </form>

        {/* My Location Button */}
        <button onClick={handleMyLocation} className="gym-location-btn" disabled={isLoading}>
          <Navigation size={16} />
          Mi ubicación
        </button>

        {/* Status */}
        {isLoading && (
          <div className="gym-status">
            <Loader size={20} className="gym-spinner" />
            <span>Buscando gimnasios...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="gym-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Results count */}
        {!isLoading && gyms.length > 0 && (
          <p className="gym-results-count">
            {gyms.length} gimnasio{gyms.length !== 1 ? 's' : ''} encontrado{gyms.length !== 1 ? 's' : ''}
            {searchMode === 'nearby' ? ' cerca de ti' : ''}
          </p>
        )}

        {/* Gym List */}
        <div className="gym-list">
          {gyms.map(gym => (
            <div
              key={gym.place_id}
              className={`gym-card ${selectedGym?.place_id === gym.place_id ? 'selected' : ''}`}
              onClick={() => handleGymClick(gym)}
            >
              {gym.photoUrl && (
                <div className="gym-card-photo">
                  <img src={gym.photoUrl} alt={gym.name} loading="lazy" />
                </div>
              )}
              <div className="gym-card-content">
                <h3 className="gym-card-name">{gym.name}</h3>
                <p className="gym-card-address">
                  <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {gym.vicinity}
                </p>
                <div className="gym-card-meta">
                  {gym.rating !== undefined && (
                    <span className="gym-card-rating">
                      <Star size={12} />
                      {gym.rating.toFixed(1)}
                      <span className="gym-card-stars">{renderStars(gym.rating)}</span>
                      {gym.user_ratings_total !== undefined && (
                        <span className="gym-card-reviews">({gym.user_ratings_total})</span>
                      )}
                    </span>
                  )}
                  {gym.isOpen !== undefined && (
                    <span className={`gym-card-status ${gym.isOpen ? 'open' : 'closed'}`}>
                      <Clock size={12} />
                      {gym.isOpen ? 'Abierto' : 'Cerrado'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!isLoading && gyms.length === 0 && !error && (
            <div className="gym-empty">
              <MapPin size={40} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
              <p>Busca gimnasios por nombre o usa tu ubicación actual</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="gym-map-container">
        <div ref={mapRef} className="gym-map" />
        {!mapsReady && !error && (
          <div className="gym-map-overlay">
            <Loader size={40} className="gym-spinner" />
            <p>Cargando mapa...</p>
          </div>
        )}
        {error && error.includes('API Key') && (
          <div className="gym-map-overlay">
            <AlertCircle size={40} style={{ color: '#fc8181' }} />
            <p style={{ color: '#fc8181', textAlign: 'center', maxWidth: '300px' }}>
              {error}
              <br />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                Agrega tu key en <code>.env</code> → <code>VITE_GOOGLE_MAPS_API_KEY</code>
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
