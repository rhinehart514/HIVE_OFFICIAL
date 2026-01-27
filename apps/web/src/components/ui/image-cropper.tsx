'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { motion } from 'framer-motion';
import { XMarkIcon, CheckIcon, ArrowUturnLeftIcon, MinusCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const ZoomOut = MinusCircleIcon;
const ZoomIn = PlusCircleIcon;
import { transitionSpring } from '@/lib/motion-primitives';
import { logger } from '@/lib/logger';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 3 / 4, // Portrait ratio matching profile card
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);

    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      onCropComplete(croppedImage);
    } catch (error) {
      logger.error('Error cropping image', { component: 'ImageCropper' }, error instanceof Error ? error : undefined);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 1));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black border-b border-white/[0.06]">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-[var(--bg-ground)] transition-colors"
          aria-label="Cancel cropping"
        >
          <XMarkIcon className="w-5 h-5" aria-hidden="true" />
        </button>
        <span className="text-sm font-medium text-white">Adjust photo</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isProcessing}
          className="p-2 rounded-lg text-gold-500 hover:bg-gold-500/10 transition-colors disabled:opacity-50"
          aria-label={isProcessing ? "Processing image" : "Confirm crop"}
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" aria-hidden="true" />
          ) : (
            <CheckIcon className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Cropper area */}
      <div className="flex-1 relative min-h-0">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspectRatio}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteCallback}
          cropShape="rect"
          showGrid={false}
          style={{
            containerStyle: {
              background: '#000',
            },
            cropAreaStyle: {
              border: '2px solid var(--color-gold-500, #FFD700)',
              borderRadius: '16px',
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 px-6 py-4 bg-black border-t border-white/[0.06] space-y-4">
        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-[var(--bg-ground)] transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" aria-hidden="true" />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom level"
            className="flex-1 h-1 bg-[var(--bg-ground)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-[var(--bg-ground)] transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Rotate button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleRotate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-[var(--bg-ground)] transition-colors"
          >
            <ArrowUturnLeftIcon className="w-4 h-4" aria-hidden="true" />
            Rotate
          </button>
        </div>
      </div>

      {/* Confirm button */}
      <div className="flex-shrink-0 px-6 pb-6 pt-2 bg-black">
        <motion.button
          type="button"
          onClick={handleConfirm}
          disabled={isProcessing}
          whileHover={{ opacity: 0.9 }}
          whileTap={{ opacity: 0.8 }}
          transition={transitionSpring}
          className="w-full h-12 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Use this photo'}
        </motion.button>
      </div>
    </motion.div>
  );

  // Use portal to render at document body level
  if (!mounted) return null;
  return createPortal(content, document.body);
}

/**
 * Creates a cropped image from the source
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // Set canvas size to safe area
  canvas.width = safeArea;
  canvas.height = safeArea;

  // Translate canvas to center
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // Draw rotated image
  ctx.drawImage(
    image,
    safeArea / 2 - image.width / 2,
    safeArea / 2 - image.height / 2
  );

  // Get rotated image data
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // Set canvas to crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Paste cropped image
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width / 2 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height / 2 - pixelCrop.y)
  );

  // Return as blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
}

/**
 * Creates an image element from a URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}
