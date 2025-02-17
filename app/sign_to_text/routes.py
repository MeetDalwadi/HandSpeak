# Importing Libraries
import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow logging

from flask import render_template, Response, request, redirect, url_for, flash, jsonify, current_app
from app.sign_to_text import sign_to_text_bp
import numpy as np
import cv2
import sys
import pyttsx3
import tensorflow as tf
from cvzone.HandTrackingModule import HandDetector
from string import ascii_uppercase
import enchant
import threading
import base64
import logging
import time
import math

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Main route for sign_to_text
@sign_to_text_bp.route('/')
def index():
    """Main route for App 1"""
    return render_template('sign_to_text/index.html', title='Sign Language To Text')

class SignLanguageDetector:
    def __init__(self):
        try:
            # Initialize camera
            self.vs = cv2.VideoCapture(0)
            if not self.vs.isOpened():
                raise Exception("Could not open video capture device")
            
            # Set camera properties for better performance
            self.vs.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.vs.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.vs.set(cv2.CAP_PROP_FPS, 30)
                
            self.current_image = None
            logger.info("Loading model...")
            
        # Load model with error handling
            model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models', 'cnn8grps_rad1_model.h5')
            logger.info(f"Looking for model at: {model_path}")
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found: {model_path}")
            try:
                self.model = tf.keras.models.load_model(model_path)
                logger.info("Model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load model: {str(e)}")
                raise
            
            # Initialize text-to-speech
            try:
                self.speak_engine = None  # Will be initialized per request
                self.speak_lock = threading.Lock()
            except Exception as e:
                logger.error(f"Failed to initialize text-to-speech: {str(e)}")
                raise
            
            # Initialize hand detectors with optimized parameters
            try:
                self.hd = HandDetector(maxHands=1, detectionCon=0.7)
                self.hd2 = HandDetector(maxHands=1, detectionCon=0.7)
            except Exception as e:
                logger.error(f"Failed to initialize hand detectors: {str(e)}")
                raise
            
            # Initialize dictionary
            try:
                self.ddd = enchant.Dict("en-US")
            except Exception as e:
                logger.error(f"Failed to initialize dictionary: {str(e)}")
                raise
            
            # Initialize other variables
            self.ct = {}
            self.ct['blank'] = 0
            self.blank_flag = 0
            self.space_flag = False
            self.next_flag = True
            self.prev_char = ""
            self.count = -1
            self.ten_prev_char = [" " for _ in range(10)]
            self.last_frame_time = time.time()
            self.frame_interval = 1.0 / 30
            self.current_word = ""
            self.hand_detected = False
            
            for i in ascii_uppercase:
                self.ct[i] = 0
                
            self.str = " "
            self.word = " "
            self.current_symbol = "Empty"
            self.word1 = " "
            self.word2 = " "
            self.word3 = " "
            self.word4 = " "
            
            self.offset = 20
            logger.info("Detector initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing detector: {str(e)}")
            raise

    def _get_error_response(self, error_message):
        """Helper method to generate error response"""
        return {
            'error': error_message,
            'main_frame': None,
            'current_symbol': '-',
            'sentence': self.str,
            'suggestions': [self.word1, self.word2, self.word3, self.word4]
        }
    
    def release_camera(self):
        """Release the camera resource if it's open."""
        if hasattr(self, 'vs') and self.vs is not None and self.vs.isOpened():
            self.vs.release()
            self.vs = None
            logger.info("Camera released")

    def get_frame(self):
        """Get a frame from the camera and process it for prediction."""   
        try:
            # If camera is not initialized or was released, return None
            if not hasattr(self, 'vs') or self.vs is None:
                return None

            if not self.vs.isOpened():
                self.vs = cv2.VideoCapture(0)
                if not self.vs.isOpened():
                    logger.error("Could not reopen video capture device")
                    return None
                    
            ret, frame = self.vs.read()
            if not ret:
                logger.error("Failed to capture frame")
                return None     
                
            current_time = time.time()
            # Adaptive frame rate control based on processing time
            frame_time = current_time - self.last_frame_time
            if frame_time < 0.025:  # Maximum 40 FPS
                return self._get_error_response("Frame skipped") 
            self.last_frame_time = current_time

            cv2image = cv2.flip(frame, 1)
            
            # Maintain aspect ratio while resizing
            height, width = cv2image.shape[:2]
            target_width = 640
            target_height = int(target_width * height / width)
            cv2image = cv2.resize(cv2image, (target_width, target_height))
            
            # Use a copy for processing to avoid modifying the display frame
            cv2image_copy = np.array(cv2image)
            
            # Find hands with increased detection confidence
            hands = self.hd.findHands(cv2image_copy, draw=False, flipType=True)
            
            # Reset hand detection flag
            was_hand_detected = self.hand_detected
            self.hand_detected = False
            
            # Process hand if detected
            if hands and hands[0]:
                try:
                    self.hand_detected = True
                    hand = hands[0]
                    x, y, w, h = map(int, hand[0]['bbox'])
                    
                    # Dynamic padding based on hand size
                    pad = max(20, int(min(w, h) * 0.2))
                    
                    # Ensure valid image crop coordinates with padding
                    y1 = max(0, y - self.offset - pad)
                    y2 = min(cv2image.shape[0], y + h + self.offset + pad)
                    x1 = max(0, x - self.offset - pad)
                    x2 = min(cv2image.shape[1], x + w + self.offset + pad)
                    
                    if x2 > x1 and y2 > y1 and (x2 - x1) > 20 and (y2 - y1) > 20:
                        image = cv2image_copy[y1:y2, x1:x2]
                        
                        # Maintain aspect ratio while resizing
                        img_h, img_w = image.shape[:2]
                        scale = 200.0 / max(img_h, img_w)
                        new_h, new_w = int(img_h * scale), int(img_w * scale)
                        image = cv2.resize(image, (new_w, new_h))
                        
                        # Create a white canvas
                        white = np.ones((400, 400, 3), dtype=np.uint8) * 255
                        
                        # Center the image on the white canvas
                        start_y = (400 - new_h) // 2
                        start_x = (400 - new_w) // 2
                        white[start_y:start_y+new_h, start_x:start_x+new_w] = image
                        
                        # Find hands in the processed image with higher confidence
                        handz = self.hd2.findHands(white, draw=False, flipType=True)
                        
                        if handz and handz[0]:
                            hand = handz[0]
                            self.pts = hand[0]['lmList']
                            self.draw_hand_keypoints(white)
                            self.predict(white)
                            
                            # Update word and generate suggestions only when needed
                            if not was_hand_detected or self.current_symbol != "Empty":
                                words = self.str.strip().split()
                                self.current_word = words[-1] if words else ""
                                self.generate_suggestions()
                except Exception as e:
                    logger.error(f"Error processing hand: {str(e)}")
                    self.hand_detected = False
            elif was_hand_detected:
                # Add space only if we have a valid character
                if self.current_symbol != "Empty" and not self.str.endswith(" "):
                    self.str += " "
                    self.current_symbol = "Empty"
                    # Reset all character counters
                    for key in self.ct:
                        self.ct[key] = 0
            
            # Update frame time after processing
            self.last_frame_time = time.time()
            
            # Convert the main frame to base64
            try:
                _, buffer = cv2.imencode('.jpg', cv2image, [cv2.IMWRITE_JPEG_QUALITY, 85])
                main_frame = base64.b64encode(buffer).decode('utf-8')
            except Exception as e:
                logger.error(f"Error encoding main frame: {str(e)}")
                return self._get_error_response("Failed to encode video frame")

            # Return the response with all required fields
            return {
                'error': None,
                'main_frame': main_frame,
                'current_symbol': self.current_symbol,
                'sentence': self.str,
                'suggestions': [self.word1, self.word2, self.word3, self.word4]
            }

        except Exception as e:
            logger.error(f"Error in get_frame: {str(e)}")
            return self._get_error_response(f"Internal error: {str(e)}")

    def predict(self, test_image):
        try:
            white = test_image
            white = white.reshape(1, 400, 400, 3)
            prob = np.array(self.model.predict(white, verbose=0)[0], dtype='float32')
            
            # Get top 3 predictions with confidence scores
            ch1 = np.argmax(prob, axis=0)
            conf1 = prob[ch1]
            prob[ch1] = 0
            
            ch2 = np.argmax(prob, axis=0)
            conf2 = prob[ch2]
            prob[ch2] = 0
            
            ch3 = np.argmax(prob, axis=0)
            conf3 = prob[ch3]
            
            # Store original ch1 for reference
            original_ch1 = ch1
            pl = [ch1, ch2]

            # Apply gesture conditions to refine prediction
            self._apply_gesture_conditions(pl, ch1, ch2)
            
            # Reset counter for original prediction if changed
            if ch1 != original_ch1:
                self.ct[ascii_uppercase[original_ch1]] = 0
            
            # Only process if we have a valid prediction with good confidence
            if 0 <= ch1 < 26 and conf1 > 0.5:  # Minimum 50% confidence
                char = ascii_uppercase[ch1]
                
                # Increment counter with confidence boost
                conf_boost = int(conf1 * 5)  # Convert confidence to counter boost
                self.ct[char] += max(1, conf_boost)
                
                # Require more consistent detections for character change
                threshold = 15 if self.current_symbol != char else 8
                
                if self.ct[char] > threshold:
                    # Reset other counters
                    for key in self.ct:
                        if key != char:
                            self.ct[key] = max(0, self.ct[key] - 2)  # Gradual decay
                    
                    # Update current symbol if it's different
                    if self.current_symbol != char:
                        # Only append if it's not repeating the last character
                        if not self.str.strip().endswith(char):
                            self.current_symbol = char
                            self.str = self.str.rstrip() + char
            else:
                # Gradually decay all counters when no confident prediction
                for key in self.ct:
                    self.ct[key] = max(0, self.ct[key] - 1)
            
        except Exception as e:
            logger.error(f"Error in predict: {str(e)}")
            return

    def _apply_gesture_conditions(self, pl, ch1, ch2):
        """Apply various gesture conditions to refine the prediction"""
        try:
            # condition for [Aemnst]
            l = [[5, 2], [5, 3], [3, 5], [3, 6], [3, 0], [3, 2], [6, 4], [6, 1], [6, 2], [6, 6], [6, 7], [6, 0], [6, 5],
                 [4, 1], [1, 0], [1, 1], [6, 3], [1, 6], [5, 6], [5, 1], [4, 5], [1, 4], [1, 5], [2, 0], [2, 6], [4, 6],
                 [1, 0], [5, 7], [1, 6], [6, 1], [7, 6], [2, 5], [7, 1], [5, 4], [7, 0], [7, 5], [7, 2]]
            if pl in l and all(self.pts[i][1] < self.pts[i+2][1] for i in [6, 10, 14, 18]):
                ch1 = 0

            # condition for [o][s]
            if pl in [[2, 2], [2, 1]] and self.pts[5][0] < self.pts[4][0]:
                ch1 = 0

            # condition for [c0][aemnst]
            l = [[0, 0], [0, 6], [0, 2], [0, 5], [0, 1], [0, 7], [5, 2], [7, 6], [7, 1]]
            if pl in l and all(self.pts[0][0] > self.pts[i][0] for i in [8, 12, 16, 20]) and self.pts[5][0] > self.pts[4][0]:
                ch1 = 2

            # Additional conditions...
            # (Keep other gesture conditions as needed)
            
            return ch1
        except Exception as e:
            logger.error(f"Error in _apply_gesture_conditions: {str(e)}")
            return ch1

    def draw_hand_keypoints(self, white):
        # Draw connections between keypoints
        connections = [
            (0, 1, 2, 3, 4),
            (5, 6, 7, 8),
            (9, 10, 11, 12),
            (13, 14, 15, 16),
            (17, 18, 19, 20)
        ]
        
        for connection in connections:
            for t in range(len(connection) - 1):
                pt1 = self.pts[connection[t]]
                pt2 = self.pts[connection[t + 1]]
                cv2.line(white, 
                        (pt1[0], pt1[1]),
                        (pt2[0], pt2[1]),
                        (0, 255, 0), 3)
        
        # Draw palm connections
        palm_connections = [
            (5, 9), (9, 13), (13, 17),
            (0, 5), (0, 17)
        ]
        
        for start, end in palm_connections:
            pt1 = self.pts[start]
            pt2 = self.pts[end]
            cv2.line(white,
                    (pt1[0], pt1[1]),
                    (pt2[0], pt2[1]),
                    (0, 255, 0), 3)
        
        # Draw keypoints
        for i in range(21):
            cv2.circle(white,
                      (self.pts[i][0], self.pts[i][1]),
                      2, (0, 0, 255), 1)

    def distance(self, x, y):
        return math.sqrt(((x[0] - y[0]) ** 2) + ((x[1] - y[1]) ** 2))

    def predict(self, test_image):
        white = test_image
        white = white.reshape(1, 400, 400, 3)
        prob = np.array(self.model.predict(white)[0], dtype='float32')
        ch1 = np.argmax(prob, axis=0)
        prob[ch1] = 0
        ch2 = np.argmax(prob, axis=0)
        prob[ch2] = 0
        ch3 = np.argmax(prob, axis=0)
        prob[ch3] = 0

        pl = [ch1, ch2]

        # condition for [Aemnst]
        l = [[5, 2], [5, 3], [3, 5], [3, 6], [3, 0], [3, 2], [6, 4], [6, 1], [6, 2], [6, 6], [6, 7], [6, 0], [6, 5],
             [4, 1], [1, 0], [1, 1], [6, 3], [1, 6], [5, 6], [5, 1], [4, 5], [1, 4], [1, 5], [2, 0], [2, 6], [4, 6],
             [1, 0], [5, 7], [1, 6], [6, 1], [7, 6], [2, 5], [7, 1], [5, 4], [7, 0], [7, 5], [7, 2]]
        if pl in l:
            if (self.pts[6][1] < self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] < self.pts[20][
                1]):
                ch1 = 0

        # condition for [o][s]
        l = [[2, 2], [2, 1]]
        if pl in l:
            if (self.pts[5][0] < self.pts[4][0]):
                ch1 = 0
                print("++++++++++++++++++")
                # print("00000")

        # condition for [c0][aemnst]
        l = [[0, 0], [0, 6], [0, 2], [0, 5], [0, 1], [0, 7], [5, 2], [7, 6], [7, 1]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[0][0] > self.pts[8][0] and self.pts[0][0] > self.pts[12][0] and self.pts[0][0] > self.pts[16][0] and self.pts[0][0] > self.pts[20][0]) and self.pts[5][0] > self.pts[4][0]:
                ch1 = 2

        # condition for [c0][aemnst]
        l = [[6, 0], [6, 6], [6, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if self.distance(self.pts[8], self.pts[16]) < 52:
                ch1 = 2


        # condition for [gh][bdfikruvw]
        l = [[1, 4], [1, 5], [1, 6], [1, 3], [1, 0]]
        pl = [ch1, ch2]

        if pl in l:
            if self.pts[6][1] > self.pts[8][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] < self.pts[20][1] and self.pts[0][0] < self.pts[8][
                0] and self.pts[0][0] < self.pts[12][0] and self.pts[0][0] < self.pts[16][0] and self.pts[0][0] < self.pts[20][0]:
                ch1 = 3



        # con for [gh][l]
        l = [[4, 6], [4, 1], [4, 5], [4, 3], [4, 7]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[4][0] > self.pts[0][0]:
                ch1 = 3

        # con for [gh][pqz]
        l = [[5, 3], [5, 0], [5, 7], [5, 4], [5, 2], [5, 1], [5, 5]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[2][1] + 15 < self.pts[16][1]:
                ch1 = 3

        # con for [l][x]
        l = [[6, 4], [6, 1], [6, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if self.distance(self.pts[4], self.pts[11]) > 55:
                ch1 = 4

        # con for [l][d]
        l = [[1, 4], [1, 6], [1, 1]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.distance(self.pts[4], self.pts[11]) > 50) and (
                    self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] <
                    self.pts[20][1]):
                ch1 = 4

        # con for [l][gh]
        l = [[3, 6], [3, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[4][0] < self.pts[0][0]):
                ch1 = 4

        # con for [l][c0]
        l = [[2, 2], [2, 5], [2, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[1][0] < self.pts[12][0]):
                ch1 = 4

        # con for [l][c0]
        l = [[2, 2], [2, 5], [2, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[1][0] < self.pts[12][0]):
                ch1 = 4

        # con for [gh][z]
        l = [[3, 6], [3, 5], [3, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] < self.pts[20][
                1]) and self.pts[4][1] > self.pts[10][1]:
                ch1 = 5

        # con for [gh][pq]
        l = [[3, 2], [3, 1], [3, 6]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[4][1] + 17 > self.pts[8][1] and self.pts[4][1] + 17 > self.pts[12][1] and self.pts[4][1] + 17 > self.pts[16][1] and self.pts[4][
                1] + 17 > self.pts[20][1]:
                ch1 = 5

        # con for [l][pqz]
        l = [[4, 4], [4, 5], [4, 2], [7, 5], [7, 6], [7, 0]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[4][0] > self.pts[0][0]:
                ch1 = 5

        # con for [pqz][aemnst]
        l = [[0, 2], [0, 6], [0, 1], [0, 5], [0, 0], [0, 7], [0, 4], [0, 3], [2, 7]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[0][0] < self.pts[8][0] and self.pts[0][0] < self.pts[12][0] and self.pts[0][0] < self.pts[16][0] and self.pts[0][0] < self.pts[20][0]:
                ch1 = 5

        # con for [pqz][yj]
        l = [[5, 7], [5, 2], [5, 6]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[3][0] < self.pts[0][0]:
                ch1 = 7

        # con for [l][yj]
        l = [[4, 6], [4, 2], [4, 4], [4, 1], [4, 5], [4, 7]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[6][1] < self.pts[8][1]:
                ch1 = 7

        # con for [x][yj]
        l = [[6, 7], [0, 7], [0, 1], [0, 0], [6, 4], [6, 6], [6, 5], [6, 1]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[18][1] > self.pts[20][1]:
                ch1 = 7

        # condition for [x][aemnst]
        l = [[0, 4], [0, 2], [0, 3], [0, 1], [0, 6]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[5][0] > self.pts[16][0]:
                ch1 = 6


        # condition for [yj][x]
        print("2222  ch1=+++++++++++++++++", ch1, ",", ch2)
        l = [[7, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[18][1] < self.pts[20][1] and self.pts[8][1] < self.pts[10][1]:
                ch1 = 6

        # condition for [c0][x]
        l = [[2, 1], [2, 2], [2, 6], [2, 7], [2, 0]]
        pl = [ch1, ch2]
        if pl in l:
            if self.distance(self.pts[8], self.pts[16]) > 50:
                ch1 = 6

        # con for [l][x]

        l = [[4, 6], [4, 2], [4, 1], [4, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if self.distance(self.pts[4], self.pts[11]) < 60:
                ch1 = 6

        # con for [x][d]
        l = [[1, 4], [1, 6], [1, 0], [1, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[5][0] - self.pts[4][0] - 15 > 0:
                ch1 = 6

        # con for [b][pqz]
        l = [[5, 0], [5, 1], [5, 4], [5, 5], [5, 6], [6, 1], [7, 6], [0, 2], [7, 1], [7, 4], [6, 6], [7, 2], [5, 0],
             [6, 3], [6, 4], [7, 5], [7, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and self.pts[18][1] > self.pts[20][
                1]):
                ch1 = 1

        # con for [f][pqz]
        l = [[6, 1], [6, 0], [0, 3], [6, 4], [2, 2], [0, 6], [6, 2], [7, 6], [4, 6], [4, 1], [4, 2], [0, 2], [7, 1],
             [7, 4], [6, 6], [7, 2], [7, 5], [7, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[6][1] < self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and
                    self.pts[18][1] > self.pts[20][1]):
                ch1 = 1

        l = [[6, 1], [6, 0], [4, 2], [4, 1], [4, 6], [4, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and
                    self.pts[18][1] > self.pts[20][1]):
                ch1 = 1

        # con for [d][pqz]
        fg = 19
        # print("_________________ch1=",ch1," ch2=",ch2)
        l = [[5, 0], [3, 4], [3, 0], [3, 1], [3, 5], [5, 5], [5, 4], [5, 1], [7, 6]]
        pl = [ch1, ch2]
        if pl in l:
            if ((self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and
                 self.pts[18][1] < self.pts[20][1]) and (self.pts[2][0] < self.pts[0][0]) and self.pts[4][1] > self.pts[14][1]):
                ch1 = 1

        l = [[4, 1], [4, 2], [4, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.distance(self.pts[4], self.pts[11]) < 50) and (
                    self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] <
                    self.pts[20][1]):
                ch1 = 1

        l = [[3, 4], [3, 0], [3, 1], [3, 5], [3, 6]]
        pl = [ch1, ch2]
        if pl in l:
            if ((self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and
                 self.pts[18][1] < self.pts[20][1]) and (self.pts[2][0] < self.pts[0][0]) and self.pts[14][1] < self.pts[4][1]):
                ch1 = 1

        l = [[6, 6], [6, 4], [6, 1], [6, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[5][0] - self.pts[4][0] - 15 < 0:
                ch1 = 1

        # con for [i][pqz]
        l = [[5, 4], [5, 5], [5, 1], [0, 3], [0, 7], [5, 0], [0, 2], [6, 2], [7, 5], [7, 1], [7, 6], [7, 7]]
        pl = [ch1, ch2]
        if pl in l:
            if ((self.pts[6][1] < self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and
                 self.pts[18][1] > self.pts[20][1])):
                ch1 = 1

        # con for [yj][bfdi]
        l = [[1, 5], [1, 7], [1, 1], [1, 6], [1, 3], [1, 0]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[4][0] < self.pts[5][0] + 15) and (
            (self.pts[6][1] < self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and
             self.pts[18][1] > self.pts[20][1])):
                ch1 = 7

        # con for [uvr]
        l = [[5, 5], [5, 0], [5, 4], [5, 1], [4, 6], [4, 1], [7, 6], [3, 0], [3, 5]]
        pl = [ch1, ch2]
        if pl in l:
            if ((self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and
                 self.pts[18][1] < self.pts[20][1])) and self.pts[4][1] > self.pts[14][1]:
                ch1 = 1

        # con for [w]
        fg = 13
        l = [[3, 5], [3, 0], [3, 6], [5, 1], [4, 1], [2, 0], [5, 0], [5, 5]]
        pl = [ch1, ch2]
        if pl in l:
            if not (self.pts[0][0] + fg < self.pts[8][0] and self.pts[0][0] + fg < self.pts[12][0] and self.pts[0][0] + fg < self.pts[16][0] and
                    self.pts[0][0] + fg < self.pts[20][0]) and not (
                    self.pts[0][0] > self.pts[8][0] and self.pts[0][0] > self.pts[12][0] and self.pts[0][0] > self.pts[16][0] and self.pts[0][0] > self.pts[20][
                0]) and self.distance(self.pts[4], self.pts[11]) < 50:
                ch1 = 1

        # con for [w]

        l = [[5, 0], [5, 5], [0, 1]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1]:
                ch1 = 1

        # -------------------------condn for 8 groups  ends

        # -------------------------condn for subgroups  starts
        #
        if ch1 == 0:
            ch1 = 'S'
            if self.pts[4][0] < self.pts[6][0] and self.pts[4][0] < self.pts[10][0] and self.pts[4][0] < self.pts[14][0] and self.pts[4][0] < self.pts[18][0]:
                ch1 = 'A'
            if self.pts[4][0] > self.pts[6][0] and self.pts[4][0] < self.pts[10][0] and self.pts[4][0] < self.pts[14][0] and self.pts[4][0] < self.pts[18][
                0] and self.pts[4][1] < self.pts[14][1] and self.pts[4][1] < self.pts[18][1]:
                ch1 = 'T'
            if self.pts[4][1] > self.pts[8][1] and self.pts[4][1] > self.pts[12][1] and self.pts[4][1] > self.pts[16][1] and self.pts[4][1] > self.pts[20][1]:
                ch1 = 'E'
            if self.pts[4][0] > self.pts[6][0] and self.pts[4][0] > self.pts[10][0] and self.pts[4][0] > self.pts[14][0] and self.pts[4][1] < self.pts[18][1]:
                ch1 = 'M'
            if self.pts[4][0] > self.pts[6][0] and self.pts[4][0] > self.pts[10][0] and self.pts[4][1] < self.pts[18][1] and self.pts[4][1] < self.pts[14][1]:
                ch1 = 'N'

        if ch1 == 2:
            if self.distance(self.pts[12], self.pts[4]) > 42:
                ch1 = 'C'
            else:
                ch1 = 'O'

        if ch1 == 3:
            if (self.distance(self.pts[8], self.pts[12])) > 72:
                ch1 = 'G'
            else:
                ch1 = 'H'

        if ch1 == 7:
            if self.distance(self.pts[8], self.pts[4]) > 42:
                ch1 = 'Y'
            else:
                ch1 = 'J'

        if ch1 == 4:
            ch1 = 'L'

        if ch1 == 6:
            ch1 = 'X'

        if ch1 == 5:
            if self.pts[4][0] > self.pts[12][0] and self.pts[4][0] > self.pts[16][0] and self.pts[4][0] > self.pts[20][0]:
                if self.pts[8][1] < self.pts[5][1]:
                    ch1 = 'Z'
                else:
                    ch1 = 'Q'
            else:
                ch1 = 'P'

        if ch1 == 1:
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and self.pts[18][1] > self.pts[20][
                1]):
                ch1 = 'B'
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] < self.pts[20][
                1]):
                ch1 = 'D'
            if (self.pts[6][1] < self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and self.pts[18][1] > self.pts[20][
                1]):
                ch1 = 'F'
            if (self.pts[6][1] < self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] > self.pts[20][
                1]):
                ch1 = 'I'
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and self.pts[18][1] < self.pts[20][
                1]):
                ch1 = 'W'
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] < self.pts[20][
                1]) and self.pts[4][1] < self.pts[9][1]:
                ch1 = 'K'
            if ((self.distance(self.pts[8], self.pts[12]) - self.distance(self.pts[6], self.pts[10])) < 8) and (
                    self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] <
                    self.pts[20][1]):
                ch1 = 'U'
            if ((self.distance(self.pts[8], self.pts[12]) - self.distance(self.pts[6], self.pts[10])) >= 8) and (
                    self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] <
                    self.pts[20][1]) and (self.pts[4][1] > self.pts[9][1]):
                ch1 = 'V'

            if (self.pts[8][0] > self.pts[12][0]) and (
                    self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] <
                    self.pts[20][1]):
                ch1 = 'R'

        if ch1 == 1 or ch1 =='E' or ch1 =='S' or ch1 =='X' or ch1 =='Y' or ch1 =='B':
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] > self.pts[20][1]):
                ch1=" "



        print(self.pts[4][0] < self.pts[5][0])
        if ch1 == 'E' or ch1=='Y' or ch1=='B':
            if (self.pts[4][0] < self.pts[5][0]) and (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and self.pts[18][1] > self.pts[20][1]):
                ch1="next"


        if ch1 == 'Next' or 'B' or 'C' or 'H' or 'F' or 'X':
            if (self.pts[0][0] > self.pts[8][0] and self.pts[0][0] > self.pts[12][0] and self.pts[0][0] > self.pts[16][0] and self.pts[0][0] > self.pts[20][0]) and (self.pts[4][1] < self.pts[8][1] and self.pts[4][1] < self.pts[12][1] and self.pts[4][1] < self.pts[16][1] and self.pts[4][1] < self.pts[20][1]) and (self.pts[4][1] < self.pts[6][1] and self.pts[4][1] < self.pts[10][1] and self.pts[4][1] < self.pts[14][1] and self.pts[4][1] < self.pts[18][1]):
                ch1 = 'Backspace'


        if ch1=="next" and self.prev_char!="next":
            if self.ten_prev_char[(self.count-2)%10]!="next":
                if self.ten_prev_char[(self.count-2)%10]=="Backspace":
                    self.str=self.str[0:-1]
                else:
                    if self.ten_prev_char[(self.count - 2) % 10] != "Backspace":
                        self.str = self.str + self.ten_prev_char[(self.count-2)%10]
            else:
                if self.ten_prev_char[(self.count - 0) % 10] != "Backspace":
                    self.str = self.str + self.ten_prev_char[(self.count - 0) % 10]


        if ch1=="  " and self.prev_char!="  ":
            self.str = self.str + "  "

        self.prev_char=ch1
        self.current_symbol=ch1
        self.count += 1
        self.ten_prev_char[self.count%10]=ch1


        if len(self.str.strip())!=0:
            st=self.str.rfind(" ")
            ed=len(self.str)
            word=self.str[st+1:ed]
            self.word=word
            if len(word.strip())!=0:
                ddd.check(word)
                lenn = len(ddd.suggest(word))
                if lenn >= 4:
                    self.word4 = ddd.suggest(word)[3]

                if lenn >= 3:
                    self.word3 = ddd.suggest(word)[2]

                if lenn >= 2:
                    self.word2 = ddd.suggest(word)[1]

                if lenn >= 1:
                    self.word1 = ddd.suggest(word)[0]
            else:
                self.word1 = " "
                self.word2 = " "
                self.word3 = " "
                self.word4 = " "

# Create detector instance
try:
    detector = SignLanguageDetector()
except Exception as e:
    logger.error(f"Failed to initialize detector: {str(e)}")
    sys.exit(1)

@sign_to_text_bp.route('/video_feed')
def video_feed():
    try:
        frame_data = detector.get_frame()
        if not frame_data:
            raise Exception("No frame data received")
            
        # Ensure all required fields are present
        required_fields = ['main_frame', 'current_symbol', 'sentence']
        for field in required_fields:
            if field not in frame_data:
                raise Exception(f"Missing required field: {field}")
                
        return jsonify(frame_data)
    except Exception as e:
        logger.error(f"Error in video_feed: {str(e)}")
        return jsonify({
            'error': str(e),
            'main_frame': None,
            'current_symbol': '-',
            'sentence': getattr(detector, 'str', ' '),
            'suggestions': [' ', ' ', ' ', ' ']
        }), 500

@sign_to_text_bp.route('/select_suggestion', methods=['POST'])
def select_suggestion():
    try:
        data = request.get_json()
        suggestion_idx = data.get('suggestion_idx')
        
        if suggestion_idx == 0:
            detector.str = detector.str[:detector.str.rfind(" ")] + detector.word1.upper()
        elif suggestion_idx == 1:
            detector.str = detector.str[:detector.str.rfind(" ")] + detector.word2.upper()
        elif suggestion_idx == 2:
            detector.str = detector.str[:detector.str.rfind(" ")] + detector.word3.upper()
        elif suggestion_idx == 3:
            detector.str = detector.str[:detector.str.rfind(" ")] + detector.word4.upper()
            
        return jsonify({'success': True, 'sentence': detector.str})
    except Exception as e:
        logger.error(f"Error in select_suggestion: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@sign_to_text_bp.route('/speak', methods=['POST'])
def speak():
    try:
        text = detector.str.strip()
        if not text:
            return jsonify({'success': False, 'error': 'No text to speak'})
            
        with detector.speak_lock:
            try:
                # Create a new engine instance
                engine = pyttsx3.init()
                engine.setProperty('rate', 150)
                voices = engine.getProperty('voices')
                engine.setProperty('voice', voices[0].id)
                
                # Speak the text
                engine.say(text)
                engine.runAndWait()
                
                # Clean up
                engine.stop()
                del engine
                
                return jsonify({'success': True})
            except Exception as e:
                logger.error(f"Error in speech engine: {str(e)}")
                return jsonify({'success': False, 'error': str(e)})
    except Exception as e:
        logger.error(f"Error in speak route: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@sign_to_text_bp.route('/clear', methods=['POST'])
def clear():
    try:
        detector.str = " "
        detector.word = " "
        detector.word1 = " "
        detector.word2 = " "
        detector.word3 = " "
        detector.word4 = " "
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error in clear: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@sign_to_text_bp.route('/release_camera', methods=['POST'])
def release_camera():
    try:
        # Release the camera
        detector.vs.release()
        return jsonify({'success': True, 'message': 'Camera released'})
    except Exception as e:
        logger.error(f"Error releasing camera: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == "__main__":
    # Use threaded=True for better performance
    sign_to_text_bp.run(debug=True, use_reloader=False, threaded=True)
