import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onDrop: (file: File) => void;
  disabled?: boolean;
}

export function FileDropzone({ onDrop, disabled }: FileDropzoneProps) {
  const handleDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onDrop(acceptedFiles[0]);
    }
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    disabled,
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
        "flex flex-col items-center justify-center text-center",
        isDragActive ? "border-[#4ECDC4] bg-[#4ECDC4]/10" :
        disabled ? "border-[#95A5A6] bg-[#95A5A6]/10 cursor-not-allowed" :
        "border-[#95A5A6] hover:border-[#4ECDC4] hover:bg-[#4ECDC4]/10"
      )}
    >
      <input {...getInputProps()} />
      <Upload 
        className={cn(
          "w-12 h-12 mb-4",
          isDragActive ? "text-[#4ECDC4]" :
          disabled ? "text-[#95A5A6]" :
          "text-[#95A5A6]"
        )} 
      />
      <p className="text-[#2C3E50] font-medium">
        {isDragActive ? "Drop the file here" :
         disabled ? "Uploading..." :
         "Drag & drop a file here, or click to select"}
      </p>
      <p className="text-sm text-[#95A5A6] mt-2">
        {disabled ? "Please wait..." : "Any file type up to 100MB"}
      </p>
    </div>
  );
}
