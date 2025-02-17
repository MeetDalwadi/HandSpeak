// DOM Elements
const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const startBtn = document.getElementById('startBtn');
const skipBtn = document.getElementById('skipBtn');
const currentTarget = document.getElementById('current-target');
const feedbackText = document.getElementById('feedback-text');
const accuracyMeter = document.querySelector('.meter-fill');
const modeCards = document.querySelectorAll('.mode-card');

// Variables
let isStreaming = false;
let currentMode = 'letters';
let mediaStream = null;

// Practice content for different modes
const practiceContent = {
    letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    words: ['Hello', 'Thank You', 'Please', 'Good', 'Bad', 'Yes', 'No'],
    phrases: ['How are you', 'Nice to meet you', 'Good morning', 'Good night']
};

// Event Listeners
startBtn.addEventListener('click', togglePractice);
skipBtn.addEventListener('click', skipCurrentSign);

modeCards.forEach(card => {
    card.addEventListener('click', () => {
        // Remove active class from all cards
        modeCards.forEach(c => c.classList.remove('active'));
        // Add active class to clicked card
        card.classList.add('active');
        // Update current mode
        currentMode = card.dataset.mode;
        // Reset practice if it's running
        if (isStreaming) {
            stopPractice();
            startPractice();
        }
    });
});

// Functions
async function togglePractice() {
    if (!isStreaming) {
        await startPractice();
    } else {
        stopPractice();
    }
}

async function startPractice() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640,
                height: 480,
                facingMode: 'user'
            } 
        });
        video.srcObject = mediaStream;
        video.play();
        isStreaming = true;
        startBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Practice';
        skipBtn.disabled = false;
        updateTarget();
        setupCanvas();
        startDetection();
    } catch (err) {
        console.error('Error accessing webcam:', err);
        feedbackText.textContent = 'Error accessing webcam. Please make sure you have granted camera permissions.';
    }
}

function stopPractice() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    video.srcObject = null;
    isStreaming = false;
    startBtn.innerHTML = '<i class="fas fa-play"></i> Start Practice';
    skipBtn.disabled = true;
    currentTarget.textContent = 'Click Start to Begin';
    feedbackText.textContent = 'Ready to start practicing!';
    accuracyMeter.style.width = '0%';
}

function setupCanvas() {
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame on canvas
    function drawFrame() {
        if (isStreaming) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Add any additional drawing (hand landmarks, etc.) here
            requestAnimationFrame(drawFrame);
        }
    }
    drawFrame();
}

function startDetection() {
    // Placeholder for hand detection logic
    // This would integrate with your ML model for sign detection
    simulateDetection();
}

function simulateDetection() {
    // Simulated detection for demonstration
    if (isStreaming) {
        const accuracy = Math.random() * 100;
        updateAccuracy(accuracy);
        setTimeout(simulateDetection, 1000);
    }
}

function updateAccuracy(accuracy) {
    accuracyMeter.style.width = `${accuracy}%`;
    if (accuracy > 90) {
        feedbackText.textContent = 'Excellent! Move to next sign?';
    } else if (accuracy > 70) {
        feedbackText.textContent = 'Good! Keep practicing...';
    } else {
        feedbackText.textContent = 'Try adjusting your hand position';
    }
}

function updateTarget() {
    const content = practiceContent[currentMode];
    const randomIndex = Math.floor(Math.random() * content.length);
    currentTarget.textContent = content[randomIndex];
}

function skipCurrentSign() {
    if (isStreaming) {
        updateTarget();
        accuracyMeter.style.width = '0%';
        feedbackText.textContent = 'New sign loaded. Start practicing!';
    }
}
