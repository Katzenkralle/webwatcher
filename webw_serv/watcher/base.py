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
        This method will becalled before get_return_schema() and run().

        :raises ValueError: If the configuration is invalid.

        :param config: The configuration for the watcher.
        :type config: dict[str, Any]

        :return: None
        """
        pass

    @abstractmethod
    def run(self) -> dict[str, Type[str | int | bool | float]]:
        """
        Executes the watcher and returns the gathered data as a dictionary.
        This method will be called regularly by the scheduler.
        
        :return: A list of entries that have been changed.
        :rtype: dict[str, Any]
        """
        pass

    @abstractmethod
    def get_return_schema(self) -> dict[str, Type[str | int | bool | float]] | None:
        """
        Returns the expected return schema of the run() method.
        This method will be called when a job is created or updated.

        :return: A dictionary of the schema, where the key is the field name and the value is the type.
        :rtype: dict[str, str] | None
        """
        pass

    @staticmethod
    @abstractmethod
    def get_config_schema() -> dict[str, Type[str | int | bool | float]] | None:
        """
        Returns the schema that the watcher will use for the config
        thus composing the parameters that can be set in the frontend
        when creating a job with this script.
        This method will be called when the script is uploaded.

        :return: A dictionary of the schema, where the key is the field name and the value is the type.
        :rtype: dict[str, str] | None
        """
        return None