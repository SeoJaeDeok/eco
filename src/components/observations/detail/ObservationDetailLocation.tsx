import type { Observation } from '../../../types';
import { StaticDesignMap } from '../../DesignMap';
import { Button } from '../../ui/Button';

interface ObservationDetailLocationProps {
  observation: Observation;
  onClose: () => void;
}

export const ObservationDetailLocation = ({ observation, onClose }: ObservationDetailLocationProps) => {
  return (
    <>
      <div>
        <h4 className="text-[10px] tracking-widest uppercase opacity-30 mb-2 border-b border-zinc-100 pb-1">관찰 위치</h4>
        <div className="w-full h-48 border border-zinc-100 mb-2 overflow-hidden">
          <StaticDesignMap lat={observation.coords.lat} lng={observation.coords.lng} taxon={observation.taxon} />
        </div>
        <p className="text-[9px] font-mono opacity-40">{observation.coords.lat.toFixed(6)}, {observation.coords.lng.toFixed(6)}</p>
      </div>
      <Button onClick={onClose} className="w-full md:w-auto px-10 py-3 border border-zinc-200 text-[10px] tracking-widest uppercase font-medium hover:border-black transition-all">목록으로 돌아가기</Button>
    </>
  );
};
