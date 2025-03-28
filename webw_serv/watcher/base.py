from abc import ABC, abstractmethod

from typing_extensions import Any, Type

from webw_serv.API.gql_base_types import JobEntry


class Watcher(ABC):
    """
    The base class for a watcher.
    """

    @abstractmethod
    def __init__(self, config: dict[str, Any]):
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

    @staticmethod
    @abstractmethod
    def get_return_schema() -> dict[str, Type[str | int | bool]] | None:
        """
        Returns the schema that the watcher will return the 'context' of a entry in.
        If none, the watcher may use a dynamic schema.

        :return: A dictionary of the schema, where the key is the field name and the value is the type.
        :rtype: dict[str, str] | None
        """
        pass

    @staticmethod
    @abstractmethod
    def get_config_schema() -> dict[str, Type[str | int | bool]] | None:
        """
        Returns the schema that the watcher will use for the configuration.

        :return: A dictionary of the schema, where the key is the field name and the value is the type.
        :rtype: dict[str, str] | None
        """
        return None