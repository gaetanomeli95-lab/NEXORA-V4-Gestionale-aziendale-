export default function TestCSS() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Test con classi Tailwind */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">
            Test CSS - NEXORA v4
          </h1>
          <p className="text-gray-600 mb-6">
            Se vedi colori e stili, il CSS funziona correttamente!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">
                Card Blu
              </h2>
              <p className="text-blue-600">
                Questa card usa classi Tailwind CSS
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h2 className="text-xl font-semibold text-green-800 mb-2">
                Card Verde
              </h2>
              <p className="text-green-600">
                Anche questa usa Tailwind CSS
              </p>
            </div>
          </div>
          
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Bottone Test
          </button>
        </div>

        {/* Test con classi CSS custom */}
        <div className="test-gradient p-6 rounded-lg text-white">
          <h2 className="text-2xl font-bold mb-4">
            Test Gradient CSS Custom
          </h2>
          <p className="mb-4">
            Questo usa una classe CSS custom con gradiente
          </p>
          <button className="test-button">
            Bottone CSS Custom
          </button>
        </div>

        {/* Test con classi CSS custom */}
        <div className="test-card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Card CSS Custom
          </h2>
          <p className="text-gray-600 mb-4">
            Questa card usa classi CSS custom definite in globals.css
          </p>
          <div className="flex space-x-4">
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
              Badge Rosso
            </span>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              Badge Giallo
            </span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              Badge Viola
            </span>
          </div>
        </div>

        {/* Test KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fatturato</p>
                <p className="text-2xl font-bold text-gray-900">€48.574</p>
                <p className="text-sm text-green-600">+12.5%</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <div className="w-6 h-6 bg-green-600 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ordini</p>
                <p className="text-2xl font-bold text-gray-900">1.234</p>
                <p className="text-sm text-red-600">-2.4%</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clienti</p>
                <p className="text-2xl font-bold text-gray-900">892</p>
                <p className="text-sm text-green-600">+8.1%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <div className="w-6 h-6 bg-purple-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            ← Torna alla Homepage
          </a>
        </div>
      </div>
    </div>
  )
}
