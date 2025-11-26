import { useRef, useEffect, useState } from 'react';
import { SignatureType } from '../types/doa';

interface SignaturePadProps {
  onSave: (signatureData: string, signatureType: SignatureType, typedSignature?: string) => void;
  onClear?: () => void;
}

export function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Handle window resize
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.putImageData(imageData, 0, 0);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setTypedName('');
    onClear?.();
  };

  const generateTypedSignature = (name: string): string => {
    // Create a canvas to render the typed signature
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Style the signature
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.font = '48px "Brush Script MT", cursive, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  const save = () => {
    if (signatureMode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasSignature) return;

      const signatureData = canvas.toDataURL('image/png');
      onSave(signatureData, SignatureType.Drawn, undefined);
    } else {
      if (!typedName.trim()) return;

      const signatureData = generateTypedSignature(typedName);
      onSave(signatureData, SignatureType.Typed, typedName);
    }
  };

  const canSave = signatureMode === 'draw' ? hasSignature : typedName.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setSignatureMode('draw')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            signatureMode === 'draw'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Draw Signature
        </button>
        <button
          type="button"
          onClick={() => setSignatureMode('type')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            signatureMode === 'type'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Type Signature
        </button>
      </div>

      {/* Draw Mode */}
      {signatureMode === 'draw' && (
        <>
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-48 cursor-crosshair touch-none"
              style={{ touchAction: 'none' }}
            />
          </div>
          <p className="text-sm text-gray-500">
            Draw your signature above using your mouse or touchscreen
          </p>
        </>
      )}

      {/* Type Mode */}
      {signatureMode === 'type' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type Your Full Name
            </label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Enter your full name..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
          {typedName && (
            <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
              <div className="text-center text-5xl" style={{ fontFamily: '"Brush Script MT", cursive, serif' }}>
                {typedName}
              </div>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Your typed name will be converted into a signature format
          </p>
        </>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={clear}
          disabled={!canSave}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}
