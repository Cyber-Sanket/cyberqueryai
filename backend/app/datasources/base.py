from abc import ABC, abstractmethod
from typing import Dict, Any, List

class DataSource(ABC):

    @abstractmethod
    def search(self, query_sql: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Executes a validated read-only query against the log store."""
        pass

    @abstractmethod
    def get_schema(self) -> Dict[str, Any]:
        """Returns the schema metadata for the data source."""
        pass

    @abstractmethod
    def validate_connection(self) -> bool:
        """Returns True if data source is available and operational."""
        pass

    @abstractmethod
    def get_capabilities(self) -> Dict[str, Any]:
        """Returns capabilities like supported operators, aggregations, max time range."""
        pass
