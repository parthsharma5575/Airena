// Game Screen Recorder for Space Shooter
// Uses MediaRecorder API to capture game canvas

// Global variables for recording
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let recordingStream = null;
let recordingTimer = null;
let recordingTimeElapsed = 0;
let sessionId = null;

// Initialize the screen recorder when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Screen recorder initialized');
    
    // Add recording controls to the game interface
    addRecordingControls();
    
    // Set up event listeners for recording buttons
    setupRecordingEventListeners();
});

// Add recording controls to the game interface
function addRecordingControls() {
    // Create recording control container
    const recordingControls = document.createElement('div');
    recordingControls.className = 'recording-controls';
    recordingControls.innerHTML = `
        <div class="btn-group recording-buttons" role="group">
            <button id="start-recording" class="btn btn-danger">
                <i class="fas fa-circle"></i> Record
            </button>
            <button id="stop-recording" class="btn btn-secondary" disabled>
                <i class="fas fa-stop"></i> Stop
            </button>
            <button id="share-recording" class="btn btn-primary" disabled>
                <i class="fas fa-share"></i> Share
            </button>
        </div>
        <div id="recording-timer" class="recording-timer">00:00</div>
        <div id="recording-status" class="recording-status"></div>
    `;
    
    // Add controls to the game interface
    const gameControls = document.querySelector('.game-controls');
    if (gameControls) {
        gameControls.appendChild(recordingControls);
    } else {
        // If game controls don't exist yet, add to the game container
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.appendChild(recordingControls);
        } else {
            // As a last resort, add to the body
            document.body.appendChild(recordingControls);
        }
    }
    
    // Add recording status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'recording-indicator';
    statusIndicator.innerHTML = `
        <div class="recording-dot"></div>
        <span>REC</span>
    `;
    document.body.appendChild(statusIndicator);
    
    // Add CSS for recording controls
    addRecordingStyles();
}

// Set up event listeners for recording buttons
function setupRecordingEventListeners() {
    // Start recording button
    const startButton = document.getElementById('start-recording');
    if (startButton) {
        startButton.addEventListener('click', startRecording);
    }
    
    // Stop recording button
    const stopButton = document.getElementById('stop-recording');
    if (stopButton) {
        stopButton.addEventListener('click', stopRecording);
    }
    
    // Share recording button
    const shareButton = document.getElementById('share-recording');
    if (shareButton) {
        shareButton.addEventListener('click', shareRecording);
    }
}

// Start recording the game canvas
async function startRecording() {
    try {
        // Get the game canvas
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            showRecordingStatus('Game canvas not found', 'error');
            return;
        }
        
        // Create a unique session ID for this recording
        sessionId = generateSessionId();
        
        // Get the canvas stream
        recordingStream = canvas.captureStream(30); // 30 FPS
        
        // Initialize media recorder with canvas stream
        const options = { mimeType: 'video/webm;codecs=vp9' };
        mediaRecorder = new MediaRecorder(recordingStream, options);
        
        // Set up media recorder event handlers
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleRecordingStopped;
        
        // Clear previous recorded chunks
        recordedChunks = [];
        
        // Start recording
        mediaRecorder.start(100); // Collect 100ms chunks
        isRecording = true;
        
        // Update UI
        document.getElementById('start-recording').disabled = true;
        document.getElementById('stop-recording').disabled = false;
        document.getElementById('share-recording').disabled = true;
        document.body.classList.add('recording');
        
        // Start recording timer
        startRecordingTimer();
        
        // Show status
        showRecordingStatus('Recording started', 'success');
        
        // Notify the server that recording has started
        notifyRecordingStarted(sessionId);
        
        console.log('Recording started with session ID:', sessionId);
    } catch (error) {
        console.error('Error starting recording:', error);
        showRecordingStatus('Failed to start recording: ' + error.message, 'error');
    }
}

// Stop the current recording
function stopRecording() {
    if (mediaRecorder && isRecording) {
        // Stop the media recorder
        mediaRecorder.stop();
        isRecording = false;
        
        // Stop all tracks in the stream
        if (recordingStream) {
            recordingStream.getTracks().forEach(track => track.stop());
        }
        
        // Update UI
        document.getElementById('start-recording').disabled = false;
        document.getElementById('stop-recording').disabled = true;
        document.getElementById('share-recording').disabled = false;
        document.body.classList.remove('recording');
        
        // Stop recording timer
        stopRecordingTimer();
        
        // Show status
        showRecordingStatus('Recording stopped', 'info');
        
        console.log('Recording stopped');
    }
}

