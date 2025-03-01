from .custom_logging import CustomLogger, LOGGER_INSTANCE
from .toolbox import *

DEFAULT_LOGGER = LOGGER_INSTANCE.logger

__all__ = ['CustomLogger', 'DEFAULT_LOGGER']
