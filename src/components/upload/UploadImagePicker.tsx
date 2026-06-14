import type { ChangeEvent } from 'react';

interface UploadImagePickerProps {
  imagePreviewUrl: string | null;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const UploadImagePicker = ({ imagePreviewUrl, onImageChange }: UploadImagePickerProps) => {
  return (
    <label className="border border-dashed border-zinc-100 bg-zinc-50 h-56 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-300 transition-colors relative">
      <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
      {imagePreviewUrl ? <img src={imagePreviewUrl} className="absolute inset-0 w-full h-full object-contain p-2" alt="선택한 관찰 사진 미리보기" /> : <p className="text-[10px] tracking-widest uppercase opacity-40 text-center px-4">클릭하여 사진 선택<br /><span className="lowercase font-light mt-1 block opacity-60">디자인 미리보기 전용</span></p>}
    </label>
  );
};
