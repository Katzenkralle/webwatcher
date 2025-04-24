from abc import ABC, abstractmethod

from typing_extensions import Any, Type


class Watcher(ABC):
    """
    The base class for a watcher.
    """
    supports_static_schema: bool

    @abstractmethod
    def __init__(self, config: dict[str, Any]):
        """
        Initializes the watcher with the configuration.
        The Configuration must match the schema returned by get_config_schema.

        :raises ValueError: If the configuration is invalid.

        :param config: The configuration for the watcher.
        :type config: dict[str, Any]

        :return: None
        """
        pass

    @abstractmethod
    def run(self) -> dict[str, Type[str | int | bool | float]]:
        """
        Executes the watcher and returns the context of the entries that have been changed.
        
        :return: A list of entries that have been changed.
        :rtype: dict[str, Any]
        """
        pass

    @abstractmethod
    def get_return_schema(self) -> dict[str, Type[str | int | bool | float]] | None:
        """
        Returns the schema that the watcher will return the 'context' of a entry in.
        If none, the watcher may use a dynamic schema.

        :return: A dictionary of the schema, where the key is the field name and the value is the type.
        :rtype: dict[str, str] | None
        """
        pass

    @staticmethod
    @abstractmethod
    def get_config_schema() -> dict[str, Type[str | int | bool | float]] | None:
        """
        Returns the schema that the watcher will use for the configuration.

        :return: A dictionary of the schema, where the key is the field name and the value is the type.
        :rtype: dict[str, str] | None
        """
        return None