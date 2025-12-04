import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Smartphone } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear')
          );
          setSelectedCamera(backCamera ? backCamera.id : devices[0].id);
        } else {
          setError('Tidak ada kamera terdeteksi');
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
        setError('Gagal mengakses kamera. Pastikan izin diberikan.');
      });
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) {
      setError('Pilih kamera terlebih dahulu');
      return;
    }

    try {
      setError('');
      html5QrCodeRef.current = new Html5Qrcode('barcode-reader');
      
      await html5QrCodeRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.7777778
        },
        (decodedText, decodedResult) => {
          console.log('Barcode detected:', decodedText);
          onScanSuccess(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Scanning...
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Gagal memulai scanner: ' + err.message);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="text-green-500" size={28} />
            Scan Barcode
          </h2>
          <button
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {cameras.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Kamera:
              </label>
              <select
                value={selectedCamera || ''}
                onChange={(e) => setSelectedCamera(e.target.value)}
                disabled={isScanning}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              >
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${camera.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <div
              id="barcode-reader"
              ref={scannerRef}
              className="w-full rounded-xl overflow-hidden bg-gray-900"
              style={{ minHeight: '300px' }}
            />
            
            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-xl">
                <div className="text-center text-white">
                  <Smartphone size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Siap untuk scan barcode</p>
                  <button
                    onClick={startScanning}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    Mulai Scan
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
              {error.includes('izin') && (
                <p className="text-red-600 text-xs mt-2">
                  💡 Tip: Klik icon gembok di address bar dan izinkan akses kamera
                </p>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Cara Scan:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Pastikan kamera sudah dipilih</li>
              <li>Klik tombol "Mulai Scan"</li>
              <li>Arahkan kamera ke barcode produk</li>
              <li>Jaga jarak 10-20cm dari barcode</li>
              <li>Tunggu hingga terdeteksi otomatis</li>
            </ol>
          </div>

          {isScanning && (
            <button
              onClick={stopScanning}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Stop Scanning
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;