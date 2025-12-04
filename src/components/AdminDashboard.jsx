import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    barcode: '',
    category: '',
    serving_size: '',
    nutrition: {
      calories: '',
      protein: '',
      fat: '',
      carbs: '',
      fiber: '',
      sugar: '',
      sodium: ''
    },
    ingredients: '',
    allergens: '',
    additives: ''
  });

  useEffect(() => {
    checkAuth();
    fetchProducts();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/login');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('nutrition.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        nutrition: { ...prev.nutrition, [key]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      barcode: '',
      category: '',
      serving_size: '',
      nutrition: {
        calories: '',
        protein: '',
        fat: '',
        carbs: '',
        fiber: '',
        sugar: '',
        sodium: ''
      },
      ingredients: '',
      allergens: '',
      additives: ''
    });
    setShowForm(false);
    setEditMode(false);
    setCurrentProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');

    const payload = {
      ...formData,
      ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(i => i),
      allergens: formData.allergens.split(',').map(a => a.trim()).filter(a => a),
      additives: formData.additives.split(',').map(a => a.trim()).filter(a => a)
    };
        console.log('📤 Payload yang dikirim:', payload); // TAMBAHKAN INI
        console.log('📤 Nutrition data:', payload.nutrition); // TAMBAHKAN INI
    try {
      const url = editMode 
        ? `http://localhost:5000/api/admin/products/${currentProduct.id}`
        : 'http://localhost:5000/api/admin/products';
      
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        alert(editMode ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!');
        resetForm();
        fetchProducts();
      } else {
        alert('Gagal menyimpan produk');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan');
    }
  };

// ============================================
// GANTI fungsi handleEdit di AdminDashboard.jsx
// LOKASI: Sekitar baris 132-151
// ============================================

const handleEdit = async (product) => {
  try {
    const response = await fetch(`http://localhost:5000/api/products/${product.id}`);
    const data = await response.json();
    
    if (data.success) {
      const p = data.data;
      
      // ⭐ FIX: Pastikan nutrition tidak null dan lengkap
      const defaultNutrition = {
        calories: '',
        protein: '',
        fat: '',
        carbs: '',
        fiber: '',
        sugar: '',
        sodium: ''
      };
      
      // Merge nutrition data dengan default values
      const nutritionData = p.nutrition ? {
        calories: p.nutrition.calories || '',
        protein: p.nutrition.protein || '',
        fat: p.nutrition.fat || '',
        carbs: p.nutrition.carbs || '',
        fiber: p.nutrition.fiber || '',
        sugar: p.nutrition.sugar || '',
        sodium: p.nutrition.sodium || ''
      } : defaultNutrition;
      
      setFormData({
        name: p.name || '',
        brand: p.brand || '',
        barcode: p.barcode || '',
        category: p.category || '',
        serving_size: p.serving_size || '',
        nutrition: nutritionData, // ⭐ Gunakan data yang sudah di-merge
        ingredients: p.ingredients?.join(', ') || '',
        allergens: p.allergens?.join(', ') || '',
        additives: p.additives?.join(', ') || ''
      });
      
      setCurrentProduct(product);
      setEditMode(true);
      setShowForm(true);
      
      console.log('✅ Edit mode activated for:', p.name);
      console.log('📊 Nutrition data:', nutritionData);
    }
  } catch (error) {
    console.error('❌ Error loading product for edit:', error);
    alert('Gagal memuat data produk untuk diedit');
  }
};

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;

    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(`http://localhost:5000/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Produk berhasil dihapus!');
        fetchProducts();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal menghapus produk');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800"> Admin Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={handleBackToHome}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
               Halaman Utama
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Add Product Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            {showForm ? ' Tutup Form' : ' Tambah Produk'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editMode ? ' Edit Produk' : ' Tambah Produk Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nama Produk"
                  className="px-4 py-2 border rounded-lg"
                  required
                />
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="Brand"
                  className="px-4 py-2 border rounded-lg"
                  required
                />
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  placeholder="Barcode"
                  className="px-4 py-2 border rounded-lg"
                  required
                />
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Kategori"
                  className="px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <input
                type="text"
                name="serving_size"
                value={formData.serving_size}
                onChange={handleInputChange}
                placeholder="Ukuran Sajian (contoh: 100g)"
                className="w-full px-4 py-2 border rounded-lg"
              />

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Nutrisi (per sajian)</h3>
                <div className="grid grid-cols-4 gap-4">
                  <input type="number" step="0.1" name="nutrition.calories" value={formData.nutrition.calories} onChange={handleInputChange} placeholder="Kalori" className="px-4 py-2 border rounded-lg" />
                  <input type="number" step="0.1" name="nutrition.protein" value={formData.nutrition.protein} onChange={handleInputChange} placeholder="Protein (g)" className="px-4 py-2 border rounded-lg" />
                  <input type="number" step="0.1" name="nutrition.fat" value={formData.nutrition.fat} onChange={handleInputChange} placeholder="Lemak (g)" className="px-4 py-2 border rounded-lg" />
                  <input type="number" step="0.1" name="nutrition.carbs" value={formData.nutrition.carbs} onChange={handleInputChange} placeholder="Karbo (g)" className="px-4 py-2 border rounded-lg" />
                  <input type="number" step="0.1" name="nutrition.fiber" value={formData.nutrition.fiber} onChange={handleInputChange} placeholder="Serat (g)" className="px-4 py-2 border rounded-lg" />
                  <input type="number" step="0.1" name="nutrition.sugar" value={formData.nutrition.sugar} onChange={handleInputChange} placeholder="Gula (g)" className="px-4 py-2 border rounded-lg" />
                  <input type="number" step="0.1" name="nutrition.sodium" value={formData.nutrition.sodium} onChange={handleInputChange} placeholder="Natrium (mg)" className="px-4 py-2 border rounded-lg" />
                </div>
              </div>

              <textarea
                name="ingredients"
                value={formData.ingredients}
                onChange={handleInputChange}
                placeholder="Bahan (pisahkan dengan koma)"
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />

              <textarea
                name="allergens"
                value={formData.allergens}
                onChange={handleInputChange}
                placeholder="Alergen (pisahkan dengan koma)"
                className="w-full px-4 py-2 border rounded-lg"
                rows="2"
              />

              <textarea
                name="additives"
                value={formData.additives}
                onChange={handleInputChange}
                placeholder="Zat Aditif (pisahkan dengan koma)"
                className="w-full px-4 py-2 border rounded-lg"
                rows="2"
              />

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  {editMode ? 'Update Produk' : 'Simpan Produk'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Product List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold">📦 Daftar Produk ({products.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{product.barcode}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.brand}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.category}</td>
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;