// Handle recorded data chunks
function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
        
        // Send chunk to server
        sendChunkToServer(event.data, sessionId);
    }
}

// Handle recording stopped event
function handleRecordingStopped() {
    // Notify server that recording has ended
    notifyRecordingEnded(sessionId);
    
    // If there are recorded chunks, enable sharing
    if (recordedChunks.length > 0) {
        document.getElementById('share-recording').disabled = false;
    }
}

// Send recorded chunk to server
function sendChunkToServer(chunk, sessionId) {
    // Create form data with chunk and session ID
    const formData = new FormData();
    formData.append('video_chunk', chunk);
    formData.append('session_id', sessionId);
    
    // Send chunk to server
    fetch('/screenshare/upload_chunk', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Error sending chunk:', data.message);
        }
    })
    .catch(error => {
        console.error('Error sending chunk to server:', error);
    });
}

// Notify server that recording has started
function notifyRecordingStarted(sessionId) {
    fetch('/screenshare/start_recording', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            session_id: sessionId,
            game_id: getGameId()
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Recording session started on server:', data);
    })
    .catch(error => {
        console.error('Error notifying server about recording start:', error);
    });
}

// Notify server that recording has ended
function notifyRecordingEnded(sessionId) {
    fetch('/screenshare/stop_recording', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            session_id: sessionId
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Recording session ended on server:', data);
        
        // Update share button with the recording ID
        if (data.success && data.recording_id) {
            document.getElementById('share-recording').setAttribute('data-recording-id', data.recording_id);
        }
    })
    .catch(error => {
        console.error('Error notifying server about recording end:', error);
    });
}

