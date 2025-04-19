"""
Screen recording module for Space Shooter game.
Handles saving and processing of screen recordings.
"""

import os
import time
import json
import shutil
import logging
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Screen recordings storage path
RECORDINGS_DIR = os.path.join(os.path.dirname(__file__), 'recordings')

# Create recordings directory if it doesn't exist
if not os.path.exists(RECORDINGS_DIR):
    os.makedirs(RECORDINGS_DIR, exist_ok=True)
    
# Active recording sessions
active_sessions = {}

def init_recording_session(session_id, game_id=None):
    """Initialize a new recording session."""
    logger.debug(f"Initializing recording session: {session_id}, Game ID: {game_id}")
    
    # Create session directory
    session_dir = os.path.join(RECORDINGS_DIR, session_id)
    chunks_dir = os.path.join(session_dir, 'chunks')
    
    os.makedirs(session_dir, exist_ok=True)
    os.makedirs(chunks_dir, exist_ok=True)
    
    # Create session metadata
    session_info = {
        'session_id': session_id,
        'game_id': game_id,
        'start_time': datetime.now().isoformat(),
        'status': 'recording',
        'chunks': 0,
        'end_time': None,
        'duration': None,
        'file_path': None
    }
    
    # Save session info
    with open(os.path.join(session_dir, 'info.json'), 'w') as f:
        json.dump(session_info, f, indent=2)
    
    # Store in active sessions
    active_sessions[session_id] = session_info
    
    return session_info

def save_recording_chunk(session_id, chunk_data):
    """Save a recording chunk for the given session."""
    if session_id not in active_sessions:
        logger.warning(f"Trying to save chunk for unknown session: {session_id}")
        return False
    
    try:
        # Update session metadata
        session_info = active_sessions[session_id]
        chunk_number = session_info['chunks']
        session_info['chunks'] += 1
        
        # Define chunk path
        chunks_dir = os.path.join(RECORDINGS_DIR, session_id, 'chunks')
        chunk_path = os.path.join(chunks_dir, f'chunk_{chunk_number:05d}.webm')
        
        # Save the chunk
        with open(chunk_path, 'wb') as f:
            f.write(chunk_data)
        
        logger.debug(f"Saved chunk {chunk_number} for session {session_id}")
        return True
    
    except Exception as e:
        logger.error(f"Error saving chunk for session {session_id}: {str(e)}")
        return False

def finalize_recording(session_id):
    """Finalize a recording session by merging chunks and updating metadata."""
    if session_id not in active_sessions:
        logger.warning(f"Trying to finalize unknown session: {session_id}")
        return None
    
    try:
        # Get session info
        session_info = active_sessions[session_id]
        session_dir = os.path.join(RECORDINGS_DIR, session_id)
        chunks_dir = os.path.join(session_dir, 'chunks')
        
        # Update session info
        end_time = datetime.now()
        session_info['end_time'] = end_time.isoformat()
        session_info['status'] = 'processing'
        
        # Calculate duration
        start_time = datetime.fromisoformat(session_info['start_time'])
        duration_seconds = (end_time - start_time).total_seconds()
        session_info['duration'] = duration_seconds
        
        # Save updated session info
        with open(os.path.join(session_dir, 'info.json'), 'w') as f:
            json.dump(session_info, f, indent=2)
        
        # Concatenate video chunks if more than one chunk exists
        output_path = os.path.join(session_dir, f'gameplay_{session_id}.webm')
        session_info['file_path'] = output_path
        
        if session_info['chunks'] > 0:
            if session_info['chunks'] == 1:
                # If only one chunk, just copy it
                chunk_path = os.path.join(chunks_dir, f'chunk_00000.webm')
                if os.path.exists(chunk_path):
                    shutil.copy(chunk_path, output_path)
                    logger.debug(f"Copied single chunk to {output_path}")
                else:
                    logger.error(f"Expected chunk file not found: {chunk_path}")
                    return None
            else:
                # Concatenate chunks using simple binary merge
                with open(output_path, 'wb') as outfile:
                    # Merge all chunk files
                    for i in range(session_info['chunks']):
                        chunk_path = os.path.join(chunks_dir, f'chunk_{i:05d}.webm')
                        if os.path.exists(chunk_path):
                            with open(chunk_path, 'rb') as infile:
                                outfile.write(infile.read())
                
                logger.debug(f"Merged {session_info['chunks']} chunks into {output_path}")
            
            # Mark as completed
            session_info['status'] = 'completed'
            
            # Save updated session info
            with open(os.path.join(session_dir, 'info.json'), 'w') as f:
                json.dump(session_info, f, indent=2)
            
            # Remove from active sessions
            if session_id in active_sessions:
                del active_sessions[session_id]
            
            # Return the recording ID (same as session ID in this case)
            return session_id
        else:
            # No chunks were saved
            logger.warning(f"No video chunks were received for session {session_id}")
            return None
        
    except Exception as e:
        logger.error(f"Error finalizing recording {session_id}: {str(e)}")
        
        # Mark as error
        if session_id in active_sessions:
            session_info = active_sessions[session_id]
            session_info['status'] = 'error'
            session_info['error'] = str(e)
            
            # Save error info
            session_dir = os.path.join(RECORDINGS_DIR, session_id)
            with open(os.path.join(session_dir, 'info.json'), 'w') as f:
                json.dump(session_info, f, indent=2)
            
            # Remove from active sessions
            active_sessions.pop(session_id, None)
        
        return None

