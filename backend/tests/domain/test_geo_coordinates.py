import pytest

from core.exceptions import ValidationException
from domain.value_objects.geo_coordinates import GeoCoordinates


def test_geo_valid():
    geo = GeoCoordinates(latitude=-23.5505, longitude=-46.6333)
    assert geo.latitude == -23.5505
    assert geo.longitude == -46.6333


def test_geo_invalid_latitude():
    with pytest.raises(ValidationException, match="Latitude deve estar entre -90 e 90"):
        GeoCoordinates(latitude=91, longitude=0)


def test_geo_invalid_longitude():
    with pytest.raises(
        ValidationException, match="Longitude deve estar entre -180 e 180"
    ):
        GeoCoordinates(latitude=0, longitude=181)


def test_geo_equality():
    g1 = GeoCoordinates(0, 0)
    g2 = GeoCoordinates(0.0, 0.0)
    assert g1 == g2


def test_geo_serialize():
    geo = GeoCoordinates(10.5, 20.5)
    assert geo.serialize() == {"latitude": 10.5, "longitude": 20.5}
