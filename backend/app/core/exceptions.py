from fastapi import Request
from fastapi.responses import JSONResponse

class InsightOrionException(Exception):
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500, context: dict = None):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.context = context or {}
        super().__init__(message)

class TenantValidationError(InsightOrionException):
    def __init__(self, message: str, context: dict = None):
        super().__init__(message, code="TENANT_VALIDATION_ERROR", status_code=400, context=context)

class UserValidationError(InsightOrionException):
    def __init__(self, message: str, context: dict = None):
        super().__init__(message, code="USER_VALIDATION_ERROR", status_code=400, context=context)

class PermissionDeniedError(InsightOrionException):
    def __init__(self, message: str, context: dict = None):
        super().__init__(message, code="PERMISSION_DENIED", status_code=403, context=context)

class ResourceNotFoundError(InsightOrionException):
    def __init__(self, message: str, context: dict = None):
        super().__init__(message, code="RESOURCE_NOT_FOUND", status_code=404, context=context)

class RAGProcessingError(InsightOrionException):
    def __init__(self, message: str, context: dict = None):
        super().__init__(message, code="RAG_PROCESSING_ERROR", status_code=500, context=context)

class TranscriptionError(InsightOrionException):
    def __init__(self, message: str, context: dict = None):
        super().__init__(message, code="TRANSCRIPTION_ERROR", status_code=500, context=context)

class IntegrationError(InsightOrionException):
    def __init__(self, message: str, context: dict = None):
        super().__init__(message, code="INTEGRATION_ERROR", status_code=502, context=context)


def register_exception_handlers(app):
    @app.exception_handler(InsightOrionException)
    async def insight_orion_exception_handler(request: Request, exc: InsightOrionException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.code,
                "message": exc.message,
                "context": exc.context
            }
        )
