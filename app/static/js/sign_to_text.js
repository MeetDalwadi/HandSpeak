let lastSpeakTime = 0;
const speakCooldown = 1000; // 1 second cooldown
let updateInterval = null;
const errorMessageTimeout = 3000; // 3 seconds
let retryCount = 0;
const maxRetries = 5;  // Increased max retries
const retryDelay = 1000; // 1 second
let lastFrameTime = 0;
const minFrameInterval = 25; // Minimum 25ms between frames (40 FPS max)
let connectionLost = false;
let frameRequestPending = false;

const geminiApiKey = "" // Replace with your actual Gemini API key


async function generateSuggestions() {
    const sentence = document.getElementById("sentence").innerText;

    if (!sentence || sentence === "-") {
        alert("No text to generate suggestions for!");
        return;
    }

    // Gemini API requires a structured request format
    const prompt = `Improve the grammar and natural flow of this sentence: "${sentence}"
    Provide exactly 3 alternative suggestions that maintain the original meaning.
    Return ONLY a JSON object in this format: {"suggestions": ["suggestion1", "suggestion2", "suggestion3"]}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${geminiApiKey}`, 
            {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gemini-pro",
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: { maxOutputTokens: 100 }
            })
        });

        // Log full response to debug errors
        const data = await response.json();
        console.log("Gemini API Response:", data);

        if (!response.ok) {
            throw new Error(`API Error: ${data.error?.message || "Unknown error"}`);
        }

        if (data && data.candidates && data.candidates.length > 0) {
            try {
                const parsedContent = JSON.parse(data.candidates[0].content.parts[0].text);
                if (Array.isArray(parsedContent.suggestions) && parsedContent.suggestions.length >= 2) {
                    document.getElementById("suggestion-1").innerText = parsedContent.suggestions[0];
                    document.getElementById("suggestion-2").innerText = parsedContent.suggestions[1];
                } else {
                    throw new Error("Invalid response format from Gemini");
                }
            } catch (error) {
                console.error("Failed to parse Gemini response:", error);
                alert("API returned an unexpected format. Try again.");
            }
        } else {
            alert("Could not generate suggestions. Try again.");
        }
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        alert(`Failed to generate suggestions: ${error.message}`);
    }
}


// Function to use the selected suggestion
let userSentence = ""; // Global variable to store sentence

function useSuggestion(index) {
    const suggestionText = document.getElementById(`suggestion-${index}`).textContent.trim();
    if (suggestionText && suggestionText !== "...") {
        userSentence = suggestionText;
        document.getElementById("sentence").textContent = userSentence;
    }
}

function showError(message, duration = errorMessageTimeout) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        if (message === errorElement.textContent) {  // Only hide if it's the same error
            errorElement.style.display = 'none';
        }
    }, duration);
}

function updateFrame() {
    const currentTime = performance.now();
    if (frameRequestPending || (currentTime - lastFrameTime) < minFrameInterval) {
        // Skip this update if we're still waiting for a response or if it's too soon
        return;
    }

    frameRequestPending = true;
    fetch('/sign_to_text/video_feed')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            frameRequestPending = false;
            lastFrameTime = performance.now();
            
            // Reset retry count and connection status on successful response
            if (connectionLost) {
                showError("Connection restored!", 2000);
                connectionLost = false;
            }
            retryCount = 0;

            if (data.error) {
                if (data.error !== "Frame skipped") {
                    showError(data.error);
                }
            }

            // Update the main video feed
            const videoFeed = document.getElementById('video-feed');
            const placeholder = document.getElementById('video-placeholder');
            
            if (data.main_frame) {
                videoFeed.src = 'data:image/jpeg;base64,' + data.main_frame;
                videoFeed.style.display = 'block';
                placeholder.style.display = 'none';
                
                // Only hide error message if we have a valid frame
                const errorElement = document.getElementById('error-message');
                if (errorElement.textContent.includes("Connection error")) {
                    errorElement.style.display = 'none';
                }
            } else {
                videoFeed.style.display = 'none';
                placeholder.style.display = 'flex';
            }

            // Update current symbol and sentence
            document.getElementById('current-symbol').textContent = data.current_symbol || '-';
            document.getElementById('sentence').textContent = data.sentence || '-';
        })
        .catch(error => {
            console.error('Error:', error);
            frameRequestPending = false;
            
            if (!connectionLost) {
                connectionLost = true;
                showError("Connection lost. Attempting to reconnect...", 10000);
            }
            
            retryCount++;
            if (retryCount <= maxRetries) {
                const backoffDelay = Math.min(retryDelay * Math.pow(1.5, retryCount - 1), 5000);
                setTimeout(updateFrame, backoffDelay);
            } else {
                showError("Failed to connect to video feed. Please refresh the page.", 0);
                stopVideoFeed();
            }
        });
}

function startVideoFeed() {
    if (!updateInterval) {
        // Reset state
        retryCount = 0;
        connectionLost = false;
        frameRequestPending = false;
        lastFrameTime = 0;
        
        // Start update loop
        updateFrame();
        updateInterval = setInterval(updateFrame, minFrameInterval);
    }
}

function stopVideoFeed() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
        
        // Call backend to release camera
        fetch('/sign_to_text/release_camera', {
            method: 'POST'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to release camera');
            }
            console.log('Camera released successfully');
        })
        .catch(error => {
            console.error('Error releasing camera:', error);
        });
    }
}

function toggleVideoFeed() {
    const toggleBtn = document.getElementById('video-toggle-btn');
    
    if (updateInterval) {
        // Video is currently running, so stop it
        stopVideoFeed();
        toggleBtn.textContent = 'Start Video';
        toggleBtn.classList.remove('btn-danger');
        toggleBtn.classList.add('btn-success');
        
        // Hide video feed and show placeholder
        document.getElementById('video-feed').style.display = 'none';
        document.getElementById('video-placeholder').style.display = 'flex';
        document.getElementById('current-symbol').textContent = '-';
    } else {
        // Video is stopped, so start it
        startVideoFeed();
        toggleBtn.textContent = 'Stop Video';
        toggleBtn.classList.remove('btn-success');
        toggleBtn.classList.add('btn-danger');
    }
}

// Start video feed when page loads
window.addEventListener('load', startVideoFeed);

// Clean up when page is hidden/closed
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopVideoFeed();
    } else {
        startVideoFeed();
    }
});

window.addEventListener('beforeunload', stopVideoFeed);

function speak() {
    const currentTime = Date.now();
    if (currentTime - lastSpeakTime < speakCooldown) {
        console.log('Speech cooldown active');
        return;
    }
    
    lastSpeakTime = currentTime;
    
    fetch('/sign_to_text/speak', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Speech error:', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function clearSentence() {
    fetch('/sign_to_text/clear', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Clear error:', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}