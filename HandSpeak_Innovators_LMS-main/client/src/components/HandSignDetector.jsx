import React, { useRef, useState, useEffect } from "react"
import * as tf from "@tensorflow/tfjs"
import * as handpose from "@tensorflow-models/handpose"
import Webcam from "react-webcam"
import { drawHand } from "./handposeutil"
import * as fp from "fingerpose"
import Handsigns from "./handsigns"
import { Signimage, Signpass } from "./handimage"
import {
	Text,
	Button,
	Image,
	Stack,
	Box,
	VStack,
} from "@chakra-ui/react"
import { RiCameraFill, RiCameraOffFill } from "react-icons/ri"

const HandSignDetector = ({ isOpen, onClose }) => {
	const webcamRef = useRef(null)
	const canvasRef = useRef(null)
	const [camState, setCamState] = useState("off")
	const [sign, setSign] = useState(null)
	const [gamestate, setGamestate] = useState("idle")
	
	let signList = []
	let currentSign = 0

	useEffect(() => {
		if (isOpen && camState === "off") {
			setCamState("on")
			runHandpose()
		}
	}, [isOpen])

	const runHandpose = async () => {
		const net = await handpose.load()
		_signList()
		setInterval(() => {
			detect(net)
		}, 150)
	}

	const _signList = () => {
		signList = generateSigns()
	}

	const generateSigns = () => {
		return shuffle(Signpass)
	}

	const shuffle = (a) => {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[a[i], a[j]] = [a[j], a[i]]
		}
		return a
	}

	const detect = async (net) => {
		if (
			typeof webcamRef.current !== "undefined" &&
			webcamRef.current !== null &&
			webcamRef.current.video.readyState === 4
		) {
			const video = webcamRef.current.video
			const videoWidth = webcamRef.current.video.videoWidth
			const videoHeight = webcamRef.current.video.videoHeight

			webcamRef.current.video.width = videoWidth
			webcamRef.current.video.height = videoHeight

			canvasRef.current.width = videoWidth
			canvasRef.current.height = videoHeight

			const hand = await net.estimateHands(video)

			if (hand.length > 0) {
				const GE = new fp.GestureEstimator([
					fp.Gestures.ThumbsUpGesture,
					Handsigns.aSign,
					Handsigns.bSign,
				])

				const estimatedGestures = await GE.estimate(hand[0].landmarks, 6.5)

				if (estimatedGestures.gestures && estimatedGestures.gestures.length > 0) {
					const confidence = estimatedGestures.gestures.map(p => p.confidence)
					const maxConfidence = confidence.indexOf(Math.max.apply(null, confidence))
					if (maxConfidence !== -1 && estimatedGestures.gestures[maxConfidence]) {
						setSign(estimatedGestures.gestures[maxConfidence].name)
					}
				}
			}
			const ctx = canvasRef.current.getContext("2d")
			drawHand(hand, ctx)
		}
	}

	if (!isOpen) return null

	return (
		<Box position="fixed" top="0" left="0" w="100%" h="100%" bg="rgba(0,0,0,0.8)" zIndex={1000}>
			<Box maxW="xl" mx="auto" p={4}>
				<VStack spacing={4}>
					<Box id="webcam-container" position="relative">
						{camState === "on" && <Webcam id="webcam" ref={webcamRef} />}
						<canvas
							id="gesture-canvas"
							ref={canvasRef}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
							}}
						/>
					</Box>
					
					{sign && (
						<Box textAlign="center">
							<Text color="white" fontSize="sm" mb={1}>
								Detected gesture: {sign}
							</Text>
							<Image
								h="50px"
								src={Signimage[sign]?.src || "/loveyou_emoji.svg"}
								alt={sign}
							/>
						</Box>
					)}
					
					<Stack direction="row" spacing={4}>
						<Button
							leftIcon={camState === "on" ? <RiCameraFill /> : <RiCameraOffFill />}
							onClick={() => setCamState(camState === "on" ? "off" : "on")}
							colorScheme="orange"
						>
							Camera
						</Button>
						<Button onClick={onClose} colorScheme="red">
							Close
						</Button>
					</Stack>
				</VStack>
			</Box>
		</Box>
	)
}

export default HandSignDetector