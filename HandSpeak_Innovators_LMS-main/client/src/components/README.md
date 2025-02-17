# Hand Sign Detector Component

A reusable React component for detecting American Sign Language (ASL) hand gestures using TensorFlow.js and Handpose.

## Installation

1. Install the required dependencies:

```bash
npm install @tensorflow/tfjs @tensorflow-models/handpose fingerpose react-webcam @chakra-ui/react
```

## Usage

1. Import the HandSignDetector component:

```javascript
import HandSignDetector from './components/HandSignDetector';
```

2. Use the component in your application:

```javascript
function YourApp() {
	const [isDetectorOpen, setIsDetectorOpen] = useState(false);

	return (
		<div>
			<button onClick={() => setIsDetectorOpen(true)}>
				Open Hand Sign Detector
			</button>

			<HandSignDetector 
				isOpen={isDetectorOpen} 
				onClose={() => setIsDetectorOpen(false)} 
			/>
		</div>
	);
}
```

## Props

- `isOpen`: Boolean to control the visibility of the detector
- `onClose`: Function to call when closing the detector

## Example

See `ExampleUsage.js` for a complete implementation example.