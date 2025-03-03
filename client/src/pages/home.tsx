import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileDropzone } from "@/components/file-dropzone";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { generateFileId, generateUploaderId } from "@shared/schema";
import { QRCodeSVG } from 'qrcode.react';
import { Share2, QrCode } from 'lucide-react';

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');

  useEffect(() => {
    if (!localStorage.getItem('uploaderId')) {
      localStorage.setItem('uploaderId', generateUploaderId());
    }
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const content = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      clearInterval(interval);

      const response = await apiRequest("POST", "/api/files", {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        content,
        uploaderId: localStorage.getItem('uploaderId'),
        uploadTime: new Date().toISOString()
      });

      setUploadProgress(100);
      return response.json();
    },
    onSuccess: (data) => {
      const url = `${window.location.origin}/download/${data.fileId}`;
      setShareUrl(url);

      toast({
        title: "File uploaded successfully!",
        description: (
          <div className="mt-2 space-y-2">
            <p className="font-medium text-[#2C3E50]">Share this link to download the file:</p>
            <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E5E7EB] space-y-4">
              <code className="block break-all text-sm bg-white p-2 rounded border border-[#E5E7EB]">
                {url}
              </code>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQR(true)}
                  className="text-[#4ECDC4]"
                >
                  <QrCode className="w-4 h-4 mr-1" />
                  Show QR Code
                </Button>
              </div>
            </div>
            <p className="text-sm text-[#95A5A6]">
              As the uploader, you'll have access to additional controls and statistics.
            </p>
          </div>
        )
      });
      setLocation(`/download/${data.fileId}`);
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] to-[#F0F0F0] flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] text-transparent bg-clip-text">
              Share Files Securely
            </h1>
            <p className="text-[#95A5A6]">
              Direct browser-to-browser file sharing
            </p>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 mb-6 transform hover:shadow-md transition-all">
            <FileDropzone 
              onDrop={(file) => uploadMutation.mutate(file)}
              disabled={uploadMutation.isPending}
            />
          </div>

          {uploadMutation.isPending && (
            <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
              <Progress 
                value={uploadProgress} 
                className="mb-2"
                indicatorClassName="bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B]"
              />
              <p className="text-sm text-center text-[#95A5A6]">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {showQR && shareUrl && (
            <div className="mt-4 bg-white p-4 rounded-lg border border-[#E5E7EB] flex flex-col items-center">
              <QRCodeSVG value={shareUrl} size={200} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQR(false)}
                className="mt-2 text-[#95A5A6]"
              >
                Close QR Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}