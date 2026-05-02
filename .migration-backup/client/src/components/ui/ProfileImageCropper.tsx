import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crop, Upload, X, ImageIcon } from "lucide-react";

interface Box { x: number; y: number; size: number; }
interface DragState {
  type: "move" | "corner";
  corner?: string;
  startClientX: number;
  startClientY: number;
  startBox: Box;
}

interface ProfileImageCropperProps {
  onCropComplete: (blob: Blob) => void;
  onClose: () => void;
  isUploading?: boolean;
}

const MIN_BOX = 64;
const OUTPUT_SIZE = 480;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function ProfileImageCropper({ onCropComplete, onClose, isUploading }: ProfileImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [box, setBox] = useState<Box>({ x: 0, y: 0, size: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const getImgRect = useCallback(() => {
    const img = imgRef.current;
    if (!img) return { w: 0, h: 0 };
    return { w: img.clientWidth, h: img.clientHeight };
  }, []);

  const initBox = useCallback(() => {
    const { w, h } = getImgRect();
    if (w === 0 || h === 0) return;
    const size = Math.round(Math.min(w, h) * 0.78);
    setBox({ x: Math.round((w - size) / 2), y: Math.round((h - size) / 2), size });
  }, [getImgRect]);

  const onImgLoad = useCallback(() => {
    setTimeout(initBox, 30); // allow layout to settle
  }, [initBox]);

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent, type: "move" | "corner", corner?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = { type, corner, startClientX: clientX, startClientY: clientY, startBox: { ...box } };
  }, [box]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      e.preventDefault();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const { type, corner, startClientX, startClientY, startBox } = dragRef.current;
      const dx = clientX - startClientX;
      const dy = clientY - startClientY;
      const { w, h } = getImgRect();
      const { x: sx, y: sy, size: ss } = startBox;

      if (type === "move") {
        setBox({
          x: clamp(sx + dx, 0, w - ss),
          y: clamp(sy + dy, 0, h - ss),
          size: ss,
        });
        return;
      }

      // Corner resize — keep square aspect ratio using the dominant axis delta
      let newX = sx, newY = sy, newSize = ss;
      const d = (Math.abs(dx) >= Math.abs(dy)) ? dx : dy;

      switch (corner) {
        case "br":
          newSize = clamp(ss + d, MIN_BOX, Math.min(w - sx, h - sy));
          break;
        case "bl":
          newSize = clamp(ss - d, MIN_BOX, Math.min(sx + ss, h - sy));
          newX = sx + ss - newSize;
          break;
        case "tr":
          newSize = clamp(ss + d, MIN_BOX, Math.min(w - sx, sy + ss));
          newY = sy + ss - newSize;
          break;
        case "tl":
          newSize = clamp(ss - d, MIN_BOX, Math.min(sx + ss, sy + ss));
          newX = sx + ss - newSize;
          newY = sy + ss - newSize;
          break;
      }

      setBox({
        x: clamp(newX, 0, w - newSize),
        y: clamp(newY, 0, h - newSize),
        size: newSize,
      });
    };

    const onUp = () => { dragRef.current = null; };

    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [getImgRect]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    e.target.value = "";
  };

  const handleCropAndUpload = useCallback(() => {
    const img = imgRef.current;
    if (!img || !box.size) return;

    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    const srcX = Math.round(box.x * scaleX);
    const srcY = Math.round(box.y * scaleY);
    const srcSize = Math.round(box.size * Math.min(scaleX, scaleY));

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    canvas.toBlob((blob) => { if (blob) onCropComplete(blob); }, "image/jpeg", 0.88);
  }, [box, onCropComplete]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) {
      setImageSrc(URL.createObjectURL(file));
    }
  };

  const HANDLE_SIZE = 14;
  const half = HANDLE_SIZE / 2;
  const corners = [
    { id: "tl", style: { top: -half, left: -half, cursor: "nwse-resize" } },
    { id: "tr", style: { top: -half, right: -half, cursor: "nesw-resize" } },
    { id: "bl", style: { bottom: -half, left: -half, cursor: "nesw-resize" } },
    { id: "br", style: { bottom: -half, right: -half, cursor: "nwse-resize" } },
  ];

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !isUploading) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Crop className="w-5 h-5 text-purple-600" />
            Upload Profile Photo
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {!imageSrc ? (
            <div
              className="border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-gray-50 rounded-2xl p-10 text-center cursor-pointer transition-all"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              data-testid="image-drop-zone"
            >
              <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-purple-400" />
              </div>
              <p className="font-semibold text-gray-700 mb-1">Choose a photo</p>
              <p className="text-sm text-gray-400">or drag and drop it here</p>
              <p className="text-xs text-gray-300 mt-3">JPG or PNG, any size</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onSelectFile}
                data-testid="input-image-file"
              />
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400 mb-2 text-center select-none">
                Drag to reposition · Pull corners to resize
              </p>

              {/* Image + overlay container */}
              <div
                ref={containerRef}
                className="relative overflow-hidden rounded-xl bg-black select-none"
                style={{ lineHeight: 0 }}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  onLoad={onImgLoad}
                  alt="Crop preview"
                  className="w-full object-contain"
                  style={{ maxHeight: 400, display: "block" }}
                  draggable={false}
                />

                {box.size > 0 && (
                  <>
                    {/* Dark overlay — 4 rectangles around the crop box */}
                    {/* Top */}
                    <div className="absolute bg-black/60 pointer-events-none" style={{ top: 0, left: 0, right: 0, height: box.y }} />
                    {/* Bottom */}
                    <div className="absolute bg-black/60 pointer-events-none" style={{ top: box.y + box.size, left: 0, right: 0, bottom: 0 }} />
                    {/* Left */}
                    <div className="absolute bg-black/60 pointer-events-none" style={{ top: box.y, left: 0, width: box.x, height: box.size }} />
                    {/* Right */}
                    <div className="absolute bg-black/60 pointer-events-none" style={{ top: box.y, left: box.x + box.size, right: 0, height: box.size }} />

                    {/* Crop box — draggable move area */}
                    <div
                      className="absolute"
                      style={{
                        top: box.y,
                        left: box.x,
                        width: box.size,
                        height: box.size,
                        cursor: "move",
                        border: "2px solid rgba(168,85,247,0.9)",
                        boxSizing: "border-box",
                      }}
                      onMouseDown={(e) => startDrag(e, "move")}
                      onTouchStart={(e) => startDrag(e, "move")}
                    >
                      {/* Rule-of-thirds grid */}
                      {[1, 2].map((i) => (
                        <div key={`v${i}`} className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${(i / 3) * 100}%`, width: 1, background: "rgba(255,255,255,0.25)" }} />
                      ))}
                      {[1, 2].map((i) => (
                        <div key={`h${i}`} className="absolute left-0 right-0 pointer-events-none" style={{ top: `${(i / 3) * 100}%`, height: 1, background: "rgba(255,255,255,0.25)" }} />
                      ))}

                      {/* Corner handles */}
                      {corners.map(({ id, style }) => (
                        <div
                          key={id}
                          className="absolute bg-purple-500 rounded-full z-10"
                          style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, ...style }}
                          onMouseDown={(e) => startDrag(e, "corner", id)}
                          onTouchStart={(e) => startDrag(e, "corner", id)}
                        />
                      ))}

                      {/* Edge L-brackets for visual polish */}
                      {[
                        { top: 0, left: 0, borderTop: "3px solid #a855f7", borderLeft: "3px solid #a855f7", width: 20, height: 20 },
                        { top: 0, right: 0, borderTop: "3px solid #a855f7", borderRight: "3px solid #a855f7", width: 20, height: 20 },
                        { bottom: 0, left: 0, borderBottom: "3px solid #a855f7", borderLeft: "3px solid #a855f7", width: 20, height: 20 },
                        { bottom: 0, right: 0, borderBottom: "3px solid #a855f7", borderRight: "3px solid #a855f7", width: 20, height: 20 },
                      ].map((s, i) => (
                        <div key={i} className="absolute pointer-events-none" style={s} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <p className="text-xs text-gray-400 text-center mt-2 select-none">
                Square crop · Output: 480 × 480 px
              </p>

              <button
                onClick={() => setImageSrc(null)}
                className="mt-2 w-full text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 transition-colors"
                data-testid="button-choose-different"
              >
                <X className="w-4 h-4" /> Choose a different photo
              </button>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isUploading} data-testid="button-cancel-crop">
            Cancel
          </Button>
          {imageSrc && (
            <Button
              onClick={handleCropAndUpload}
              disabled={!box.size || isUploading}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white"
              data-testid="button-crop-upload"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              {isUploading ? "Uploading…" : "Crop & Upload"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
