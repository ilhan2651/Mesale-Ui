import MainLayout from "../layouts/MainLayout";

function Home() {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-12">
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-gray-800 mb-4">
                        Hoş Geldiniz
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                        MEŞALE - Afet Yönetim Sistemi
                    </p>
                </div>
            </div>
        </MainLayout>
    )
}
export default Home