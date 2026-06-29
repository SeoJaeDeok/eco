import { Button } from '../ui/Button';

interface UploadFormActionsProps {
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
}

export const UploadFormActions = ({
  onCancel,
  onSubmit,
  isSubmitting = false,
  isSubmitDisabled = false,
}: UploadFormActionsProps) => {
  return (
    <div className="flex gap-3">
      <Button onClick={onCancel} className="flex-1 border border-zinc-100 text-zinc-300 py-3 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-50">취소</Button>
      <Button onClick={onSubmit} disabled={isSubmitting || isSubmitDisabled} className="flex-[2] py-3 text-[10px] tracking-[0.2em] uppercase text-white font-medium bg-black hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40">저장 UI 확인</Button>
    </div>
  );
};
