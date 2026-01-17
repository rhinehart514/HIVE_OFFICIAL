'use client';

import { useState, useMemo, useCallback } from 'react';
import { PhotoIcon, PlusIcon, XMarkIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../../design-system/primitives';
import type { ElementProps } from '../shared/types';

interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: string;
}

/**
 * Photo Gallery Element
 *
 * A masonry-style photo gallery with upload support and lightbox.
 * Used in Event Series for shared photo walls.
 *
 * Config options:
 * - maxPhotos: Maximum number of photos allowed
 * - allowUpload: Whether to show upload button
 * - columns: Number of columns (1-4)
 * - showCaptions: Show photo captions
 * - allowedUploaders: List of userIds who can upload (empty = anyone)
 * - uploadLabel: Label for upload button
 * - emptyMessage: Message when no photos
 */
export function PhotoGalleryElement({
  id,
  config,
  sharedState,
  userState,
  onChange,
  onAction,
  context
}: ElementProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Get photos from shared state collections
  const photos = useMemo<Photo[]>(() => {
    const photosCollection = sharedState?.collections?.[`${id}:photos`] || {};
    return Object.values(photosCollection)
      .map(entry => ({
        id: entry.id,
        url: entry.data.url as string,
        thumbnailUrl: entry.data.thumbnailUrl as string | undefined,
        caption: entry.data.caption as string | undefined,
        uploadedBy: entry.createdBy,
        uploadedAt: entry.createdAt,
      }))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [id, sharedState?.collections]);

  // Check if current user can upload
  const canUpload = useMemo(() => {
    if (!config.allowUpload) return false;
    if (photos.length >= (config.maxPhotos || 50)) return false;

    const allowedUploaders = config.allowedUploaders || [];
    if (allowedUploaders.length === 0) return true;

    return context?.userId && allowedUploaders.includes(context.userId);
  }, [config.allowUpload, config.maxPhotos, config.allowedUploaders, context?.userId, photos.length]);

  // Handle file upload
  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onAction?.('upload_error', { error: 'Only image files are allowed' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onAction?.('upload_error', { error: 'File size must be less than 10MB' });
      return;
    }

    setIsUploading(true);

    try {
      // Trigger upload action - the runtime will handle actual upload
      onAction?.('upload_photo', {
        file,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  }, [onAction]);

  // Handle photo click for lightbox
  const handlePhotoClick = useCallback((photo: Photo) => {
    setSelectedPhoto(photo);
    onAction?.('view_photo', { photoId: photo.id });
  }, [onAction]);

  // Close lightbox
  const closeLightbox = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  // Grid columns class
  const columnsClass = useMemo(() => {
    const cols = config.columns || 3;
    switch (cols) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 4: return 'grid-cols-4';
      default: return 'grid-cols-3';
    }
  }, [config.columns]);

  return (
    <div className="space-y-4">
      {/* Header with upload button */}
      {canUpload && (
        <div className="flex justify-end">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isUploading}
              asChild
            >
              <span className="flex items-center gap-2">
                {isUploading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <PlusIcon className="h-4 w-4" />
                )}
                {config.uploadLabel || 'Add Photo'}
              </span>
            </Button>
          </label>
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 ? (
        <div className={`grid ${columnsClass} gap-2`}>
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-lg overflow-hidden bg-[var(--hivelab-surface)] cursor-pointer"
              onClick={() => handlePhotoClick(photo)}
            >
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || 'Photo'}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ArrowsPointingOutIcon className="h-6 w-6 text-white" />
              </div>

              {/* Caption */}
              {config.showCaptions && photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs text-white truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <PhotoIcon className="h-12 w-12 text-[var(--hivelab-text-tertiary)] mb-4" />
          <p className="text-sm text-[var(--hivelab-text-tertiary)]">
            {config.emptyMessage || 'No photos yet. Be the first to share!'}
          </p>
        </div>
      )}

      {/* Photo count */}
      {photos.length > 0 && (
        <div className="text-xs text-[var(--hivelab-text-tertiary)] text-center">
          {photos.length} / {config.maxPhotos || 50} photos
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>

          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.caption || 'Photo'}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {config.showCaptions && selectedPhoto.caption && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 rounded-lg">
              <p className="text-white text-sm">{selectedPhoto.caption}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
