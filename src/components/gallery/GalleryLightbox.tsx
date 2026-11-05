"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { PublicMediaAsset } from "@/lib/public/gallery";

interface GalleryLightboxProps {
  items: PublicMediaAsset[];
  locale: string;
}

export function GalleryLightbox({ items, locale }: GalleryLightboxProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const touchStartX = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;

  const handleOpen = (index: number) => {
    setSelectedIndex(index);
  };

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev! + 1) % items.length);
  }, [selectedIndex, items.length]);

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev! - 1 + items.length) % items.length);
  }, [selectedIndex, items.length]);

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [selectedIndex, handleClose, handleNext, handlePrev]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <div>
      {/* Grid of gallery cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {items.map((item, index) => {
          const alt = (locale === "ta" && item.altTextTa) ? item.altTextTa : (item.altTextEn || "Hospital Facility");
          const caption = (locale === "ta" && item.captionTa) ? item.captionTa : item.captionEn;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleOpen(index)}
              className="group text-left rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 card-hover focus-ring relative flex flex-col"
              aria-label={`View photo: ${caption || alt}`}
            >
              <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                <Image
                  src={item.publicUrl}
                  alt={alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`object-cover transition-transform duration-500 ${shouldReduceMotion ? "" : "group-hover:scale-105"}`}
                  unoptimized
                />
                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white p-2.5 rounded-full shadow-md">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>
              </div>
              {caption && (
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">{caption}</p>
                  {item.album && (
                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-2 block">
                      {item.album}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        >
          {/* Close button */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close image preview"
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition focus-ring"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left / Prev button */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition focus-ring hidden sm:flex"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Main preview container */}
          <div className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center">
            <div className="relative w-full aspect-[4/3] max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl bg-black">
              <Image
                src={selectedItem.publicUrl}
                alt={(locale === "ta" && selectedItem.altTextTa) ? selectedItem.altTextTa : (selectedItem.altTextEn || "Hospital")}
                fill
                sizes="100vw"
                className="object-contain"
                unoptimized
                priority
              />
            </div>

            {/* Caption & Counter */}
            <div className="mt-4 text-center text-white max-w-2xl px-4">
              {((locale === "ta" && selectedItem.captionTa) || selectedItem.captionEn) && (
                <p className="text-sm sm:text-base font-medium">
                  {(locale === "ta" && selectedItem.captionTa) ? selectedItem.captionTa : selectedItem.captionEn}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {selectedIndex! + 1} of {items.length}
              </p>
            </div>
          </div>

          {/* Right / Next button */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition focus-ring hidden sm:flex"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
