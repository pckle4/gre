import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { apiRequest } from "@/lib/queryClient";
import { Download, Check, Pause, Play, FileText, Clock, BarChart, Share2, StopCircle, QrCode } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import type { File } from "@shared/schema";
import { useState, useEffect, useRef } from "react";

function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

export default function DownloadPage() {
  const { fileId } = useParams();
  const [isPaused, setIsPaused] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fileQuery = useQuery<File>({
    queryKey: [`/api/files/${fileId}`],
    enabled: !!fileId
  });

  useEffect(() => {
    if (fileQuery.data) {
      const uploaderId = localStorage.getItem('uploaderId');
      setIsOwner(uploaderId === fileQuery.data.uploaderId);
    }
  }, [fileQuery.data]);

  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (!fileQuery.data) return;

      abortControllerRef.current = new AbortController();
      const response = await fetch(fileQuery.data.content, {
        signal: abortControllerRef.current.signal
      });
      const reader = response.body?.getReader();
      const contentLength = fileQuery.data.fileSize;

      let receivedLength = 0;
      const chunks: Uint8Array[] = [];

      if (!reader) throw new Error("Unable to read file");

      while(true) {
        if (isPaused) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        const {done, value} = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;
        setDownloadProgress((receivedLength / contentLength) * 100);
      }

      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileQuery.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await apiRequest("POST", `/api/files/${fileId}/downloaded`);
    }
  });

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setDownloadProgress(0);
      downloadMutation.reset();
    }
  };

  if (fileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] to-[#F0F0F0] flex items-center justify-center">
        <ProgressRing />
      </div>
    );
  }

  if (!fileQuery.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] to-[#F0F0F0] flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-[#2C3E50] mb-2">File Not Found</h1>
            <p className="text-[#95A5A6]">This file may have expired or been removed</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDownloading = downloadMutation.isPending && downloadProgress > 0;
  const shareUrl = `${window.location.origin}/download/${fileId}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] to-[#F0F0F0] flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold text-center text-[#2C3E50] mb-6 flex items-center justify-center gap-2">
            <FileText className="w-6 h-6 text-[#4ECDC4]" />
            Ready to Download
          </h1>

          {/* File Info Box */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E5E7EB] mb-6 transform hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-[#4ECDC4]" />
              <p className="font-medium text-[#2C3E50]">{fileQuery.data.fileName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm text-[#95A5A6] flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatSize(fileQuery.data.fileSize)}
              </div>
              <div className="text-sm text-[#95A5A6] flex items-center gap-1">
                <BarChart className="w-4 h-4" />
                {fileQuery.data.downloadCount} downloads
              </div>
            </div>
          </div>

          {/* Share Box */}
          <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB] mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#FF6B6B]" />
                <h3 className="font-medium text-[#2C3E50]">Share File</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQR(!showQR)}
                className="text-[#4ECDC4] hover:text-[#4ECDC4]/80"
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
            {showQR && (
              <div className="flex justify-center mb-3 bg-white p-4 rounded-lg">
                <QRCodeSVG value={shareUrl} size={150} />
              </div>
            )}
            <code className="bg-white p-2 rounded block break-all border border-[#E5E7EB] text-sm">
              {shareUrl}
            </code>
          </div>

          {/* Statistics Box (Only for owner) */}
          {isOwner && (
            <div className="bg-gradient-to-r from-[#4ECDC4]/10 to-[#FF6B6B]/10 rounded-lg p-4 border border-[#E5E7EB] mb-6">
              <div className="flex items-center gap-2 mb-3">
                <BarChart className="w-5 h-5 text-[#FF6B6B]" />
                <h3 className="font-medium text-[#2C3E50]">File Statistics</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#95A5A6]">Upload Time</span>
                  <span className="text-sm text-[#2C3E50]">
                    {formatDate(fileQuery.data.uploadTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#95A5A6]">Total Downloads</span>
                  <span className="text-sm font-medium text-[#4ECDC4]">
                    {fileQuery.data.downloadCount}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Download Progress */}
          {isDownloading && (
            <div className="mb-6">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-[#95A5A6] mt-2">
                <span>{Math.round(downloadProgress)}%</span>
                <span>{formatSize(fileQuery.data.fileSize)}</span>
              </div>
            </div>
          )}

          {/* Download Controls */}
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2 bg-gradient-to-r from-[#4ECDC4] to-[#4ECDC4] hover:from-[#4ECDC4]/90 hover:to-[#4ECDC4]/90"
              onClick={() => downloadMutation.mutate()}
              disabled={downloadMutation.isPending || fileQuery.data.downloaded}
            >
              {fileQuery.data.downloaded ? (
                <>
                  <Check className="w-4 h-4" />
                  Downloaded
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download File
                </>
              )}
            </Button>

            {/* Control buttons (Only for owner during download) */}
            {isDownloading && isOwner && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsPaused(!isPaused)}
                  className={isPaused ? "bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]/90" : ""}
                >
                  {isPaused ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white"
                >
                  <StopCircle className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}