class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
    }
    
    /**
     * Request microphone access and start recording
     * @returns {Promise} Resolves when recording starts
     */
    startRecording() {
        return new Promise((resolve, reject) => {

            this.audioChunks = [];

            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {

                    this.mediaRecorder = new MediaRecorder(stream);

                    this.mediaRecorder.addEventListener('dataavailable', e => {
                        if (e.data.size > 0) {
                            this.audioChunks.push(e.data);
                        }
                    });

                    this.mediaRecorder.start();
                    resolve();
                })
                .catch(error => {
                    console.error('Error accessing microphone:', error);
                    reject(error);
                });
        });
    }
    
    /**
     * Stop recording and get the audio blob
     * @returns {Promise<Blob>} Resolves with the audio blob when recording stops
     */
    stopRecording() {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder) {
                reject(new Error('No recording in progress'));
                return;
            }

            this.mediaRecorder.addEventListener('stop', () => {

                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });

                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());

                resolve(audioBlob);
            });

            this.mediaRecorder.stop();
        });
    }
}