'use client';

import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Scan, QrCode as QrIcon } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrPage() {
  const [mode, setMode] = useState<'MY_QR' | 'SCAN'>('MY_QR');
  const [address] = useState<string>('0x1234...5678');
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const handleScanClick = () => {
    setMode('SCAN');
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error('Error stopping camera:', e);
      }
      scannerRef.current = null;
    }
  };

  const handleCameraPermission = async () => {
    setCameraActive(true);
    setScannedResult(null);

    // Wait for DOM to render the qr-reader element
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setScannedResult(decodedText);
            stopCamera();
          },
          () => {
            // QR code not found - ignore
          }
        );
      } catch (err) {
        console.error('Camera error:', err);
        setCameraActive(false);
      }
    }, 100);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (mode === 'SCAN' && !cameraActive) {
    return (
      <Layout hideNav>
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-8 text-center relative animate-fade-in">
          <h2 className="text-5xl font-display font-black text-white mb-16 leading-[0.9] tracking-tight">
            Allow camera
            <br />
            access
          </h2>

          <button
            onClick={handleCameraPermission}
            className="w-48 h-48 rounded-full bg-orby text-white font-display font-bold text-2xl hover:scale-105 active:scale-95 transition-transform shadow-[0_0_40px_rgba(40,80,255,0.3)] flex items-center justify-center tracking-tight"
          >
            Continue
          </button>

          <button
            onClick={() => setMode('MY_QR')}
            className="absolute bottom-12 text-zinc-500 hover:text-white font-medium font-sans tracking-wide uppercase text-sm"
          >
            Cancel
          </button>
        </div>
      </Layout>
    );
  }

  if (mode === 'SCAN' && cameraActive) {
    return (
      <Layout hideNav>
        <div className="min-h-screen bg-black relative flex flex-col">
          {/* Camera View */}
          <div className="flex-1 flex items-center justify-center relative">
            {scannedResult ? (
              <div className="text-center p-6">
                <p className="text-green-400 font-bold text-lg mb-4">QR Code Scanned!</p>
                <p className="text-white font-mono text-sm bg-zinc-800 p-4 rounded-xl break-all">
                  {scannedResult}
                </p>
              </div>
            ) : (
              <div id="qr-reader" className="w-full max-w-sm"></div>
            )}
          </div>

          <button
            onClick={async () => {
              await stopCamera();
              setMode('MY_QR');
              setCameraActive(false);
              setScannedResult(null);
            }}
            className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-white font-bold bg-zinc-800/80 px-6 py-3 rounded-full backdrop-blur font-sans hover:bg-zinc-700 transition-colors"
          >
            Close Camera
          </button>
        </div>
      </Layout>
    );
  }

  // Default: My QR
  return (
    <Layout>
      <div className="min-h-screen bg-orby flex flex-col items-center px-6 pt-6 pb-32">
        <div className="w-full flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-black tracking-tighter lowercase italic text-white">orby</h1>
          <span className="text-white/80 font-bold text-sm tracking-wide uppercase font-sans">Scan or share</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
          {/* QR Card */}
          <div className="bg-white p-6 rounded-[40px] shadow-2xl w-full aspect-square flex flex-col items-center justify-center mb-8 animate-scale-in">
            <div className="w-full h-full bg-zinc-100 rounded-2xl flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-4 grid grid-cols-6 grid-rows-6 gap-2 opacity-10">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-black' : 'bg-transparent'}`}></div>
                ))}
              </div>
              <QrIcon size={120} className="text-black z-10" />
            </div>
            <div className="mt-4 font-mono text-zinc-500 font-bold tracking-widest bg-zinc-100 px-4 py-2 rounded-full text-xs">
              {address}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 bg-white p-1.5 rounded-full w-full max-w-[280px] shadow-lg animate-fade-in-up delay-200">
            <button
              onClick={() => setMode('MY_QR')}
              className={`flex-1 py-3 rounded-full font-bold text-sm transition-all font-sans ${
                mode === 'MY_QR' ? 'bg-black text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              My QR
            </button>
            <button
              onClick={handleScanClick}
              className={`flex-1 py-3 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 font-sans ${
                mode === 'SCAN' ? 'bg-black text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Scan size={16} /> Scan
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