// Share the recorded gameplay
function shareRecording() {
    const recordingId = document.getElementById('share-recording').getAttribute('data-recording-id');
    
    if (!recordingId) {
        showRecordingStatus('No recording available to share', 'error');
        return;
    }
    
    // Create sharing modal
    const modal = document.createElement('div');
    modal.className = 'recording-share-modal';
    modal.innerHTML = `
        <div class="recording-share-content">
            <span class="close-modal">&times;</span>
            <h3>Share Your Gameplay</h3>
            <p>Your gameplay recording is ready to share!</p>
            <div class="share-options">
                <div class="share-link-container">
                    <input type="text" readonly id="share-link" value="${window.location.origin}/screenshare/view/${recordingId}">
                    <button id="copy-link" class="btn btn-sm btn-secondary">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <div class="share-buttons">
                    <a href="#" class="btn btn-primary" id="download-recording">
                        <i class="fas fa-download"></i> Download
                    </a>
                    <a href="#" class="btn btn-success" id="share-to-social">
                        <i class="fas fa-share-alt"></i> Share
                    </a>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Set up modal event listeners
    const closeModal = modal.querySelector('.close-modal');
    closeModal.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
    
    // Copy link button
    const copyLinkBtn = document.getElementById('copy-link');
    const shareLink = document.getElementById('share-link');
    
    copyLinkBtn.addEventListener('click', () => {
        shareLink.select();
        document.execCommand('copy');
        copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 2000);
    });
    
    // Download recording button
    const downloadBtn = document.getElementById('download-recording');
    downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Create download link for local recording
        if (recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `gameplay-${recordingId}.webm`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        } else {
            // Download from server
            window.location.href = `/screenshare/download/${recordingId}`;
        }
    });
    
    // Share to social button
    const shareToSocialBtn = document.getElementById('share-to-social');
    shareToSocialBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // If Web Share API is available
        if (navigator.share) {
            navigator.share({
                title: 'My Space Shooter Gameplay',
                text: 'Check out my Space Shooter gameplay!',
                url: shareLink.value
            })
            .then(() => console.log('Successful share'))
            .catch((error) => console.log('Error sharing:', error));
        } else {
            // Open window with popular sharing options
            const shareWindow = window.open('', 'Share Recording', 'width=600,height=400');
            shareWindow.document.write(`
                <html>
                <head>
                    <title>Share Your Gameplay</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
                        .share-option { margin: 10px 0; padding: 10px; background: white; border-radius: 5px; cursor: pointer; }
                    </style>
                </head>
                <body>
                    <h2>Share Your Gameplay</h2>
                    <div class="share-option" onclick="window.opener.open('https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink.value)}&text=Check out my Space Shooter gameplay!', '_blank')">Share to Twitter</div>
                    <div class="share-option" onclick="window.opener.open('https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink.value)}', '_blank')">Share to Facebook</div>
                    <div class="share-option" onclick="window.opener.open('mailto:?subject=My Space Shooter Gameplay&body=Check out my gameplay: ${encodeURIComponent(shareLink.value)}', '_blank')">Share via Email</div>
                </body>
                </html>
            `);
        }
    });
}

// Start the recording timer
function startRecordingTimer() {
    // Reset time elapsed
    recordingTimeElapsed = 0;
    
    // Update timer display every second
    recordingTimer = setInterval(() => {
        recordingTimeElapsed++;
        updateTimerDisplay();
    }, 1000);
    
    // Initial display update
    updateTimerDisplay();
}

// Stop the recording timer
function stopRecordingTimer() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
}

// Update the timer display
function updateTimerDisplay() {
    const minutes = Math.floor(recordingTimeElapsed / 60);
    const seconds = recordingTimeElapsed % 60;
    
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerElement = document.getElementById('recording-timer');
    if (timerElement) {
        timerElement.textContent = formattedTime;
    }
}

// Show recording status messages
function showRecordingStatus(message, type = 'info') {
    const statusElement = document.getElementById('recording-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `recording-status ${type}`;
        
        // Clear status after a few seconds
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'recording-status';
        }, 3000);
    }
}

// Generate a unique session ID for the recording
function generateSessionId() {
    return 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get the current game ID if available
function getGameId() {
    // Try to get game ID from URL or game state
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game_id');
    
    // If available in URL, return it
    if (gameId) {
        return gameId;
    }
    
    // Try to get from game state (this depends on how your game stores state)
    if (window.gameState && window.gameState.gameId) {
        return window.gameState.gameId;
    }
    
    // Generate a default game ID if none found
    return 'game_' + Date.now();
}

// Add CSS styles for recording UI
function addRecordingStyles() {
    // Create a style element
    const style = document.createElement('style');
    style.textContent = `
        .recording-controls {
            margin-top: 15px;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .recording-buttons {
            display: flex;
            margin-right: 15px;
        }
        
        .recording-timer {
            font-family: monospace;
            font-size: 1.2rem;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            margin-right: 10px;
        }
        
        .recording-status {
            font-size: 0.9rem;
            padding: 3px 8px;
            border-radius: 4px;
        }
        
        .recording-status.success {
            background: rgba(40, 167, 69, 0.2);
            color: #28a745;
        }
        
        .recording-status.error {
            background: rgba(220, 53, 69, 0.2);
            color: #dc3545;
        }
        
        .recording-status.info {
            background: rgba(23, 162, 184, 0.2);
            color: #17a2b8;
        }
        
        .recording-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            display: flex;
            align-items: center;
            padding: 5px 10px;
            border-radius: 4px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        }
        
        body.recording .recording-indicator {
            opacity: 1;
        }
        
        .recording-dot {
            width: 12px;
            height: 12px;
            background: #dc3545;
            border-radius: 50%;
            margin-right: 5px;
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .recording-share-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
        }
        
        .recording-share-modal.show {
            opacity: 1;
            visibility: visible;
        }
        
        .recording-share-content {
            background: #343a40;
            padding: 25px;
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
            position: relative;
        }
        
        .close-modal {
            position: absolute;
            right: 15px;
            top: 10px;
            font-size: 24px;
            cursor: pointer;
            color: #adb5bd;
        }
        
        .close-modal:hover {
            color: white;
        }
        
        .share-options {
            margin-top: 20px;
        }
        
        .share-link-container {
            display: flex;
            margin-bottom: 15px;
        }
        
        #share-link {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #495057;
            border-radius: 4px 0 0 4px;
            background: #212529;
            color: white;
        }
        
        #copy-link {
            border-radius: 0 4px 4px 0;
        }
        
        .share-buttons {
            display: flex;
            justify-content: space-between;
        }
        
        .share-buttons a {
            flex: 1;
            margin: 0 5px;
            text-align: center;
        }
    `;
    
    // Add style to head
    document.head.appendChild(style);
}