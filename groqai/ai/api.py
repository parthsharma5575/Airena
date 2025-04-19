import os
import base64
import tempfile
import groq
import speech_recognition as sr
from pydub import AudioSegment
from PIL import Image
import logging

class GroqAPI:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
            
        try:
            # Initialize client without proxies parameter
            self.client = groq.Client(api_key=self.api_key)
            logging.info("Groq client initialized successfully")
        except Exception as e:
            logging.error(f"Failed to initialize Groq client: {str(e)}")
            raise
            
        self.audio_enabled = False
        
        try:
            # Try to initialize speech recognition to check if audio features are available
            sr.Recognizer()
            self.audio_enabled = True
            logging.info("Audio features enabled")
        except Exception as e:
            logging.warning(f"Audio features disabled: {str(e)}")
            self.audio_enabled = False

        self.system_prompt = {
            "role": "system",
            "content": "You are a helpful assistant. You reply with long answers."
        }
        
        self.chat_history = [self.system_prompt]
    
    def get_chat_response(self, user_input, use_agent=False):
        """Get a response from the Groq chatbot for text input"""
        try:
            if not self.client:
                return "Error: Groq API is not properly initialized. Please check your API key."
                
            self.chat_history.append({"role": "user", "content": user_input})
            
            # Select model based on whether we want to use agentic capabilities
            model = "compound-beta" if use_agent else "meta-llama/llama-4-scout-17b-16e-instruct"
            
            response = self.client.chat.completions.create(
                model=model,
                messages=self.chat_history,
                max_tokens=2000,
                temperature=1.2,
            )
            
            assistant_response = response.choices[0].message.content
            
            tool_calls = None
            if use_agent and hasattr(response.choices[0].message, 'tool_calls'):
                tool_calls = response.choices[0].message.tool_calls
                if tool_calls:
                    # Append tool calls information to the response
                    assistant_response += "\n\n[Tool Calls Information]:\n"
                    for tool_call in tool_calls:
                        assistant_response += f"- Used tool: {tool_call.function.name}\n"
                        assistant_response += f"- Tool arguments: {tool_call.function.arguments}\n\n"
            
            # Append the assistant's response to the chat history
            self.chat_history.append({"role": "assistant", "content": assistant_response})
            
            return assistant_response
        
        except Exception as e:
            error_message = f"An error occurred while generating a response: {str(e)}"
            logging.error(error_message)
            return error_message
    
    def speech_to_text(self, audio_data):
        """Convert speech to text from audio data"""
        if not self.audio_enabled:
            return "Audio features are not available in this environment. Please use text input instead."
            
        try:
            # Create temp files for original and converted audio
            with tempfile.NamedTemporaryFile(suffix=".flac", delete=False) as temp_input_file:
                temp_input_file.write(audio_data)
                temp_input_path = temp_input_file.name
            
            # Create output wav file path
            temp_output_path = temp_input_path.replace(".flac", ".wav")
            
            try:
                # Load audio with pydub (supports many formats including FLAC)
                audio_segment = AudioSegment.from_file(temp_input_path)
                # Export as WAV for compatibility with speech_recognition
                audio_segment.export(temp_output_path, format="wav")
            except Exception as conversion_error:
                # If conversion fails, try direct processing
                temp_output_path = temp_input_path
            
            # Convert the audio file to text
            recognizer = sr.Recognizer()
            with sr.AudioFile(temp_output_path) as source:
                audio = recognizer.record(source)
                text = recognizer.recognize_google(audio)
            
            # Clean up the temporary files
            if os.path.exists(temp_input_path):
                os.unlink(temp_input_path)
            if os.path.exists(temp_output_path) and temp_output_path != temp_input_path:
                os.unlink(temp_output_path)
            
            return text
        
        except sr.UnknownValueError:
            return "Sorry, I could not understand the audio."
        
        except sr.RequestError as e:
            return f"Error with the speech recognition service: {e}"
        
        except Exception as e:
            return f"An error occurred: {str(e)}"
    
    def encode_image(self, image_data):
        """Encode the image data to base64 format"""
        return base64.b64encode(image_data).decode('utf-8')
    
    def process_image(self, image_data):
        """Process an image using Groq's multimodal model"""
        try:
            # Encode the image to base64
            base64_image = self.encode_image(image_data)
            
            response = self.client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",  # Use the same model for vision
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Describe this image in detail:"},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                },
                            },
                        ],
                    }
                ],
                max_tokens=1024,
                temperature=0.7,
            )
            
            # Extract and return the description from the response
            return response.choices[0].message.content
        
        except Exception as e:
            return f"An error occurred while processing the image: {str(e)}"
    
    def process_audio(self, audio_data):
        """Process audio for transcription"""
        if not self.audio_enabled:
            return {
                "transcription": "Audio features are not available in this environment. Please use text input instead.",
                "response": "I'm sorry, but audio processing is not available in this environment."
            }
            
        try:
            # Create temp files for original and converted audio
            with tempfile.NamedTemporaryFile(suffix=".flac", delete=False) as temp_input_file:
                temp_input_file.write(audio_data)
                temp_input_path = temp_input_file.name
            
            # Create output wav file path
            temp_output_path = temp_input_path.replace(".flac", ".wav")
            
            try:
                # Load audio with pydub (supports many formats including FLAC)
                audio_segment = AudioSegment.from_file(temp_input_path)
                # Export as WAV for compatibility with speech_recognition
                audio_segment.export(temp_output_path, format="wav")
            except Exception as conversion_error:
                # If conversion fails, try direct processing
                temp_output_path = temp_input_path
                
            # Convert the audio file to text
            recognizer = sr.Recognizer()
            with sr.AudioFile(temp_output_path) as source:
                audio = recognizer.record(source)
                transcription = recognizer.recognize_google(audio)
            
            # Clean up the temporary files
            if os.path.exists(temp_input_path):
                os.unlink(temp_input_path)
            if os.path.exists(temp_output_path) and temp_output_path != temp_input_path:
                os.unlink(temp_output_path)
            
            # Get a response from the model based on the transcription
            response = self.get_chat_response(transcription, False)
            
            return {
                "transcription": transcription,
                "response": response
            }
        
        except Exception as e:
            return {
                "transcription": f"An error occurred: {str(e)}",
                "response": "I couldn't process the audio. Please try again."
            }