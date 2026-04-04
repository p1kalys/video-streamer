import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export default function FileUpload({
  onFileSelect,
  maxSize = 100 * 1024 * 1024
}: FileUploadProps) {
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('');

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please select a video file.');
      } else {
        setError('File rejected. Please try another file.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect, maxSize]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'video/*': [] },
    maxSize,
    multiple: false,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 transform hover:scale-105
          ${isDragActive && !isDragReject ? 'border-stone-500 bg-stone-100' : ''}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
          ${!isDragActive ? 'border-stone-300 hover:border-stone-400 hover:bg-stone-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {isDragActive ? (
            <div>
              <p className="text-xl font-semibold text-stone-700 mb-2">
                Drop your video here
              </p>
              <p className="text-sm text-stone-500">
                Release to upload
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-stone-700 mb-2">
                Drag & drop your video here
              </p>
              <p className="text-sm text-stone-500 mb-3">
                or click to browse files
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-stone-400 bg-stone-100 px-3 py-2 rounded-md">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3" />
                </svg>
                <span>Maximum file size: {maxSize / (1024 * 1024)}MB</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 20 20" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
