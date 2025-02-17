import React, { useState } from 'react';
import { Button, Box } from '@chakra-ui/react';
import HandSignDetector from './HandSignDetector';

const ExampleUsage = () => {
	const [isDetectorOpen, setIsDetectorOpen] = useState(false);

	return (
		<Box p={4}>
			<Button 
				colorScheme="blue" 
				onClick={() => setIsDetectorOpen(true)}
			>
				Practice Sign Language
			</Button>

			<HandSignDetector 
				isOpen={isDetectorOpen} 
				onClose={() => setIsDetectorOpen(false)} 
			/>
		</Box>
	);
};

export default ExampleUsage;