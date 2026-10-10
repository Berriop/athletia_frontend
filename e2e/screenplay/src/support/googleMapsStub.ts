export interface FakeGym {
  name: string;
  address: string;
  /** Palabra que debe contener la búsqueda de texto para que este gimnasio aparezca. */
  zone: string;
  rating: number;
  lat: number;
  lng: number;
}

/**
 * Script que reemplaza al SDK de Google Maps durante las pruebas E2E: define
 * `window.google` con un mapa, marcadores y un servicio de Places que responde
 * con los gimnasios indicados. Así la prueba no depende de internet, de la
 * clave ni de la cuota de Google.
 */
export function fakeGoogleMapsScript(gyms: FakeGym[]): string {
  return `
(function () {
  var GYMS = ${JSON.stringify(gyms)};
  function toPlaces(list) {
    return list.map(function (g) {
      return {
        place_id: 'e2e-' + g.name,
        name: g.name,
        vicinity: g.address,
        formatted_address: g.address,
        rating: g.rating,
        user_ratings_total: 50,
        opening_hours: { isOpen: function () { return true; } },
        geometry: { location: { lat: function () { return g.lat; }, lng: function () { return g.lng; } } }
      };
    });
  }
  function MapStub() { this.panTo = function () {}; this.setCenter = function () {}; }
  function MarkerStub() { this.setMap = function () {}; this.addListener = function () {}; }
  function InfoWindowStub() { this.setContent = function () {}; this.open = function () {}; }
  function PlacesServiceStub() {}
  PlacesServiceStub.prototype.nearbySearch = function (request, callback) {
    setTimeout(function () { callback(toPlaces(GYMS), 'OK'); }, 0);
  };
  PlacesServiceStub.prototype.textSearch = function (request, callback) {
    var query = String(request.query || '').toLowerCase();
    var found = GYMS.filter(function (g) { return query.indexOf(g.zone.toLowerCase()) !== -1; });
    setTimeout(function () { callback(found.length ? toPlaces(found) : [], found.length ? 'OK' : 'ZERO_RESULTS'); }, 0);
  };
  window.google = {
    maps: {
      Map: MapStub,
      Marker: MarkerStub,
      InfoWindow: InfoWindowStub,
      Animation: { DROP: 'DROP' },
      places: { PlacesService: PlacesServiceStub, PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' } }
    }
  };
})();
`;
}
