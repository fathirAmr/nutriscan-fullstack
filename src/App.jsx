import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Camera, Search, Clock, AlertCircle, CheckCircle, XCircle, TrendingUp, Award, ThumbsUp, ThumbsDown, Info, List, Loader, UserCircle, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import BarcodeScanner from './components/BarcodeScanner';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { api } from './services/api';

// ============================================
// KOMPONEN NAVBAR
// ============================================
const Navbar = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setIsAdmin(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setIsAdmin(false);
    navigate('/');
  };

  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-3xl">🥗</div>
            <div>
              <h1 className="text-2xl font-bold text-green-600">NutriScan</h1>
              <p className="text-xs text-gray-500">Cek Nutrisi Makananmu</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/admin/login"
                  className="flex items-center gap-2 px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition text-sm font-medium"
                >
                  <UserCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Login Admin</span>
                </Link>
                <Award className="text-green-500" size={28} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// KOMPONEN NUTRISCAN (APLIKASI UTAMA)
// ============================================
const NutriScan = () => {
  const [activeTab, setActiveTab] = useState('scan');
  const [scanMode, setScanMode] = useState('search');
  const [barcode, setBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedNutrient, setExpandedNutrient] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    loadProducts();
    loadHistory();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const response = await api.getAllProducts();
    if (response.success) {
      setProducts(response.data);
    }
    setLoading(false);
  };

  const loadHistory = async () => {
    const response = await api.getHistory();
    if (response.success) {
      setHistory(response.data);
    }
  };

  const handleClearHistory = async () => {
    try {
      const response = await api.clearHistory();
      if (response.success) {
        setHistory([]);
        setShowClearModal(false);
        alert('✅ Semua riwayat berhasil dihapus!');
      } else {
        alert('❌ Gagal menghapus riwayat: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      alert('❌ Terjadi kesalahan saat menghapus riwayat');
    }
  };

  const handleScan = async () => {
    if (!barcode.trim()) return;
    setScanning(true);
    
    const response = await api.getProductByBarcode(barcode);
    
    if (response.success) {
      const productData = transformProductData(response.data);
      setProduct(productData);
      await api.addToHistory(response.data.id);
      loadHistory();
    } else {
      setProduct({ notFound: true });
    }
    
    setScanning(false);
  };

  const handleBarcodeDetected = async (detectedBarcode) => {
    setBarcode(detectedBarcode);
    setShowScanner(false);
    setScanMode('manual');
    setScanning(true);
    
    const response = await api.getProductByBarcode(detectedBarcode);
    
    if (response.success) {
      const productData = transformProductData(response.data);
      setProduct(productData);
      await api.addToHistory(response.data.id);
      loadHistory();
    } else {
      setProduct({ notFound: true });
    }
    
    setScanning(false);
  };

  const handleSearch = async (query) => {
    const q = query || searchQuery;
    if (!q.trim()) {
      loadProducts();
      return;
    }
    
    setLoading(true);
    const response = await api.searchProducts(q);
    if (response.success) {
      setProducts(response.data);
    }
    setLoading(false);
  };

  const selectProduct = async (productData) => {
    setScanning(true);
    const response = await api.getProduct(productData.id);
    
    if (response.success) {
      const transformedData = transformProductData(response.data);
      setProduct(transformedData);
      await api.addToHistory(response.data.id);
      loadHistory();
    }
    
    setScanning(false);
    setSearchQuery('');
  };

  const transformProductData = (data) => {
    return {
      name: data.name,
      brand: data.brand,
      category: data.category,
      image: data.image,
      healthScore: data.health_score,
      nutrition: {
        servingSize: data.nutrition?.serving_size || 'N/A',
        calories: data.nutrition?.calories || 0,
        protein: data.nutrition?.protein || 0,
        carbs: data.nutrition?.carbs || 0,
        fat: data.nutrition?.fat || 0,
        sugar: data.nutrition?.sugar || 0,
        sodium: data.nutrition?.sodium || 0,
        fiber: data.nutrition?.fiber || 0,
      },
      ingredients: data.ingredients || [],
      allergens: data.allergens || [],
      additives: data.additives || []
    };
  };

  const getScoreColor = (score) => {
    const colors = { 'A': 'bg-green-500', 'B': 'bg-blue-500', 'C': 'bg-yellow-500', 'D': 'bg-orange-500', 'E': 'bg-red-500' };
    return colors[score] || 'bg-gray-500';
  };

  const getScoreText = (score) => {
    const texts = { 'A': 'Sangat Baik', 'B': 'Baik', 'C': 'Cukup', 'D': 'Kurang Baik', 'E': 'Tidak Baik' };
    return texts[score] || 'Unknown';
  };

  const getHealthWarnings = (n) => {
    const w = [];
    if (n.sugar > 15) w.push({ type: 'warning', text: 'Tinggi Gula', icon: AlertCircle });
    if (n.sodium > 400) w.push({ type: 'warning', text: 'Tinggi Sodium', icon: AlertCircle });
    if (n.fat > 15) w.push({ type: 'warning', text: 'Tinggi Lemak', icon: AlertCircle });
    if (n.calories < 150 && n.sugar < 10) w.push({ type: 'good', text: 'Rendah Kalori', icon: CheckCircle });
    if (n.fiber > 5) w.push({ type: 'good', text: 'Tinggi Serat', icon: CheckCircle });
    return w;
  };

  const getNutritionImpact = (nutrient, value) => {
    const impacts = {
      calories: { positive: ['Memberikan energi', 'Mendukung fungsi tubuh'], negative: value > 300 ? ['Risiko kenaikan berat badan'] : [] },
      protein: { positive: value > 5 ? ['Membangun otot', 'Meningkatkan imun'] : [], negative: value < 3 ? ['Protein sangat rendah'] : [] },
      carbs: { positive: ['Sumber energi untuk otak'], negative: value > 50 ? ['Karbohidrat sangat tinggi'] : [] },
      fat: { positive: value > 3 && value < 15 ? ['Membantu penyerapan vitamin'] : [], negative: value > 15 ? ['Lemak sangat tinggi'] : [] },
      sugar: { positive: value < 5 ? ['Energi cepat'] : [], negative: value > 15 ? ['Gula sangat tinggi', 'Risiko diabetes'] : [] },
      sodium: { positive: value > 50 && value < 200 ? ['Keseimbangan cairan'] : [], negative: value > 400 ? ['Sodium sangat tinggi'] : [] },
      fiber: { positive: value > 3 ? ['Bantu pencernaan', 'Kenyang lama'] : [], negative: value < 2 ? ['Serat sangat rendah'] : [] }
    };
    return impacts[nutrient] || { positive: [], negative: [] };
  };

  const NutritionItem = ({ label, value, impact }) => {
    const isExpanded = expandedNutrient === label;
    const hasInfo = impact.positive.length > 0 || impact.negative.length > 0;

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button onClick={() => setExpandedNutrient(isExpanded ? null : label)} className="w-full flex justify-between items-center p-3 hover:bg-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">{label}</span>
            {hasInfo && <Info size={16} className="text-blue-500" />}
          </div>
          <span className="font-bold text-lg">{value}</span>
        </button>
        
        {isExpanded && hasInfo && (
          <div className="border-t bg-white p-4 space-y-3">
            {impact.positive.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp size={18} className="text-green-600" />
                  <span className="font-semibold text-green-800">Dampak Positif:</span>
                </div>
                <ul className="space-y-1 ml-7">
                  {impact.positive.map((item, i) => (
                    <li key={i} className="text-sm text-green-700 flex gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {impact.negative.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsDown size={18} className="text-red-600" />
                  <span className="font-semibold text-red-800">Dampak Negatif:</span>
                </div>
                <ul className="space-y-1 ml-7">
                  {impact.negative.map((item, i) => (
                    <li key={i} className="text-sm text-red-700 flex gap-2">
                      <span className="text-red-500">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-4">
            {['scan', 'history'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors ${activeTab === tab ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'}`}>
                {tab === 'scan' ? <Camera size={20} /> : <Clock size={20} />}
                <span className="font-medium">{tab === 'scan' ? 'Scan' : 'Riwayat'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'scan' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Pilih Metode Pencarian</h2>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => { setScanMode('camera'); setShowScanner(true); }} className={`p-4 rounded-lg border-2 transition-all ${scanMode === 'camera' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <Camera className={`mx-auto mb-2 ${scanMode === 'camera' ? 'text-green-600' : 'text-gray-400'}`} size={32} />
                  <p className={`text-sm font-medium ${scanMode === 'camera' ? 'text-green-600' : 'text-gray-600'}`}>Scan Kamera</p>
                </button>
                
                <button onClick={() => setScanMode('manual')} className={`p-4 rounded-lg border-2 transition-all ${scanMode === 'manual' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <Search className={`mx-auto mb-2 ${scanMode === 'manual' ? 'text-green-600' : 'text-gray-400'}`} size={32} />
                  <p className={`text-sm font-medium ${scanMode === 'manual' ? 'text-green-600' : 'text-gray-600'}`}>Input Barcode</p>
                </button>
                
                <button onClick={() => setScanMode('search')} className={`p-4 rounded-lg border-2 transition-all ${scanMode === 'search' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <List className={`mx-auto mb-2 ${scanMode === 'search' ? 'text-green-600' : 'text-gray-400'}`} size={32} />
                  <p className={`text-sm font-medium ${scanMode === 'search' ? 'text-green-600' : 'text-gray-600'}`}>Cari Produk</p>
                </button>
              </div>
            </div>

            {scanMode === 'manual' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Search className="text-green-500" />
                  Input Barcode Manual
                </h2>
                <div className="flex gap-2 mb-4">
                  <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleScan()} placeholder="Masukkan barcode" className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500" />
                  <button onClick={handleScan} disabled={scanning} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50">
                    {scanning ? <><Loader className="animate-spin" size={20} />Scanning...</> : <><Search size={20} />Scan</>}
                  </button>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Coba barcode produk ini:</p>
                  <div className="flex flex-wrap gap-2">
                    {['8991002001015', '8991906201015', '8992802086783'].map(code => (
                      <button key={code} onClick={() => setBarcode(code)} className="text-xs bg-white px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-100">{code}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {scanMode === 'search' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <List className="text-green-500" />
                  Cari atau Pilih Produk
                </h2>
                <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); handleSearch(e.target.value); }} placeholder="Cari nama produk..." className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 mb-4" />
                {loading ? (
                  <div className="text-center py-12">
                    <Loader className="animate-spin mx-auto mb-4 text-green-500" size={48} />
                    <p className="text-gray-600">Loading produk...</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {products.map((prod) => (
                      <button key={prod.id} onClick={() => selectProduct(prod)} className="w-full flex items-center gap-4 p-4 border rounded-lg hover:bg-green-50 transition-colors">
                        <div className="text-4xl">{prod.image}</div>
                        <div className="flex-1 text-left">
                          <h3 className="font-bold">{prod.name}</h3>
                          <p className="text-sm text-gray-600">{prod.brand} • {prod.category}</p>
                        </div>
                        <div className={`w-12 h-12 ${getScoreColor(prod.health_score)} rounded-full flex items-center justify-center text-white font-bold text-xl`}>{prod.health_score}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {product && !product.notFound && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-6xl">{product.image}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{product.name}</h3>
                    <p className="text-gray-600">{product.brand}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-gray-100 rounded-full text-sm">{product.category}</span>
                  </div>
                  <div className="text-center">
                    <div className={`w-20 h-20 ${getScoreColor(product.healthScore)} rounded-full flex items-center justify-center text-white mb-2`}>
                      <span className="text-3xl font-bold">{product.healthScore}</span>
                    </div>
                    <p className="text-sm font-medium">{getScoreText(product.healthScore)}</p>
                  </div>
                </div>

                <div className="mb-6 space-y-2">
                  {getHealthWarnings(product.nutrition).map((w, i) => (
                    <div key={i} className={`flex items-center gap-2 p-3 rounded-lg ${w.type === 'warning' ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800'}`}>
                      <w.icon size={20} />
                      <span className="font-medium">{w.text}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <TrendingUp className="text-green-500" />
                    Informasi Nilai Gizi
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">Per {product.nutrition.servingSize}</p>
                    <div className="space-y-3">
                      {[
                        ['Kalori', `${product.nutrition.calories} kkal`, 'calories'],
                        ['Protein', `${product.nutrition.protein}g`, 'protein'],
                        ['Karbohidrat', `${product.nutrition.carbs}g`, 'carbs'],
                        ['Lemak', `${product.nutrition.fat}g`, 'fat'],
                        ['Gula', `${product.nutrition.sugar}g`, 'sugar'],
                        ['Sodium', `${product.nutrition.sodium}mg`, 'sodium'],
                        ['Serat', `${product.nutrition.fiber}g`, 'fiber']
                      ].map(([label, value, key]) => (
                        <NutritionItem key={key} label={label} value={value} impact={getNutritionImpact(key, product.nutrition[key])} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-3">Komposisi</h4>
                  <p className="text-gray-700">{product.ingredients.join(', ')}</p>
                </div>

                {product.allergens.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-lg mb-3 text-red-600 flex items-center gap-2">
                      <AlertCircle size={20} />
                      Mengandung Alergen
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.allergens.map((a, i) => (
                        <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {product.additives.length > 0 && (
                  <div>
                    <h4 className="font-bold text-lg mb-3">Bahan Tambahan</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.additives.map((a, i) => (
                        <span key={i} className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {product && product.notFound && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center py-12">
                  <XCircle size={64} className="mx-auto text-red-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Produk Tidak Ditemukan</h3>
                  <p className="text-gray-600">Produk tidak ada di database kami.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="text-green-500" />
                Riwayat Scan
              </h2>
              {history.length > 0 && (
                <button
                  onClick={() => setShowClearModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  <Trash2 size={16} />
                  Hapus Semua
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="text-center py-12">
                <Clock size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Belum ada riwayat scan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} onClick={async () => {
                    const response = await api.getProduct(item.id);
                    if (response.success) {
                      setProduct(transformProductData(response.data));
                      setActiveTab('scan');
                    }
                  }} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="text-4xl">{item.image}</div>
                    <div className="flex-1">
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.brand}</p>
                    </div>
                    <div className={`w-12 h-12 ${getScoreColor(item.health_score)} rounded-full flex items-center justify-center text-white`}>
                      <span className="text-xl font-bold">{item.health_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showScanner && (
        <BarcodeScanner onScanSuccess={handleBarcodeDetected} onClose={() => setShowScanner(false)} />
      )}

      {/* Modal Konfirmasi Hapus Riwayat */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-[scale-in_0.2s_ease-out]">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-500" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Hapus Semua Riwayat?</h3>
              <p className="text-gray-600">
                Tindakan ini akan menghapus semua riwayat scan Anda secara permanen dan tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// APP ROUTING
// ============================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><Navbar /><NutriScan /></>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;