import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Check, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface CleanupUploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    reportId: string;
    onSuccess: () => void;
}

const CleanupUploadDialog: React.FC<CleanupUploadDialogProps> = ({ isOpen, onClose, reportId, onSuccess }) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [comment, setComment] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            toast({
                title: "Photo Required",
                description: "Please upload a photo of the completed cleanup.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('status', 'Awaiting Verification'); // As per user requirement
            formData.append('resolution_notes', comment);
            formData.append('verification_image', selectedFile);

            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

            // Assuming the endpoint accepts status updates with image
            // We might need to adjust this depending on the actual backend implementation
            // For now, using the report update endpoint
            await axios.put(`${API_URL}/reports/${reportId}/status`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            toast({
                title: "Cleanup Proof Submitted",
                description: "Report updated. Status: Awaiting Verification.",
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Submission failed", error);
            toast({
                title: "Submission Failed",
                description: "Could not upload proof. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-ocean-primary" />
                        Upload Cleanup Proof
                    </DialogTitle>
                    <DialogDescription>
                        Submit a photo of the restored site to complete this task.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Image Upload Area */}
                    <div className="space-y-2">
                        <Label>After-Cleaning Photo</Label>
                        {!previewUrl ? (
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/5 transition-colors">
                                <input
                                    type="file"
                                    id="cleanup-photo"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <Label htmlFor="cleanup-photo" className="cursor-pointer flex flex-col items-center gap-2">
                                    <div className="p-3 bg-ocean-light/10 rounded-full text-ocean-primary">
                                        <Upload className="h-6 w-6" />
                                    </div>
                                    <span className="text-sm font-medium">Click to upload photo</span>
                                    <span className="text-xs text-muted-foreground">JPG, PNG (Max 5MB)</span>
                                </Label>
                            </div>
                        ) : (
                            <div className="relative rounded-lg overflow-hidden border border-border">
                                <img src={previewUrl} alt="Cleanup preview" className="w-full h-64 object-cover" />
                                <button
                                    onClick={handleRemoveFile}
                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Comment Area */}
                    <div className="space-y-2">
                        <Label htmlFor="comment">Officer Comments (Optional)</Label>
                        <Textarea
                            id="comment"
                            placeholder="Describe the cleanup action taken..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedFile}
                        className="bg-ocean-primary hover:bg-ocean-deep text-white"
                    >
                        {isSubmitting ? (
                            <>Uploading...</>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Submit Proof
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CleanupUploadDialog;
