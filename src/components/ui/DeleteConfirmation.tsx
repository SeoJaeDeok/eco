import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationProps {
  label: string;
  message: string;
  onDelete: () => Promise<void>;
  disabled?: boolean;
}

export const DeleteConfirmation = ({ label, message, onDelete, disabled = false }: DeleteConfirmationProps) => {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const remove = async () => {
    if (disabled || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await onDelete();
      if (mounted.current) setConfirming(false);
    } catch {
      if (mounted.current) setError('삭제하지 못했습니다. 권한이나 현재 기록 상태를 확인한 뒤 다시 시도해 주세요.');
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const style = 'inline-flex min-h-11 items-center gap-2 border border-zinc-300 px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50';
  return <div className="my-4 space-y-2" aria-busy={busy}>
    {!confirming ? <button type="button" className={`${style} text-red-700`} disabled={disabled} onClick={() => setConfirming(true)}><Trash2 size={14} aria-hidden="true" />{label}</button> : <>
      <p className="text-sm leading-6 text-zinc-700" role="alert">{message}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${style} text-red-700`} disabled={busy || disabled} onClick={() => void remove()}><Trash2 size={14} aria-hidden="true" />{busy ? '삭제 중' : '삭제 확인'}</button>
        <button type="button" className={style} disabled={busy} onClick={() => { setConfirming(false); setError(null); }}>취소</button>
      </div>
    </>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
};
