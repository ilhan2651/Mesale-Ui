import { useState } from 'react'

function MainLayout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <div className="min-h-screen flex flex-col">

            {/* MODERN NAVBAR */}
            <nav className="bg-gradient-to-r from-red-600 to-orange-600 shadow-xl sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">

                        {/* LOGO */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-2xl">🔥</span>
                            </div>
                            <div>
                                <h1 className="text-white text-xl font-bold tracking-wide">MEŞALE</h1>
                                <p className="text-orange-100 text-xs">Afet Yönetim Sistemi</p>
                            </div>
                        </div>

                        {/* DESKTOP MENU */}
                        <div className="hidden md:flex items-center space-x-1">
                            <a href="/" className="text-white hover:bg-red-700 px-4 py-2 rounded-lg transition font-medium">
                                🏠 Ana Sayfa
                            </a>
                            <a href="/bina" className="text-white hover:bg-red-700 px-4 py-2 rounded-lg transition font-medium">
                                🏢 Bina Röntgeni
                            </a>
                            <a href="/harita" className="text-white hover:bg-red-700 px-4 py-2 rounded-lg transition font-medium">
                                🗺️ Harita
                            </a>
                            <a href="/yetenekler" className="text-white hover:bg-red-700 px-4 py-2 rounded-lg transition font-medium">
                                🎯 Yetenekler
                            </a>
                            <a href="/belgeler" className="text-white hover:bg-red-700 px-4 py-2 rounded-lg transition font-medium">
                                📄 Belgeler
                            </a>
                        </div>

                        {/* ACİL DURUM BUTONU */}
                        <div className="hidden md:flex items-center">
                            <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-2 rounded-lg shadow-lg transform hover:scale-105 transition duration-200 animate-pulse">
                                🚨 ACİL DURUM
                            </button>
                        </div>

                        {/* MOBİL HAMBURGER */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-white focus:outline-none"
                        >
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* MOBİL MENU */}
                    {mobileMenuOpen && (
                        <div className="md:hidden pb-4 space-y-2 animate-fade-in">
                            <a href="/" className="block text-white hover:bg-red-700 px-4 py-3 rounded-lg font-medium">
                                🏠 Ana Sayfa
                            </a>
                            <a href="/bina" className="block text-white hover:bg-red-700 px-4 py-3 rounded-lg font-medium">
                                🏢 Bina Röntgeni
                            </a>
                            <a href="/harita" className="block text-white hover:bg-red-700 px-4 py-3 rounded-lg font-medium">
                                🗺️ Harita
                            </a>
                            <a href="/yetenekler" className="block text-white hover:bg-red-700 px-4 py-3 rounded-lg font-medium">
                                🎯 Yetenekler
                            </a>
                            <a href="/belgeler" className="block text-white hover:bg-red-700 px-4 py-3 rounded-lg font-medium">
                                📄 Belgeler
                            </a>
                            <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-lg shadow-lg mt-2">
                                🚨 ACİL DURUM
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* ANA İÇERİK */}
            <main className="flex-1 bg-gradient-to-b from-gray-50 to-gray-100">
                {children}
            </main>

            {/* FOOTER */}
            <footer className="bg-gray-900 text-white py-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-4 md:mb-0">
                            <p className="text-lg font-bold">🔥 MEŞALE</p>
                            <p className="text-gray-400 text-sm">Huzur anında hazırla, afet anında yaşat</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-sm text-gray-400">© 2026 MEŞALE Projesi</p>
                            <p className="text-xs text-gray-500 mt-1">Tüm hakları saklıdır</p>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    )
}

export default MainLayout