import logging
from termcolor import colored


# The ColoredLogger class is a custom logging handler that extends the built-in StreamHandler.
# It overrides the emit method to add color to the output messages based on their logging level.
class ColoredLogger(logging.StreamHandler):

    # A dictionary mapping logging levels to their corresponding colors.
    COLORS = {
        logging.DEBUG: 'blue',
        logging.INFO: 'green',
        logging.WARNING: 'yellow',
        logging.ERROR: 'red',
        logging.CRITICAL: 'magenta',
    }

    # The emit method is overridden to add color to the output messages.
    # It first formats the record, then retrieves the color corresponding to the record's level,
    # and finally writes the colored message to the stream.
    def emit(self, record):
        try:
            message = self.format(record)
            color = self.COLORS.get(record.levelno)
            self.stream.write(colored(message, color) + self.terminator)
            self.flush()
        except Exception:
            self.handleError(record)


# The CustomLogger class is a wrapper around the built-in Logger class.
# It sets up a colored logger with a given application name.
class CustomLogger:
    default_format = "%(asctime)s: %(levelname)-8s- %(name)s - %(message)s"

    def __init__(self, application_name: str):
        """
        Initialize a new instance of the CustomLogger class.

        :param application_name: The name of the application. This will be used as the logger name.
        """
        # Get a logger with the given application name.
        self.logger = logging.getLogger(application_name)

        # Set up a colored logger handler and add it to the logger.
        handler = ColoredLogger()
        formatter = logging.Formatter(self.default_format)
        handler.setFormatter(formatter)
        self.logger.propagate = False
        self.logger.addHandler(handler)
    
    def update_format(self, new_format):
        """
        Update the format of the logger.
        """
        formatter = logging.Formatter(new_format)
        for handler in self.logger.handlers:
            handler.setFormatter(formatter)

    @staticmethod
    def set_default_log_opperation(level, dev=False):
        """
        Set the default logger style to colored.
        """
        if dev:
            CustomLogger.default_format = "%(asctime)s: %(levelname)-8s- %(name)s - %(module)s.%(funcName)s:%(lineno)d - %(message)s"
        else:
            CustomLogger.default_format = "%(asctime)s: %(levelname)-8s- %(name)s - %(message)s"

        internal_level = None
        match level:
            case "debug":
                internal_level = logging.DEBUG
            case "info":
                internal_level = logging.INFO
            case "warning":
                internal_level = logging.WARNING
            case "error":
                internal_level = logging.ERROR
            case "critical":
                internal_level = logging.CRITICAL
            case _:
                internal_level = logging.NOTSET   
    
        logging.basicConfig(level=internal_level, format=CustomLogger.default_format, handlers=[ColoredLogger()])
        LOGGER_INSTANCE.update_format(CustomLogger.default_format)

    @staticmethod
    def get_uvicorn_logging_config():
        """
        Get the logging configuration for Uvicorn.
        """
        return {
            "version": 1,
            "disable_existing_loggers": False,
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                },
            },
            "formatters": {
                "default": {
                    "format": CustomLogger.default_format,
                },
            }
        }

LOGGER_INSTANCE = CustomLogger("DEFAULT_API")


if __name__ == '__main__':
    log = CustomLogger('Test').logger
    log.setLevel(logging.DEBUG)
    log.debug('Debug message')
    log.info('Info message')
    log.warning('Warning message')
    log.error('Error message')
    log.critical('Critical message')
