import MainLayout from "../layouts/MainLayout"
import { useEffect, useState, useCallback } from "react"
import api from "../config/api"
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Leaflet varsayılan ikon yaması
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function Location() {
    // Seçilen değerler
    const [selectedCity, setSelectedCity] = useState("")
    const [selectedDistrict, setSelectedDistrict] = useState("")
    const [selectedNeighborhood, setSelectedNeighborhood] = useState("")

    // API'den gelecek veriler
    const [cities, setCities] = useState([])
    const [districts, setDistricts] = useState([])
    const [neighborhoods, setNeighborhoods] = useState([])

    // Yükleme durumları
    const [loadingCities, setLoadingCities] = useState(true)
    const [loadingDistricts, setLoadingDistricts] = useState(false)
    const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false)

    // Harita için
    const [mapCenter, setMapCenter] = useState([39.9334, 32.8597]) // Türkiye merkezi
    const [mapZoom, setMapZoom] = useState(6)
    const [markerPosition, setMarkerPosition] = useState(null)

    // Seçilen isimleri tutmak için
    const [selectedCityName, setSelectedCityName] = useState("")
    const [selectedDistrictName, setSelectedDistrictName] = useState("")
    const [selectedNeighborhoodName, setSelectedNeighborhoodName] = useState("")

    //Detay adres bilgileri 
    const [street, setStreet] = useState("")
    const [buildingNo, setBuildingNo] = useState("")
    const [floor, setFloor] = useState("")
    const [apartmentNo, setApartmentNo] = useState("")

    const [gpsLoading, setGpsLoading] = useState(false)

    // --- ÖNEMLİ: Dropdown'ları Harita Bilgisiyle Eşleştirme Fonksiyonu ---
    const syncDropdownsWithAddress = async (addressData) => {
        try {
            // 1. İl Eşleştirme
            const cityName = addressData.province || addressData.city || addressData.state || "";
            const foundCity = cities.find(c =>
                cityName.toLowerCase().replace('ı', 'i').includes(c.name.toLowerCase().replace('ı', 'i'))
            );

            if (foundCity) {
                setSelectedCity(foundCity.id.toString());
                setSelectedCityName(foundCity.name);

                // 2. İlçe Eşleştirme (İlçeleri önce çekmemiz lazım)
                const distRes = await api.get(`/Cities/${foundCity.id}/districts`);
                const distList = distRes.data.data;
                setDistricts(distList);

                const districtName = addressData.district || addressData.town || addressData.suburb || "";
                const foundDist = distList.find(d =>
                    districtName.toLowerCase().replace('ı', 'i').includes(d.name.toLowerCase().replace('ı', 'i'))
                );

                if (foundDist) {
                    setSelectedDistrict(foundDist.id.toString());
                    setSelectedDistrictName(foundDist.name);

                    // 3. Mahalle Eşleştirme
                    const neighRes = await api.get(`/Cities/districts/${foundDist.id}/neighborhoods`);
                    const neighList = neighRes.data.data;
                    setNeighborhoods(neighList);

                    const neighborhoodName = addressData.neighbourhood || addressData.village || "";
                    const foundNeigh = neighList.find(n =>
                        neighborhoodName.toLowerCase().replace('ı', 'i').includes(n.name.toLowerCase().replace('ı', 'i'))
                    );

                    if (foundNeigh) {
                        setSelectedNeighborhood(foundNeigh.id.toString());
                        setSelectedNeighborhoodName(foundNeigh.name);
                    }
                }
            }
        } catch (error) {
            console.log("Dropdown senkronizasyon hatası:", error);
        }
    };

    // Haritaya tıklandığında (Bileşen içinde tanımlandı)
    const handleMapClick = async (lat, lon) => {
        console.log("Haritaya tıklandı:", lat, lon);
        setMapCenter([lat, lon]);
        setMarkerPosition([lat, lon]);
        setMapZoom(17);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
            );
            const data = await response.json();

            if (data && data.address) {
                console.log("Tıklanan adres:", data.address);
                const streetName = data.address.road || data.address.street || "";
                setStreet(streetName);

                // Dropdownları doldurmayı dene
                await syncDropdownsWithAddress(data.address);
            }
        } catch (error) {
            console.log("Reverse geocoding hatası:", error);
        }
    };

    // Nominatim'den koordinat çek
    const getCoordinates = async (searchQuery, zoomLevel) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`
            )
            const data = await response.json()

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat)
                const lon = parseFloat(data[0].lon)
                setMapCenter([lat, lon])
                setMapZoom(zoomLevel)
                setMarkerPosition([lat, lon])
            }
        } catch (error) {
            console.log("Geocoding hatası:", error)
        }
    }

    // GPS ile konum al
    const getMyLocation = () => {
        if (!navigator.geolocation) {
            alert("Tarayıcınız konum özelliğini desteklemiyor!")
            return
        }
        setGpsLoading(true)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude
                const lon = position.coords.longitude
                setMapCenter([lat, lon])
                setMapZoom(17)
                setMarkerPosition([lat, lon])

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
                    )
                    const data = await response.json()
                    if (data && data.address) {
                        setStreet(data.address.road || data.address.street || "")
                        await syncDropdownsWithAddress(data.address);
                    }
                } catch (error) { console.log(error) }
                setGpsLoading(false)
            },
            (error) => {
                alert("Konum alınamadı.")
                setGpsLoading(false)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    // 1. Sayfa açılınca illeri çek
    useEffect(() => {
        api.get("/Cities")
            .then(response => {
                setCities(response.data.data)
                setLoadingCities(false)
            })
            .catch(error => {
                console.log("Hata:", error)
                setLoadingCities(false)
            })
    }, [])

    // 2. İl seçilince ilçeleri çek
    useEffect(() => {
        if (selectedCity) {
            setLoadingDistricts(true)
            api.get(`/Cities/${selectedCity}/districts`)
                .then(response => {
                    setDistricts(response.data.data)
                    setLoadingDistricts(false)
                })
                .catch(error => {
                    console.log("Hata:", error)
                    setLoadingDistricts(false)
                })
        }
    }, [selectedCity])

    // 3. İlçe seçilince mahalleleri çek
    useEffect(() => {
        if (selectedDistrict) {
            setLoadingNeighborhoods(true)
            api.get(`/Cities/districts/${selectedDistrict}/neighborhoods`)
                .then(response => {
                    setNeighborhoods(response.data.data)
                    setLoadingNeighborhoods(false)
                })
                .catch(error => {
                    console.log("Hata:", error)
                    setLoadingNeighborhoods(false)
                })
        }
    }, [selectedDistrict])

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-12">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">📍 Konumunuzu Belirleyin</h2>
                    <p className="text-gray-600">Afet anında size ulaşabilmemiz için konumunuzu kaydedin</p>
                </div>

                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
                    {/* SOL - FORM */}
                    <div className="flex-1 bg-white rounded-2xl shadow-xl p-8">
                        <button
                            onClick={getMyLocation}
                            disabled={gpsLoading}
                            className="w-full mb-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 disabled:bg-blue-300"
                        >
                            {gpsLoading ? <>⏳ Konum Alınıyor...</> : <>📍 Konumumu Otomatik Bul</>}
                        </button>

                        <div className="text-center text-gray-400 mb-6">─────── veya manuel seçin ───────</div>

                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">🏙️ İl</label>
                            <select
                                value={selectedCity}
                                onChange={(e) => {
                                    const cityId = e.target.value
                                    setSelectedCity(cityId)
                                    setSelectedDistrict(""); setSelectedNeighborhood("")
                                    setDistricts([]); setNeighborhoods([])
                                    const city = cities.find(c => c.id === Number(cityId))
                                    if (city) {
                                        setSelectedCityName(city.name)
                                        getCoordinates(`${city.name},Turkey`, 10)
                                    }
                                }}
                                disabled={loadingCities}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition disabled:bg-gray-100"
                            >
                                <option value="">{loadingCities ? "Yükleniyor..." : "İl Seçiniz..."}</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">🏘️ İlçe</label>
                            <select
                                value={selectedDistrict}
                                onChange={(e) => {
                                    const districtId = e.target.value
                                    setSelectedDistrict(districtId)
                                    setSelectedNeighborhood("")
                                    setNeighborhoods([])
                                    const district = districts.find(d => d.id === Number(districtId))
                                    if (district) {
                                        setSelectedDistrictName(district.name)
                                        getCoordinates(`${district.name},${selectedCityName},Turkey`, 12)
                                    }
                                }}
                                disabled={!selectedCity || loadingDistricts}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">{loadingDistricts ? "Yükleniyor..." : "İlçe Seçiniz..."}</option>
                                {districts.map(district => (
                                    <option key={district.id} value={district.id}>{district.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">🏠 Mahalle</label>
                            <select
                                value={selectedNeighborhood}
                                onChange={(e) => {
                                    const neighborhoodId = e.target.value
                                    setSelectedNeighborhood(neighborhoodId)
                                    const neighborhood = neighborhoods.find(n => n.id === Number(neighborhoodId))
                                    if (neighborhood) {
                                        setSelectedNeighborhoodName(neighborhood.name)
                                        getCoordinates(`${neighborhood.name},${selectedDistrictName},${selectedCityName},Turkey`, 15)
                                    }
                                }}
                                disabled={!selectedDistrict || loadingNeighborhoods}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">{loadingNeighborhoods ? "Yükleniyor..." : "Mahalle Seçiniz..."}</option>
                                {neighborhoods.map(neighborhood => (
                                    <option key={neighborhood.id} value={neighborhood.id}>{neighborhood.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="text-center text-gray-400 my-4">─────── Detay Adres ───────</div>

                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">🛤️ Cadde / Sokak</label>
                            <input
                                type="text"
                                value={street}
                                onChange={(e) => setStreet(e.target.value)}
                                placeholder="Örn: Atatürk Caddesi"
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">🏢 Bina No</label>
                                <input type="text" value={buildingNo} onChange={(e) => setBuildingNo(e.target.value)} placeholder="12" className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">📶 Kat</label>
                                <input type="text" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="3" className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">🚪 Daire</label>
                                <input type="text" value={apartmentNo} onChange={(e) => setApartmentNo(e.target.value)} placeholder="5" className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none" />
                            </div>
                        </div>

                        <button className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 rounded-xl hover:from-red-700 hover:to-orange-700 transition transform hover:scale-105 shadow-lg">
                            💾 Konumumu Kaydet
                        </button>
                    </div>

                    {/* SAĞ - HARİTA */}
                    <div className="flex-1 bg-white rounded-2xl shadow-xl p-4">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">🗺️ Harita</h3>
                        <p className="text-sm text-gray-500 mb-4">Haritaya tıklayarak konum seçebilirsiniz</p>
                        <div className="h-96 lg:h-full min-h-96 rounded-xl overflow-hidden border">
                            <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                <ChangeMapView center={mapCenter} zoom={mapZoom} />
                                <MapClickHandler onMapClick={handleMapClick} />
                                {markerPosition && (
                                    <Marker position={markerPosition}>
                                        <Popup>
                                            📍 {selectedNeighborhoodName || selectedDistrictName || selectedCityName || "Seçilen Konum"}
                                            {street && <><br />🛤️ {street}</>}
                                        </Popup>
                                    </Marker>
                                )}
                            </MapContainer>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}

export default Location

// Yardımcı Bileşenler
function ChangeMapView({ center, zoom }) {
    const map = useMap()
    useEffect(() => {
        if (center) map.flyTo(center, zoom, { duration: 1.5 })
    }, [center, zoom, map])
    return null
}

function MapClickHandler({ onMapClick }) {
    const map = useMap()
    useEffect(() => {
        const handleClick = (e) => onMapClick(e.latlng.lat, e.latlng.lng)
        map.on('click', handleClick)
        return () => map.off('click', handleClick)
    }, [map, onMapClick])
    return null
}