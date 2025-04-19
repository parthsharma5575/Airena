document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const chatMessages = document.getElementById('chat-messages');
    const textInput = document.getElementById('text-input');
    const sendTextBtn = document.getElementById('send-text');
    const textInputBtn = document.getElementById('text-input-btn');
    const voiceInputBtn = document.getElementById('voice-input-btn');
    const imageInputBtn = document.getElementById('image-input-btn');
    const audioInputBtn = document.getElementById('audio-input-btn');
    const textInputSection = document.getElementById('text-input-section');
    const voiceInputSection = document.getElementById('voice-input-section');
    const imageProcessingSection = document.getElementById('image-processing-section');
    const audioProcessingSection = document.getElementById('audio-processing-section');
    const startRecordingBtn = document.getElementById('start-recording');
    const recordingStatus = document.getElementById('recording-status');
    const currentMode = document.getElementById('current-mode');
    const imageUpload = document.getElementById('image-upload');
    const processImageBtn = document.getElementById('process-image');
    const audioUpload = document.getElementById('audio-upload');
    const processAudioBtn = document.getElementById('process-audio');
    const textToSpeechToggle = document.getElementById('text-to-speech-toggle');
    const agenticToggle = document.getElementById('agentic-toggle');
    
    // Message History
    let messageHistory = [];
    
    // Text-to-speech synthesizer
    const synth = window.speechSynthesis;
    
    // Initialize voice recording
    let audioRecorder = new AudioRecorder();
    let isRecording = false;
    
    // Check if audio features are available
    let audioFeaturesAvailable = false;
    try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            audioFeaturesAvailable = true;
        }
    } catch (e) {
        console.log('Audio features not available:', e);
    }
    
    // Disable audio-related UI elements if audio features are not available
    if (!audioFeaturesAvailable) {
        voiceInputBtn.disabled = true;
        voiceInputBtn.title = 'Audio features not available';
        audioInputBtn.disabled = true;
        audioInputBtn.title = 'Audio features not available';
        textToSpeechToggle.disabled = true;
        textToSpeechToggle.title = 'Text-to-speech not available';
    }
    
    // Add event listeners for input methods
    textInputBtn.addEventListener('click', switchToTextInput);
    voiceInputBtn.addEventListener('click', switchToVoiceInput);
    imageInputBtn.addEventListener('click', switchToImageProcessing);
    audioInputBtn.addEventListener('click', switchToAudioProcessing);
    
    // Add event listener for sending text messages
    sendTextBtn.addEventListener('click', sendTextMessage);
    textInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendTextMessage();
        }
    });
    
    // Add event listener for voice recording
    startRecordingBtn.addEventListener('click', toggleRecording);
    
    // Add event listeners for file uploads
    imageUpload.addEventListener('change', handleImageUpload);
    processImageBtn.addEventListener('click', processImage);
    
    audioUpload.addEventListener('change', handleAudioUpload);
    processAudioBtn.addEventListener('click', processAudio);
    
    // Add welcome message
    addMessage("Welcome to Groq AI Assistant! How can I help you today?", "assistant");
    
    // Function to switch to text input mode
    function switchToTextInput() {
        setActiveButton(textInputBtn);
        setActiveSection(textInputSection);
        currentMode.innerHTML = '<i class="fas fa-keyboard me-2"></i>Text Input Mode';
    }
    
    // Function to switch to voice input mode
    function switchToVoiceInput() {
        if (!audioFeaturesAvailable) {
            addMessage("Audio features are not available in this environment. Please use text input instead.", "system");
            return;
        }
        setActiveButton(voiceInputBtn);
        setActiveSection(voiceInputSection);
        currentMode.innerHTML = '<i class="fas fa-microphone me-2"></i>Voice Input Mode';
    }
    
    // Function to switch to image processing mode
    function switchToImageProcessing() {
        setActiveButton(imageInputBtn);
        setActiveSection(imageProcessingSection);
        currentMode.innerHTML = '<i class="fas fa-image me-2"></i>Image Processing Mode';
    }
    
    // Function to switch to audio processing mode
    function switchToAudioProcessing() {
        if (!audioFeaturesAvailable) {
            addMessage("Audio features are not available in this environment. Please use text input instead.", "system");
            return;
        }
        setActiveButton(audioInputBtn);
        setActiveSection(audioProcessingSection);
        currentMode.innerHTML = '<i class="fas fa-headphones me-2"></i>Audio Processing Mode';
    }
    
    // Function to set active button
    function setActiveButton(button) {
        // Remove active class from all buttons
        document.querySelectorAll('.list-group-item').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to the selected button
        button.classList.add('active');
    }
    
    // Function to set active section
    function setActiveSection(section) {
        // Hide all sections
        document.querySelectorAll('.input-section').forEach(sec => {
            sec.classList.add('d-none');
        });
        
        // Show the selected section
        section.classList.remove('d-none');
    }
    
    // Function to send text message
    function sendTextMessage() {
        const message = textInput.value.trim();
        if (message === '') return;
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Clear input field
        textInput.value = '';
        
        // Show typing indicator
        const typingIndicator = addMessage('Thinking...', 'system', true);
        
        // Send message to server with agentic toggle status
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: message,
                use_agent: agenticToggle.checked
            }),
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Add assistant response to chat
            addMessage(data.response, 'assistant');
            
            // Speak the response if text-to-speech is enabled
            if (textToSpeechToggle.checked && audioFeaturesAvailable) {
                speakText(data.response);
            }
        })
        .catch(error => {
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Add error message to chat
            addMessage('An error occurred while processing your request. Please try again.', 'system');
            console.error('Error:', error);
        });
    }
    
    // Function to toggle voice recording
    function toggleRecording() {
        if (!audioFeaturesAvailable) {
            addMessage("Audio features are not available in this environment. Please use text input instead.", "system");
            return;
        }
        
        if (!isRecording) {
            // Start recording
            audioRecorder.startRecording()
                .then(() => {
                    isRecording = true;
                    startRecordingBtn.classList.add('recording');
                    recordingStatus.textContent = 'Recording... Click to stop';
                })
                .catch(error => {
                    addMessage('Could not access microphone. Please check permissions.', 'system');
                    console.error('Error starting recording:', error);
                });
        } else {
            // Stop recording
            audioRecorder.stopRecording()
                .then(audioBlob => {
                    isRecording = false;
                    startRecordingBtn.classList.remove('recording');
                    recordingStatus.textContent = 'Processing audio...';
                    
                    // Create form data with audio blob
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'recording.wav');
                    
                    // Show typing indicator
                    const typingIndicator = addMessage('Processing voice input...', 'system', true);
                    
                    // Send audio to server
                    fetch('/speech-to-text', {
                        method: 'POST',
                        body: formData,
                    })
                    .then(response => response.json())
                    .then(data => {
                        // Remove typing indicator
                        chatMessages.removeChild(typingIndicator);
                        
                        // Add transcription to chat
                        addMessage(data.text, 'user');
                        
                        // Add assistant response to chat
                        addMessage(data.response, 'assistant');
                        
                        // Speak the response if text-to-speech is enabled
                        if (textToSpeechToggle.checked && audioFeaturesAvailable) {
                            speakText(data.response);
                        }
                        
                        // Reset status
                        recordingStatus.textContent = 'Click to start recording';
                    })
                    .catch(error => {
                        // Remove typing indicator
                        chatMessages.removeChild(typingIndicator);
                        
                        // Add error message to chat
                        addMessage('An error occurred while processing your voice input. Please try again.', 'system');
                        console.error('Error:', error);
                        
                        // Reset status
                        recordingStatus.textContent = 'Click to start recording';
                    });
                });
        }
    }
    
    // Function to handle image upload
    function handleImageUpload() {
        if (imageUpload.files.length > 0) {
            processImageBtn.disabled = false;
        } else {
            processImageBtn.disabled = true;
        }
    }
    
    // Function to process uploaded image
    function processImage() {
        if (imageUpload.files.length === 0) return;
        
        const file = imageUpload.files[0];
        
        // Create image preview and add to chat
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgElement = document.createElement('img');
            imgElement.src = e.target.result;
            imgElement.className = 'image-preview';
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message user-message';
            messageDiv.appendChild(imgElement);
            chatMessages.appendChild(messageDiv);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };
        reader.readAsDataURL(file);
        
        // Create form data with image file
        const formData = new FormData();
        formData.append('image', file);
        
        // Show typing indicator
        const typingIndicator = addMessage('Analyzing image...', 'system', true);
        
        // Send image to server
        fetch('/process-image', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Add assistant response to chat
            addMessage(data.description, 'assistant');
            
            // Speak the response if text-to-speech is enabled
            if (textToSpeechToggle.checked && audioFeaturesAvailable) {
                speakText(data.description);
            }
            
            // Reset file input
            imageUpload.value = '';
            processImageBtn.disabled = true;
        })
        .catch(error => {
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Add error message to chat
            addMessage('An error occurred while processing the image. Please try again.', 'system');
            console.error('Error:', error);
            
            // Reset file input
            imageUpload.value = '';
            processImageBtn.disabled = true;
        });
    }
    
    // Function to handle audio upload
    function handleAudioUpload() {
        if (audioUpload.files.length > 0) {
            processAudioBtn.disabled = false;
        } else {
            processAudioBtn.disabled = true;
        }
    }
    
    // Function to process uploaded audio
    function processAudio() {
        if (!audioFeaturesAvailable) {
            addMessage("Audio features are not available in this environment. Please use text input instead.", "system");
            return;
        }
        
        if (audioUpload.files.length === 0) return;
        
        const file = audioUpload.files[0];
        
        // Add audio file name to chat
        addMessage(`Processing audio file: ${file.name}`, 'user');
        
        // Create form data with audio file
        const formData = new FormData();
        formData.append('audio', file);
        
        // Show typing indicator
        const typingIndicator = addMessage('Processing audio...', 'system', true);
        
        // Send audio to server
        fetch('/process-audio', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Add transcription to chat
            addMessage(`Transcription: ${data.transcription}`, 'system');
            
            // Add assistant response to chat
            addMessage(data.response, 'assistant');
            
            // Speak the response if text-to-speech is enabled
            if (textToSpeechToggle.checked && audioFeaturesAvailable) {
                speakText(data.response);
            }
            
            // Reset file input
            audioUpload.value = '';
            processAudioBtn.disabled = true;
        })
        .catch(error => {
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Add error message to chat
            addMessage('An error occurred while processing the audio. Please try again.', 'system');
            console.error('Error:', error);
            
            // Reset file input
            audioUpload.value = '';
            processAudioBtn.disabled = true;
        });
    }
    
    // Function to add message to chat
    function addMessage(text, sender, isTyping = false) {
        const messageDiv = document.createElement('div');
        
        if (isTyping) {
            // Create typing indicator
            messageDiv.className = 'message system-message';
            messageDiv.innerHTML = `<span class="loading-spinner"></span>${text}`;
        } else {
            // Create normal message
            messageDiv.className = `message ${sender}-message`;
            
            // Handle newlines and URLs in messages
            const formattedText = text
                .replace(/\n/g, '<br>')
                .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
            
            messageDiv.innerHTML = formattedText;
            
            // Add message to history
            messageHistory.push({
                sender: sender,
                text: text
            });
        }
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageDiv;
    }
    
    // Function to speak text using browser's speech synthesis
    function speakText(text) {
        if (!audioFeaturesAvailable) return;
        
        // Stop any current speech
        if (synth.speaking) {
            synth.cancel();
        }
        
        // Create a new speech utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Select a voice (optional)
        const voices = synth.getVoices();
        if (voices.length > 0) {
            // Prefer a female voice if available
            const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('female'));
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
        }
        
        // Set properties
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        // Speak the text
        synth.speak(utterance);
    }
});