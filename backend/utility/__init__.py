from backend.utility.custom_logging import CustomLogger, LOGGER_INSTANCE
from backend.utility.toolbox import extend_enum

DEFAULT_LOGGER = LOGGER_INSTANCE.logger

__all__ = ['CustomLogger', 'DEFAULT_LOGGER', 'extend_enum']
