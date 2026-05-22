from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from httpx import AsyncClient

from domain.enums import ReviewDirection


@pytest.mark.asyncio
async def test_complete_service_lifecycle_e2e(client: AsyncClient):
    """
    E2E Test: Full Service Journey
    """
    # --- 1. SETUP ACTORS ---
    # Register Specialty
    specialty_name = f"Specialty_{uuid4()}"
    spec_res = await client.post(
        "/api/v1/specialties/",
        json={"name": specialty_name, "description": "Electrical repairs"},
    )
    assert spec_res.status_code == 201, spec_res.text
    specialty_id = spec_res.json()["data"]["id"]

    # Register Client
    client_email = f"client_{uuid4()}@example.com"
    client_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": client_email,
            "password": "Password123!",
            "full_name": "John Client",
            "phone": "11999999999",
        },
    )
    assert client_reg.status_code == 200, client_reg.text
    client_token = client_reg.json()["data"]["access_token"]
    client_headers = {"Authorization": f"Bearer {client_token}"}

    # Register Provider
    provider_email = f"provider_{uuid4()}@example.com"
    provider_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": provider_email,
            "password": "Password123!",
            "full_name": "Bob Provider",
            "phone": "11888888888",
        },
    )
    assert provider_reg.status_code == 200, provider_reg.text
    provider_token = provider_reg.json()["data"]["access_token"]
    provider_headers = {"Authorization": f"Bearer {provider_token}"}

    # Setup Provider Profile
    prof_res = await client.post(
        "/api/v1/providers/",
        headers=provider_headers,
        json={"bio": "Experienced electrician", "specialty_ids": [specialty_id]},
    )
    assert prof_res.status_code == 201, prof_res.text
    _ = prof_res.json()["data"]["id"]

    # Add Address for Client
    addr_res = await client.post(
        "/api/v1/addresses/",
        headers=client_headers,
        json={
            "label": "Home",
            "zip_code": "01234-567",
            "street": "Paulista Ave",
            "number": "1000",
            "neighborhood": "Bela Vista",
            "city": "Sao Paulo",
            "state": "SP",
            "is_default": True,
        },
    )
    assert addr_res.status_code == 201, addr_res.text
    address_id = addr_res.json()["data"]["id"]

    # --- 2. CREATE SERVICE ORDER ---
    os_res = await client.post(
        "/api/v1/orders",
        headers=client_headers,
        json={
            "title": "Shower Repair",
            "description": "Fixing the shower wiring",
            "specialty_id": specialty_id,
            "address_id": address_id,
            "preferred_date_start": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "preferred_date_end": (
                datetime.now(UTC) + timedelta(days=1, hours=2)
            ).isoformat(),
        },
    )
    assert os_res.status_code == 201, os_res.text
    os_id = os_res.json()["id"]
    assert os_res.json()["status"] == "AWAITING_CANDIDATES"

    # --- 3. APPLICATION ---
    app_res = await client.post(
        f"/api/v1/applications/{os_id}/apply", headers=provider_headers
    )
    assert app_res.status_code == 201, app_res.text
    application_id = app_res.json()["id"]

    # --- 4. SELECTION ---
    accept_res = await client.post(
        f"/api/v1/applications/{application_id}/accept", headers=client_headers
    )
    assert accept_res.status_code == 200, accept_res.text

    os_check = await client.get(f"/api/v1/orders/{os_id}", headers=client_headers)
    assert os_check.json()["status"] == "PROVIDER_SELECTED"

    # --- 5. SCHEDULING ---
    sched_date = (datetime.now(UTC) + timedelta(days=1, hours=1)).isoformat()
    sched_res = await client.post(
        f"/api/v1/scheduling/orders/{os_id}",
        headers=client_headers,
        json={
            "start_at": sched_date,
            "end_at": (datetime.now(UTC) + timedelta(days=1, hours=3)).isoformat(),
        },
    )
    assert sched_res.status_code == 201, sched_res.text

    # --- 6. EXECUTION ---
    await client.post(f"/api/v1/orders/{os_id}/start", headers=provider_headers)
    await client.post(f"/api/v1/orders/{os_id}/finish", headers=provider_headers)
    confirm_res = await client.post(
        f"/api/v1/orders/{os_id}/confirm", headers=client_headers
    )
    assert confirm_res.status_code == 200

    # --- 7. REVIEWS ---
    await client.post(
        f"/api/v1/orders/{os_id}/reviews",
        headers=client_headers,
        json={
            "rating": 5,
            "comment": "Perfect job!",
            "direction": ReviewDirection.CLIENT_TO_PROVIDER,
        },
    )

    prov_res = await client.get("/api/v1/providers/me", headers=provider_headers)
    assert prov_res.json()["data"]["rating_average"] == 5.0

    print("\nE2E Flow successfully completed!")
