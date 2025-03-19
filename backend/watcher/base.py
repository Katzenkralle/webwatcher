from abc import ABC, abstractmethod
import dataclasses
from enum import Enum

class ResultType(Enum):
    SUCCESS = "success"
    AUTH_ERROR = "auth_error"
    PREMISSION_ERROR = "premission_error"
    FAILURE = "failure"
    NETWORK_ERROR = "network_error"
    WARNING = "warning"
    OK = "ok"
    NOT_OK = "not_ok"
    UNHEALTHY = "unhealthy"
    TIMEOUT = "timeout"
    CATS_AND_DOGS = "cats_and_dogs"


class Watcher(ABC):
    """
    The base class for a watcher.
    """

    @abstractmethod
    def __init__(self, config: dict[str, any]):
        """
        Initializes the watcher with the configuration.
        The Configuration must match the schema returned by get_config_schema.

        :raises ValueError: If the configuration is invalid.

        :param config: The configuration for the watcher.
        :type config: dict[str, any]

        :return: None
        """
        pass

    @abstractmethod
    def run(self) -> JobEntry:
        """
        Executes the watcher and returns the context of the entries that have been changed.
        
        :return: A list of entries that have been changed.
        :rtype: list[dict[str, any]]
        """
        pass

    @abstractmethod
    def get_return_schema(self) -> dict[str, str] | None:
        """
        Returns the schema that the watcher will return the 'context' of a entry in.
        If none, the watcher may use a dynamic schema.

        :return: A dictionary of the schema, where the key is the field name and the value is the type.
        :rtype: dict[str, str] | None
        """
        pass

    @abstractmethod
    def get_config_schema(self) -> dict[str, str] | None:
        """
        Returns the schema that the watcher will use for the configuration.

        :return: A dictionary of the schema, where the key is the field name and the value is the type.
        :rtype: dict[str, str] | None
        """
        return None