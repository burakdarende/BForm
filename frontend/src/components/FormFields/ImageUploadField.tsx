import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import type { FormField } from '../../types';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface ImageUploadFieldProps {
  field: FormField;
  handleImageUpload: (file: File) => Promise<string | null>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ field, handleImageUpload, setValue, watch }) => {
  const [isDragging, setIsDragging] = useState(false);
  const imageUrl = watch(field.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fullImageUrl = imageUrl && !imageUrl.startsWith('http')
    ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${imageUrl}`
    : imageUrl;



  const processFile = async (file: File | undefined) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Dosya boyutu 10MB\'dan küçük olmalıdır.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Lütfen geçerli bir resim dosyası seçin.');
        return;
      }
      const newImageUrl = await handleImageUpload(file);
      if (newImageUrl) {
        setValue(field.id, newImageUrl, { shouldValidate: true, shouldDirty: true });
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const onRemoveImage = () => {
    setValue(field.id, null, { shouldValidate: true, shouldDirty: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onChangeImage = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-upload-container">
      <input
        type="file"
        id={`image-${field.id}`}
        ref={fileInputRef}
        className="hidden"
        accept="image/*,.heic,.heif"
        onChange={async (e) => {
          await processFile(e.target.files?.[0]);
        }}
      />
      
      {imageUrl ? (
        <div className="image-preview-container">
          <img src={fullImageUrl} alt="Yüklenen görsel önizlemesi" className="image-preview" />
          <div className="image-actions">
            <button type="button" onClick={onChangeImage} className="btn-change-image">Değiştir</button>
            <button type="button" onClick={onRemoveImage} className="btn-remove-image">Kaldır</button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={`image-${field.id}`}
          className={`image-upload-label ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="upload-icon">🖼️</div>
          <span className="upload-text">Görsel Seç veya Sürükle</span>
          <span className="upload-hint">PNG, JPG, WEBP (Max 10MB)</span>
        </label>
      )}
    </div>
  );
};

export default ImageUploadField;
