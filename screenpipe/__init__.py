import os
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

if not os.path.exists(os.path.join(os.path.dirname(__file__), 'recordings')):
    os.makedirs(os.path.join(os.path.dirname(__file__), 'recordings'), exist_ok=True)

from . import screenpipe

__version__ = '0.1.0'