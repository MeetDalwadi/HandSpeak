import { FC } from 'react';

interface HandSignDetectorProps {
	isOpen: boolean;
	onClose: () => void;
}

declare const HandSignDetector: FC<HandSignDetectorProps>;

export default HandSignDetector;