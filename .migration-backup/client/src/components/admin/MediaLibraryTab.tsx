import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Trash2, Image, FileText, Film, Music, File, FolderOpen,
  Search, Grid, List, MoreVertical, Copy, ExternalLink, Download,
  Loader2, Plus, X, Check, Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  altText?: string;
  caption?: string;
  folder?: string;
  usedIn?: any;
  createdAt: string;
  updatedAt: string;
}

interface MediaLibraryTabProps {
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  selectionMode?: boolean;
  onSelect?: (item: MediaItem) => void;
  onClose?: () => void;
}

export function MediaLibraryTab({ toast, selectionMode = false, onSelect, onClose }: MediaLibraryTabProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: mediaItems = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ["/api/sysctrl/media", selectedFolder !== "all" ? selectedFolder : undefined],
  });

  const { data: folders = [] } = useQuery<string[]>({
    queryKey: ["/api/sysctrl/media/folders"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sysctrl/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/media"] });
      toast({ title: "Media deleted successfully" });
      setShowDetailsDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to delete media", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MediaItem> }) => 
      apiRequest("PATCH", `/api/sysctrl/media/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/media"] });
      toast({ title: "Media updated" });
    },
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.startsWith("video/")) return Film;
    if (mimeType.startsWith("audio/")) return Music;
    if (mimeType.includes("pdf")) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.altText && item.altText.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = selectedFolder === "all" || item.folder === selectedFolder;
    const matchesType = typeFilter === "all" ||
      (typeFilter === "images" && item.mimeType.startsWith("image/")) ||
      (typeFilter === "videos" && item.mimeType.startsWith("video/")) ||
      (typeFilter === "documents" && (item.mimeType.includes("pdf") || item.mimeType.includes("document")));
    return matchesSearch && matchesFolder && matchesType;
  });

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copied to clipboard" });
  };

  const handleItemClick = (item: MediaItem) => {
    if (selectionMode && onSelect) {
      onSelect(item);
    } else {
      setSelectedItem(item);
      setShowDetailsDialog(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Media Library
          </h2>
          <p className="text-muted-foreground">Manage images and files across your website</p>
        </div>
        <div className="flex gap-2">
          {selectionMode && onClose && (
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button onClick={() => setShowUploadDialog(true)} data-testid="button-upload-media">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-media"
          />
        </div>
        
        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
          <SelectTrigger className="w-[180px]" data-testid="select-folder">
            <FolderOpen className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Folders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Folders</SelectItem>
            {folders.map((folder) => (
              <SelectItem key={folder} value={folder}>{folder}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="documents">Docs</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex border rounded-md">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none"
            data-testid="button-grid-view"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="rounded-l-none"
            data-testid="button-list-view"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No media files found</p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload your first file
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredItems.map((item) => {
            const FileIcon = getFileIcon(item.mimeType);
            return (
              <Card 
                key={item.id}
                className="overflow-hidden hover-elevate cursor-pointer group"
                onClick={() => handleItemClick(item)}
                data-testid={`media-item-${item.id}`}
              >
                <div className="aspect-square overflow-hidden bg-muted relative">
                  {item.mimeType.startsWith("image/") ? (
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.altText || item.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {selectionMode ? (
                      <Button size="sm" variant="secondary">
                        <Check className="w-4 h-4 mr-1" />
                        Select
                      </Button>
                    ) : (
                      <>
                        <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); handleCopyUrl(item.url); }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <CardContent className="p-2">
                  <p className="text-xs font-medium truncate">{item.originalName}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-3">File</th>
                  <th className="p-3 hidden md:table-cell">Type</th>
                  <th className="p-3 hidden sm:table-cell">Size</th>
                  <th className="p-3 hidden lg:table-cell">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const FileIcon = getFileIcon(item.mimeType);
                  return (
                    <tr 
                      key={item.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleItemClick(item)}
                      data-testid={`media-row-${item.id}`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {item.mimeType.startsWith("image/") ? (
                            <img
                              src={item.thumbnailUrl || item.url}
                              alt=""
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <FileIcon className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium truncate max-w-[200px]">{item.originalName}</span>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {item.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">
                        {formatFileSize(item.size)}
                      </td>
                      <td className="p-3 text-muted-foreground hidden lg:table-cell">
                        {format(new Date(item.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyUrl(item.url); }}>
                              <Copy className="w-4 h-4 mr-2" /> Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}>
                              <ExternalLink className="w-4 h-4 mr-2" /> Open
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Delete this file?")) deleteMutation.mutate(item.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <UploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        folders={folders}
        toast={toast}
      />

      <MediaDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        item={selectedItem}
        onUpdate={(id, data) => updateMutation.mutate({ id, data })}
        onDelete={(id) => deleteMutation.mutate(id)}
        onCopyUrl={handleCopyUrl}
      />
    </motion.div>
  );
}

function UploadDialog({
  open,
  onOpenChange,
  folders,
  toast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: string[];
  toast: MediaLibraryTabProps["toast"];
}) {
  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [folder, setFolder] = useState("");
  const [newFolder, setNewFolder] = useState("");

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const filename = url.split("/").pop() || "uploaded-file";
      const data = {
        filename,
        originalName: filename,
        url,
        mimeType: getMimeType(url),
        size: 0,
        altText: altText || null,
        caption: caption || null,
        folder: newFolder || folder || null,
      };
      return apiRequest("POST", "/api/sysctrl/media", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/media"] });
      toast({ title: "Media added successfully" });
      onOpenChange(false);
      setUrl("");
      setAltText("");
      setCaption("");
      setFolder("");
      setNewFolder("");
    },
    onError: () => {
      toast({ title: "Failed to add media", variant: "destructive" });
    },
  });

  const getMimeType = (url: string): string => {
    const ext = url.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      mp4: "video/mp4",
      webm: "video/webm",
      pdf: "application/pdf",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Media</DialogTitle>
          <DialogDescription>
            Add a media file by providing its URL
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="mediaUrl">URL</Label>
            <Input
              id="mediaUrl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              data-testid="input-media-url"
            />
          </div>
          
          {url && url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) && (
            <div className="aspect-video overflow-hidden rounded-md bg-muted">
              <img src={url} alt="Preview" className="w-full h-full object-contain" />
            </div>
          )}
          
          <div>
            <Label htmlFor="altText">Alt Text</Label>
            <Input
              id="altText"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image for accessibility"
              data-testid="input-alt-text"
            />
          </div>
          
          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption"
              rows={2}
              data-testid="input-caption"
            />
          </div>
          
          <div>
            <Label>Folder</Label>
            <div className="flex gap-2">
              <Select value={folder} onValueChange={setFolder}>
                <SelectTrigger className="flex-1" data-testid="select-upload-folder">
                  <SelectValue placeholder="Choose folder or create new" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No folder</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                placeholder="New folder"
                className="w-[140px]"
                data-testid="input-new-folder"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending || !url}
            data-testid="button-add-media"
          >
            {uploadMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Add Media
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MediaDetailsDialog({
  open,
  onOpenChange,
  item,
  onUpdate,
  onDelete,
  onCopyUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MediaItem | null;
  onUpdate: (id: number, data: Partial<MediaItem>) => void;
  onDelete: (id: number) => void;
  onCopyUrl: (url: string) => void;
}) {
  const [altText, setAltText] = useState(item?.altText || "");
  const [caption, setCaption] = useState(item?.caption || "");
  const [isEditing, setIsEditing] = useState(false);

  if (!item) return null;

  const FileIcon = item.mimeType.startsWith("image/") ? Image :
                   item.mimeType.startsWith("video/") ? Film :
                   item.mimeType.startsWith("audio/") ? Music : File;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Media Details</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)]">
        <div className="grid md:grid-cols-2 gap-6 py-4">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            {item.mimeType.startsWith("image/") ? (
              <img
                src={item.url}
                alt={item.altText || item.originalName}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileIcon className="w-20 h-20 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Filename</Label>
              <p className="font-medium break-all">{item.originalName}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <p className="text-sm">{item.mimeType}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Size</Label>
                <p className="text-sm">{formatFileSize(item.size)}</p>
              </div>
              {item.width && item.height && (
                <div>
                  <Label className="text-xs text-muted-foreground">Dimensions</Label>
                  <p className="text-sm">{item.width} x {item.height}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Date</Label>
                <p className="text-sm">{format(new Date(item.createdAt), "MMM d, yyyy")}</p>
              </div>
            </div>
            
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="editAlt">Alt Text</Label>
                  <Input
                    id="editAlt"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe the image"
                  />
                </div>
                <div>
                  <Label htmlFor="editCaption">Caption</Label>
                  <Textarea
                    id="editCaption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={2}
                    placeholder="Optional caption"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    onClick={() => {
                      onUpdate(item.id, { altText, caption });
                      setIsEditing(false);
                    }}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                {item.altText && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Alt Text</Label>
                    <p className="text-sm">{item.altText}</p>
                  </div>
                )}
                {item.caption && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Caption</Label>
                    <p className="text-sm">{item.caption}</p>
                  </div>
                )}
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit Details
                </Button>
              </>
            )}
            
            <div>
              <Label className="text-xs text-muted-foreground">URL</Label>
              <div className="flex gap-2 mt-1">
                <Input value={item.url} readOnly className="text-xs" />
                <Button size="icon" variant="outline" onClick={() => onCopyUrl(item.url)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
        
        <DialogFooter className="flex-shrink-0 gap-2">
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Delete this file?")) {
                onDelete(item.id);
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button variant="outline" onClick={() => window.open(item.url, '_blank')}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