def get_recording_info(recording_id):
    """Get information about a recording."""
    # First check if it's a session ID
    session_dir = os.path.join(RECORDINGS_DIR, recording_id)
    if os.path.exists(session_dir) and os.path.isdir(session_dir):
        info_path = os.path.join(session_dir, 'info.json')
        if os.path.exists(info_path):
            with open(info_path, 'r') as f:
                return json.load(f)
    
    # Next check if it's a recording ID with .webm extension
    recording_path = os.path.join(RECORDINGS_DIR, f"{recording_id}.webm")
    if os.path.exists(recording_path):
        # Return simple info
        return {
            'recording_id': recording_id,
            'file_path': recording_path,
            'status': 'completed'
        }
    
    return None

def get_recording_file(recording_id):
    """Get the file path for a recording."""
    info = get_recording_info(recording_id)
    if info and 'file_path' in info:
        file_path = info['file_path']
        if os.path.exists(file_path):
            return file_path
    
    # Direct check for the recording file
    recording_path = os.path.join(RECORDINGS_DIR, f"{recording_id}.webm")
    if os.path.exists(recording_path):
        return recording_path
    
    return None

def list_recordings():
    """List all recordings."""
    recordings = []
    
    # Walk through the recordings directory
    for item in os.listdir(RECORDINGS_DIR):
        # Skip non-directory items except .webm files
        item_path = os.path.join(RECORDINGS_DIR, item)
        if not os.path.isdir(item_path) and not item.endswith('.webm'):
            continue
        
        if os.path.isdir(item_path):
            # Check for info.json in directory
            info_path = os.path.join(item_path, 'info.json')
            if os.path.exists(info_path):
                with open(info_path, 'r') as f:
                    try:
                        info = json.load(f)
                        if info.get('status') == 'completed':
                            recordings.append(info)
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON in {info_path}")
    
    return recordings

def delete_recording(recording_id):
    """Delete a recording."""
    info = get_recording_info(recording_id)
    if not info:
        return False
    
    try:
        # Delete the session directory
        if 'session_id' in info:
            session_dir = os.path.join(RECORDINGS_DIR, info['session_id'])
            if os.path.exists(session_dir) and os.path.isdir(session_dir):
                shutil.rmtree(session_dir)
        
        # Delete the recording file
        recording_path = os.path.join(RECORDINGS_DIR, f"{recording_id}.webm")
        if os.path.exists(recording_path):
            os.remove(recording_path)
        
        return True
    except Exception as e:
        logger.error(f"Error deleting recording {recording_id}: {str(e)}")
        return False