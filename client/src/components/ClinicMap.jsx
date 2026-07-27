import { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';
import API from '../api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

export default function ClinicMap() {
  const [location, setLocation] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Load the Google Maps script
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  useEffect(() => {
    // A fallback location (Ranchi coordinates) just in case the browser fails
    const fallbackLocation = { lat: 23.3441, lng: 85.3096 };

    const fetchClinics = async (lat, lng) => {
      try {
        const { data } = await API.get(`/clinics/nearby?lat=${lat}&lng=${lng}`);
        
        console.log("API Response Data:", data); 

        // UPDATED: Check for data.results!
        if (data && Array.isArray(data.results)) {
          setClinics(data.results);
        } else if (data && Array.isArray(data.clinics)) {
          setClinics(data.clinics);
        } else if (data && Array.isArray(data.data)) {
          setClinics(data.data);
        } else if (Array.isArray(data)) {
          setClinics(data);
        } else {
          console.error("Unexpected API response format:", data);
          setClinics([]); 
        }
      } catch (err) {
        setError('Failed to fetch nearby clinics.');
      } finally {
        setLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        // SUCCESS: The browser found you!
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          fetchClinics(lat, lng);
        },
        
        (err) => {
          console.warn("Location error, using fallback location:", err.message);
          setLocation(fallbackLocation); // Use Ranchi
          fetchClinics(fallbackLocation.lat, fallbackLocation.lng); // Fetch clinics in Ranchi
        },
        // OPTIONS: Don't wait forever, timeout after 10 seconds
        { timeout: 10000, maximumAge: 0, enableHighAccuracy: false }
      );
    } else {
      // Geolocation not supported at all
      setLocation(fallbackLocation);
      fetchClinics(fallbackLocation.lat, fallbackLocation.lng);
    }
  }, []);

  if (!isLoaded || loading) {
    return (
      <div className="w-full h-[400px] bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Finding nearby medical centers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-700">
        <AlertTriangle className="h-6 w-6 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-4">
      <div className="flex items-center space-x-2 text-slate-800">
        <MapPin className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-bold">Nearby Medical Centers</h3>
      </div>
      
      <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={location}
          zoom={13}
          options={{
            disableDefaultUI: true, // Hides clutter like street view pegman
            zoomControl: true,
          }}
        >
          {/* Blue marker for the User */}
          <Marker 
            position={location} 
            icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
          />

          {/* Red markers for the Clinics */}
          {Array.isArray(clinics) && clinics.map((clinic, index) => (
            <Marker
              key={index}
              position={{ lat: clinic.lat, lng: clinic.lng }}
              onClick={() => setSelectedClinic(clinic)}
            />
          ))}

          {/* Info Popup when a clinic is clicked */}
          {selectedClinic && (
            <InfoWindow
              position={{ lat: selectedClinic.lat, lng: selectedClinic.lng }}
              onCloseClick={() => setSelectedClinic(null)}
            >
              <div className="p-2 max-w-[200px]">
                <h4 className="font-bold text-sm mb-1">{selectedClinic.name}</h4>
                <p className="text-xs text-gray-600 mb-1">{selectedClinic.address}</p>
                {selectedClinic.rating && (
                  <p className="text-xs font-semibold text-yellow-600">⭐ {selectedClinic.rating} / 5</p>
                )}
                {selectedClinic.open_now !== undefined && (
                  <p className={`text-xs font-bold mt-1 ${selectedClinic.open_now ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedClinic.open_now ? 'Open Now' : 'Closed'}
                  </p>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}