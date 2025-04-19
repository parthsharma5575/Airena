
import os
from flask import request, jsonify, send_file, render_template, abort
from werkzeug.utils import secure_filename
from . import screenpipe

def register_routes(app):
    """Register screen recording routes with Flask app."""
    
    # Create recordings directory if it doesn't exist
    if not os.path.exists(screenpipe.RECORDINGS_DIR):
        os.makedirs(screenpipe.RECORDINGS_DIR, exist_ok=True)
    
    @app.route('/screenshare/start_recording', methods=['POST'])
    def start_recording():
        """Start a new recording session."""
        data = request.json
        session_id = data.get('session_id')
        game_id = data.get('game_id')
        
        if not session_id:
            return jsonify({
                'success': False,
                'message': 'Missing session_id'
            }), 400
        
        session_info = screenpipe.init_recording_session(session_id, game_id)
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'message': 'Recording session started'
        })
    
    @app.route('/screenshare/upload_chunk', methods=['POST'])
    def upload_chunk():
        """Upload a video chunk."""
        if 'video_chunk' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No video chunk in request'
            }), 400
        
        session_id = request.form.get('session_id')
        if not session_id:
            return jsonify({
                'success': False,
                'message': 'Missing session_id'
            }), 400
        
        video_chunk = request.files['video_chunk']
        if video_chunk.filename == '':
            return jsonify({
                'success': False,
                'message': 'Empty filename'
            }), 400
        
        chunk_data = video_chunk.read()
        success = screenpipe.save_recording_chunk(session_id, chunk_data)
        
        return jsonify({
            'success': success,
            'message': 'Chunk uploaded' if success else 'Failed to process chunk'
        })
    
    @app.route('/screenshare/stop_recording', methods=['POST'])
    def stop_recording():
        """Stop a recording session."""
        data = request.json
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({
                'success': False,
                'message': 'Missing session_id'
            }), 400
        
        recording_id = screenpipe.finalize_recording(session_id)
        
        if recording_id:
            return jsonify({
                'success': True,
                'recording_id': recording_id,
                'message': 'Recording session stopped and processed'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to finalize recording'
            })
    
    @app.route('/screenshare/view/<recording_id>')
    def view_recording(recording_id):
        """View a recording."""
        recording_info = screenpipe.get_recording_info(recording_id)
        
        if not recording_info:
            abort(404)
        
        return render_template('screenshare/view.html', recording=recording_info, recording_id=recording_id)
    
    @app.route('/screenshare/embed/<recording_id>')
    def embed_recording(recording_id):
        """Embed a recording."""
        recording_info = screenpipe.get_recording_info(recording_id)
        
        if not recording_info:
            abort(404)
        
        return render_template('screenshare/embed.html', recording=recording_info, recording_id=recording_id)
    
    @app.route('/screenshare/watch/<recording_id>')
    def watch_recording(recording_id):
        """Watch a recording (simplified video player)."""
        recording_info = screenpipe.get_recording_info(recording_id)
        
        if not recording_info:
            abort(404)
        
        return render_template('screenshare/watch.html', recording=recording_info, recording_id=recording_id)
    
    @app.route('/screenshare/download/<recording_id>')
    def download_recording(recording_id):
        """Download a recording."""
        file_path = screenpipe.get_recording_file(recording_id)
        
        if not file_path or not os.path.exists(file_path):
            abort(404)
        
        filename = f"gameplay_{recording_id}.webm"
        return send_file(file_path, as_attachment=True, download_name=filename)
    
    @app.route('/screenshare/video/<recording_id>')
    def serve_video(recording_id):
        """Serve a recording video file."""
        file_path = screenpipe.get_recording_file(recording_id)
        
        if not file_path or not os.path.exists(file_path):
            abort(404)
        
        return send_file(file_path, mimetype='video/webm')
    
    @app.route('/screenshare/list')
    def list_recordings():
        """List all recordings."""
        recordings = screenpipe.list_recordings()
        
        return jsonify({
            'success': True,
            'recordings': recordings
        })
    
    @app.route('/screenshare/delete/<recording_id>', methods=['POST'])
    def delete_recording(recording_id):
        """Delete a recording."""
        success = screenpipe.delete_recording(recording_id)
        
        return jsonify({
            'success': success,
            'message': 'Recording deleted' if success else 'Failed to delete recording'
        })
    
    @app.route('/screenshare/static/<path:filename>')
    def screenshare_static(filename):
        """Serve static files for screen recording."""
        return send_file(os.path.join(os.path.dirname(__file__), 'static', filename))
    
    @app.route('/screenshare')
    def screenshare_index():
        """Show screen recording management page."""
        recordings = screenpipe.list_recordings()
        
        return render_template('screenshare/index.html', recordings=recordings)