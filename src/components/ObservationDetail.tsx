import { motion } from 'motion/react';
import type { Observation } from '../types';
import { ObservationDetailHeader } from './observations/detail/ObservationDetailHeader';
import { ObservationDetailImage } from './observations/detail/ObservationDetailImage';
import { ObservationDetailInfo } from './observations/detail/ObservationDetailInfo';
import { ObservationDetailLocation } from './observations/detail/ObservationDetailLocation';

interface ObservationDetailProps {
  observation: Observation;
  onClose: () => void;
}

export const ObservationDetail = ({ observation, onClose }: ObservationDetailProps) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-white overflow-y-auto px-6 pt-32 pb-20">
      <div className="max-w-4xl mx-auto">
        <ObservationDetailHeader observation={observation} onClose={onClose} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ObservationDetailImage observation={observation} />
          <div className="text-left space-y-6">
            <ObservationDetailInfo observation={observation} />
            <ObservationDetailLocation observation={observation} onClose={onClose} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
