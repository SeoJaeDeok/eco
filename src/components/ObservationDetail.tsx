import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { Observation, OwnerObservationUpdateInput } from '../types';
import { ObservationDetailEditForm } from './observations/detail/ObservationDetailEditForm';
import { ObservationDetailHeader } from './observations/detail/ObservationDetailHeader';
import { ObservationDetailImage } from './observations/detail/ObservationDetailImage';
import { ObservationDetailInfo } from './observations/detail/ObservationDetailInfo';
import { ObservationDetailLocation } from './observations/detail/ObservationDetailLocation';

interface ObservationDetailProps {
  observation: Observation;
  canEdit?: boolean;
  onClose: () => void;
  onUpdateObservation?: (id: string, input: OwnerObservationUpdateInput) => Promise<Observation>;
  onImageLoadError?: (observation: Observation) => void;
}

export const ObservationDetail = ({
  observation,
  canEdit = false,
  onClose,
  onUpdateObservation,
  onImageLoadError,
}: ObservationDetailProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setIsEditing(false);
    setEditError(null);
    setIsSubmittingEdit(false);
  }, [observation.id]);

  useEffect(() => {
    if (!canEdit) {
      setIsEditing(false);
    }
  }, [canEdit]);

  const handleEditSubmit = async (input: OwnerObservationUpdateInput) => {
    if (!onUpdateObservation || isSubmittingEdit) return;

    try {
      setIsSubmittingEdit(true);
      setEditError(null);
      await onUpdateObservation(observation.id, input);
      setIsEditing(false);
    } catch {
      setEditError('수정 내용을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-white overflow-y-auto px-6 pt-32 pb-20">
      <div className="max-w-4xl mx-auto">
        <ObservationDetailHeader
          observation={observation}
          canEdit={canEdit}
          isEditing={isEditing}
          onClose={onClose}
          onStartEdit={() => setIsEditing(true)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ObservationDetailImage observation={observation} onImageLoadError={onImageLoadError} />
          <div className="text-left space-y-6">
            {isEditing ? (
              <ObservationDetailEditForm
                observation={observation}
                errorMessage={editError}
                isSubmitting={isSubmittingEdit}
                onCancel={() => {
                  setIsEditing(false);
                  setEditError(null);
                }}
                onSubmit={handleEditSubmit}
              />
            ) : (
              <>
                <ObservationDetailInfo observation={observation} />
                <ObservationDetailLocation observation={observation} onClose={onClose} />
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
