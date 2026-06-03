from fastapi import APIRouter

router = APIRouter()


@router.get(
    "/health",
    summary="Perform a health check",
    response_description="Return HTTP Status Code 200 (OK)",
)
async def health_check():
    return {"status": "ok"}
