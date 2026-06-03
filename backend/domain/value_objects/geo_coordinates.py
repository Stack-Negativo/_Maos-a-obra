from dataclasses import dataclass

from core.exceptions import ValidationException


@dataclass(frozen=True)
class GeoCoordinates:
    """
    Value Object representing geographical coordinates.
    """

    latitude: float
    longitude: float

    def __post_init__(self) -> None:
        if not (-90 <= self.latitude <= 90):
            raise ValidationException("Latitude deve estar entre -90 e 90")

        if not (-180 <= self.longitude <= 180):
            raise ValidationException("Longitude deve estar entre -180 e 180")

    def to_tuple(self) -> tuple[float, float]:
        return (self.latitude, self.longitude)

    def serialize(self) -> dict[str, float]:
        return {"latitude": self.latitude, "longitude": self.longitude}

    def distance_to(self, _other: "GeoCoordinates") -> float:
        """
        Calculates distance to another point.
        Implementation of Haversine formula can be added here in the future.
        """
        # Placeholder for future implementation
        return 0.0
