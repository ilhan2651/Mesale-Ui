import MainLayout from "../layouts/MainLayout"
import { useEffect, useState } from "react"
import api from "../config/api"
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'

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
                console.log(`Koordinat bulundu: ${searchQuery} → ${lat}, ${lon}`)
                setMapCenter([lat, lon])
                setMapZoom(zoomLevel)
                setMarkerPosition([lat, lon])
            } else {
                console.log(`Koordinat bulunamadı: ${searchQuery}`)
            }
        } catch (error) {
            console.log("Geocoding hatası:", error)
        }
    }

    // 1. Sayfa açılınca illeri çek
    useEffect(() => {
        api.get("/Cities")
            .then(response => {
                console.log("İller geldi:", response.data)
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
                    console.log("İlçeler geldi:", response.data)
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
                    console.log("Mahalleler geldi:", response.data)
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

                {/* BAŞLIK */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        📍 Konumunuzu Belirleyin
                    </h2>
                    <p className="text-gray-600">
                        Afet anında size ulaşabilmemiz için konumunuzu kaydedin
                    </p>
                </div>

                {/* FORM VE HARİTA - YAN YANA */}
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">

                    {/* SOL - FORM */}
                    <div className="flex-1 bg-white rounded-2xl shadow-xl p-8">

                        {/* İL SEÇİMİ */}
                        <div className="mb-6">
                            <label className="block text-gray-700 font-semibold mb-2">
                                🏙️ İl
                            </label>
                            <select
                                value={selectedCity}
                                onChange={(e) => {
                                    const cityId = e.target.value
                                    setSelectedCity(cityId)
                                    setSelectedDistrict("")
                                    setSelectedNeighborhood("")
                                    setDistricts([])
                                    setNeighborhoods([])

                                    // Seçilen ilin ismini bul ve koordinat çek
                                    const city = cities.find(c => c.id === Number(cityId))
                                    if (city) {
                                        setSelectedCityName(city.name)
                                        setSelectedDistrictName("")
                                        setSelectedNeighborhoodName("")
                                        getCoordinates(`${city.name},Turkey`, 10)
                                    }
                                }}
                                disabled={loadingCities}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition disabled:bg-gray-100"
                            >
                                <option value="">
                                    {loadingCities ? "Yükleniyor..." : "İl Seçiniz..."}
                                </option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.id}>
                                        {city.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* İLÇE SEÇİMİ */}
                        <div className="mb-6">
                            <label className="block text-gray-700 font-semibold mb-2">
                                🏘️ İlçe
                            </label>
                            <select
                                value={selectedDistrict}
                                onChange={(e) => {
                                    const districtId = e.target.value
                                    setSelectedDistrict(districtId)
                                    setSelectedNeighborhood("")
                                    setNeighborhoods([])

                                    // Seçilen ilçenin ismini bul ve koordinat çek
                                    const district = districts.find(d => d.id === Number(districtId))
                                    if (district) {
                                        setSelectedDistrictName(district.name)
                                        setSelectedNeighborhoodName("")
                                        getCoordinates(`${district.name},${selectedCityName},Turkey`, 12)
                                    }
                                }}
                                disabled={!selectedCity || loadingDistricts}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {loadingDistricts ? "Yükleniyor..." : "İlçe Seçiniz..."}
                                </option>
                                {districts.map(district => (
                                    <option key={district.id} value={district.id}>
                                        {district.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* MAHALLE SEÇİMİ */}
                        <div className="mb-6">
                            <label className="block text-gray-700 font-semibold mb-2">
                                🏠 Mahalle
                            </label>
                            <select
                                value={selectedNeighborhood}
                                onChange={(e) => {
                                    const neighborhoodId = e.target.value
                                    setSelectedNeighborhood(neighborhoodId)

                                    // Seçilen mahallenin ismini bul ve koordinat çek
                                    const neighborhood = neighborhoods.find(n => n.id === Number(neighborhoodId))
                                    if (neighborhood) {
                                        setSelectedNeighborhoodName(neighborhood.name)
                                        getCoordinates(`${neighborhood.name},${selectedDistrictName},${selectedCityName},Turkey`, 15)
                                    }
                                }}
                                disabled={!selectedDistrict || loadingNeighborhoods}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {loadingNeighborhoods ? "Yükleniyor..." : "Mahalle Seçiniz..."}
                                </option>
                                {neighborhoods.map(neighborhood => (
                                    <option key={neighborhood.id} value={neighborhood.id}>
                                        {neighborhood.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* KAYDET BUTONU */}
                        <button
                            className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 rounded-xl hover:from-red-700 hover:to-orange-700 transition transform hover:scale-105 shadow-lg"
                        >
                            💾 Konumumu Kaydet
                        </button>
                    </div>

                    {/* SAĞ - HARİTA */}
                    {/* SAĞ - HARİTA */}
                    <div className="flex-1 bg-white rounded-2xl shadow-xl p-4">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">🗺️ Harita</h3>
                        <div className="h-96 rounded-xl overflow-hidden">
                            <MapContainer
                                center={mapCenter}
                                zoom={mapZoom}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap'
                                />
                                <ChangeMapView center={mapCenter} zoom={mapZoom} />
                                {markerPosition && (
                                    <Marker position={markerPosition}>
                                        <Popup>
                                            {selectedNeighborhoodName || selectedDistrictName || selectedCityName || "Seçilen Konum"}
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

// Haritayı hareket ettiren component
function ChangeMapView({ center, zoom }) {
    const map = useMap()
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, {
                duration: 2
            })
        }
    }, [center, zoom, map])
    return null
}