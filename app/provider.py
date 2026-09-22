"""MEDI v0.4 provider compatibility shim.

The paid external LLM provider was intentionally removed. Text generation is
performed in the user's browser by static/local_ai.js using WebLLM/WebGPU.
This module remains only so old imports fail safely instead of making a network
request.
"""

class ProviderError(RuntimeError):
    def __init__(self, code: str, message: str):
        self.code = code
        super().__init__(message)


async def generate(*args, **kwargs):
    raise ProviderError(
        'external_ai_disabled',
        'MEDI v0.4 does not use a paid external AI API. Use the browser local AI flow.'
    )
