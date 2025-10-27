import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { fileUploadClient } from '@/lib/fileUploadClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Image as ImageIcon, Loader2, Check, X, Folder, ArrowLeft, Trash2, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
}

interface MediaItem {
  name: string;
  url: string;
  created_at: string;
  isFolder?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  bucket = 'booking_media',
  folder = 'product-images',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(value || null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const loadMediaLibrary = async (path: string = '') => {
    setLoadingMedia(true);
    try {
      console.log('Loading media from path:', path || 'root');
      const { data, error } = await fileUploadClient.storage
        .from(bucket)
        .list(path, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      console.log('Raw storage data:', data);

      const items: MediaItem[] = await Promise.all(
        (data || []).map(async (file) => {
          // Check if it's a folder - folders have no id or metadata in Supabase storage
          const isFolder = !file.id || file.metadata === null;
          
          if (isFolder) {
            return {
              name: file.name,
              url: '',
              created_at: file.created_at || '',
              isFolder: true,
            };
          }

          // It's a file, get the public URL
          const filePath = path ? `${path}/${file.name}` : file.name;
          const { data: urlData } = fileUploadClient.storage
            .from(bucket)
            .getPublicUrl(filePath);
          
          return {
            name: file.name,
            url: urlData.publicUrl,
            created_at: file.created_at || '',
            isFolder: false,
          };
        })
      );

      console.log('Processed media items:', items);
      setMediaItems(items);
    } catch (error: any) {
      toast.error(`Fehler beim Laden der Medien: ${error.message}`);
      console.error('Media loading error:', error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleFolderClick = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(newPath);
    loadMediaLibrary(newPath);
  };

  const handleBackClick = () => {
    const previousPath = pathHistory[pathHistory.length - 1] || '';
    setPathHistory(pathHistory.slice(0, -1));
    setCurrentPath(previousPath);
    loadMediaLibrary(previousPath);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Bitte geben Sie einen Ordnernamen ein');
      return;
    }

    try {
      // Create a placeholder file to create the folder structure
      const folderPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
      const placeholderPath = `${folderPath}/.placeholder`;
      
      const { error } = await fileUploadClient.storage
        .from(bucket)
        .upload(placeholderPath, new Blob([''], { type: 'text/plain' }), {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      toast.success(`Ordner "${newFolderName}" erfolgreich erstellt`);
      setNewFolderName('');
      setShowNewFolderDialog(false);
      await loadMediaLibrary(currentPath);
    } catch (error: any) {
      toast.error(`Fehler beim Erstellen des Ordners: ${error.message}`);
    }
  };

  const handleDeleteClick = (item: MediaItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.isFolder) {
        // Delete folder: list all files in folder and delete them
        const folderPath = currentPath ? `${currentPath}/${itemToDelete.name}` : itemToDelete.name;
        const { data: files, error: listError } = await fileUploadClient.storage
          .from(bucket)
          .list(folderPath, {
            limit: 1000,
          });

        if (listError) throw listError;

        // Delete all files in the folder
        if (files && files.length > 0) {
          const filePaths = files.map(file => `${folderPath}/${file.name}`);
          const { error: deleteError } = await fileUploadClient.storage
            .from(bucket)
            .remove(filePaths);

          if (deleteError) throw deleteError;
        }

        toast.success(`Ordner "${itemToDelete.name}" erfolgreich gelöscht`);
      } else {
        // Delete single file
        const filePath = currentPath ? `${currentPath}/${itemToDelete.name}` : itemToDelete.name;
        const { error } = await fileUploadClient.storage
          .from(bucket)
          .remove([filePath]);

        if (error) throw error;

        toast.success(`Bild "${itemToDelete.name}" erfolgreich gelöscht`);
        
        // Clear selection if deleted image was selected
        if (selectedImage === itemToDelete.url) {
          setSelectedImage(null);
        }
      }

      setShowDeleteDialog(false);
      setItemToDelete(null);
      await loadMediaLibrary(currentPath);
    } catch (error: any) {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      // Always upload to the default folder (product-images)
      const uploadPath = folder ? `${folder}/${fileName}` : fileName;

      const { error: uploadError } = await fileUploadClient.storage
        .from(bucket)
        .upload(uploadPath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = fileUploadClient.storage
        .from(bucket)
        .getPublicUrl(uploadPath);

      setSelectedImage(urlData.publicUrl);
      toast.success('Bild erfolgreich hochgeladen!');
      
      // Navigate to the folder where we uploaded
      if (folder && currentPath !== folder) {
        setCurrentPath(folder);
        setPathHistory([]);
      }
      // Reload media library at current location
      await loadMediaLibrary(folder || currentPath);
    } catch (error: any) {
      toast.error(`Upload fehlgeschlagen: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }, [bucket, folder, currentPath]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleConfirm = () => {
    if (selectedImage) {
      onChange(selectedImage);
      setIsOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Reset to root when opening
      setCurrentPath('');
      setPathHistory([]);
      loadMediaLibrary('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <ImageIcon className="h-4 w-4 mr-2" />
          {value ? 'Bild ändern' : 'Bild auswählen'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Bild auswählen oder hochladen</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Medien</TabsTrigger>
            <TabsTrigger value="upload">Vom Computer hochladen</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {currentPath ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleBackClick}
                      disabled={loadingMedia}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Zurück
                    </Button>
                    <span className="font-medium">/{currentPath}</span>
                  </>
                ) : (
                  <span className="font-medium">Root</span>
                )}
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewFolderDialog(true)}
                disabled={loadingMedia}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Neuer Ordner
              </Button>
            </div>

            {loadingMedia ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="grid grid-cols-3 gap-4">
                  {mediaItems.map((item, index) => (
                    item.isFolder ? (
                      // Folder Item
                      <div
                        key={`folder-${item.name}-${index}`}
                        className="relative cursor-pointer rounded-lg border-2 border-transparent overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 bg-muted group"
                        onClick={() => handleFolderClick(item.name)}
                      >
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => handleDeleteClick(item, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="w-full h-32 flex items-center justify-center">
                          <Folder className="h-16 w-16 text-primary" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                          📁 {item.name}
                        </div>
                      </div>
                    ) : (
                      // Image Item
                      <div
                        key={`image-${item.url}-${index}`}
                        className={cn(
                          'relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:shadow-lg group',
                          selectedImage === item.url
                            ? 'border-primary ring-2 ring-primary'
                            : 'border-transparent'
                        )}
                        onClick={() => setSelectedImage(item.url)}
                      >
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => handleDeleteClick(item, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-32 object-cover"
                        />
                        {selectedImage === item.url && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                          {item.name}
                        </div>
                      </div>
                    )
                  ))}
                </div>
                {mediaItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <p>Keine Medien gefunden</p>
                    <p className="text-sm mt-1">
                      {currentPath ? 'Dieser Ordner ist leer' : 'Keine Ordner oder Dateien vorhanden'}
                    </p>
                  </div>
                )}
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50',
                uploading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {isDragActive
                      ? 'Bild hier ablegen...'
                      : 'Bild hierher ziehen oder klicken zum Auswählen'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG, GIF, WebP oder SVG (max. 10MB)
                  </p>
                </div>
              )}
            </div>

            {selectedImage && (
              <div className="relative rounded-lg border p-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium mb-1">Ausgewähltes Bild</p>
                    <p className="text-sm text-muted-foreground break-all">{selectedImage}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-4">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!selectedImage}>
            Auswählen
          </Button>
        </div>
      </DialogContent>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Ordner erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Ordnername</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="z.B. Produktbilder"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewFolderDialog(false);
                setNewFolderName('');
              }}
            >
              Abbrechen
            </Button>
            <Button type="button" onClick={handleCreateFolder}>
              Erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {itemToDelete?.isFolder ? 'Ordner löschen?' : 'Bild löschen?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.isFolder
                ? `Möchten Sie den Ordner "${itemToDelete.name}" und alle darin enthaltenen Dateien wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
                : `Möchten Sie das Bild "${itemToDelete?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
