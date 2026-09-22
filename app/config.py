"""MEDI runtime configuration — Gemini free-tier focused build.

All secrets stay in environment variables. This build intentionally removes
OpenAI/Groq as required dependencies so the app can run with a single Gemini
API key from Google AI Studio.
"""
from dataclasses import dataclass, field
from pathlib import Path
import os
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / '.env', override=False)


def flag(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {'1', 'true', 'yes', 'on'}


def integer(name: str, default: int, low: int, high: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
    except ValueError:
        value = default
    return max(low, min(high, value))


@dataclass(frozen=True)
class Settings:
    database: Path = field(default_factory=lambda: Path(os.getenv('KNOWLEDGE_DB', str(ROOT / 'data/knowledge.sqlite'))))
    deployment: str = field(default_factory=lambda: os.getenv('DEPLOYMENT_MODE', 'public' if os.getenv('RENDER') else 'local'))

    # Gemini free API. Older values such as MEDI_AI_PROVIDER=auto are accepted
    # for compatibility and still resolve to Gemini when GEMINI_API_KEY exists.
    ai_provider: str = field(default_factory=lambda: os.getenv('MEDI_AI_PROVIDER', 'gemini').strip().lower())
    ai_request_retries: int = field(default_factory=lambda: integer('MEDI_AI_RETRIES', 2, 0, 3))
    gemini_api_key: str = field(default_factory=lambda: os.getenv('GEMINI_API_KEY', '').strip())
    gemini_model: str = field(default_factory=lambda: os.getenv('GEMINI_MODEL', 'gemini-2.5-flash').strip())

    # Account/history storage.
    supabase_url: str = field(default_factory=lambda: os.getenv('SUPABASE_URL', '').rstrip('/'))
    supabase_key: str = field(default_factory=lambda: os.getenv('SUPABASE_ANON_KEY', ''))
    encryption_key: str = field(default_factory=lambda: os.getenv('DATA_ENCRYPTION_KEY', ''))
    invite_code: str = field(default_factory=lambda: os.getenv('SIGNUP_INVITE_CODE', ''))
    open_signup: bool = field(default_factory=lambda: flag('ALLOW_OPEN_SIGNUP', True))

    dataset_rights_confirmed: bool = field(default_factory=lambda: flag('DATASET_RIGHTS_CONFIRMED'))

    allowed_hosts: tuple[str, ...] = field(default_factory=lambda: tuple(dict.fromkeys(
        [h.strip() for h in os.getenv(
            'ALLOWED_HOSTS',
            '127.0.0.1,localhost,testserver,*.onrender.com'
        ).split(',') if h.strip()]
        + ([os.getenv('RENDER_EXTERNAL_HOSTNAME', '').strip()] if os.getenv('RENDER_EXTERNAL_HOSTNAME', '').strip() else [])
    )))
    operator_contact: str = field(default_factory=lambda: os.getenv('OPERATOR_CONTACT', ''))

    timeout: float = field(default_factory=lambda: float(os.getenv('MEDI_AI_TIMEOUT', '90')))
    max_body_bytes: int = 15 * 1024 * 1024
    max_image_bytes: int = 5 * 1024 * 1024
    requests_per_minute: int = 8
    max_concurrency: int = 2
    guest_daily_limit: int = field(default_factory=lambda: integer('GUEST_DAILY_LIMIT', 8, 1, 50))

    @property
    def has_accounts(self) -> bool:
        return bool(self.supabase_url and self.supabase_key and self.encryption_key)

    @property
    def public(self) -> bool:
        return self.deployment == 'public'

    @property
    def configured_backends(self) -> tuple[str, ...]:
        return ('gemini',) if self.gemini_api_key else ()

    @property
    def provider_failover(self) -> bool:
        # Kept for compatibility with the frontend/config response. This build
        # intentionally uses Gemini only, so there is no second server provider.
        return False

    @property
    def free_server_ai(self) -> str | None:
        return 'gemini' if self.gemini_api_key and self.ai_provider != 'browser' else None

    @property
    def image_ai_available(self) -> bool:
        return bool(self.gemini_api_key and self.ai_provider != 'browser')

    def validate(self):
        if self.deployment not in {'local', 'public'}:
            raise RuntimeError('Invalid DEPLOYMENT_MODE')
        # Keep compatibility with older Render env values instead of crashing.
        if self.ai_provider not in {'auto', 'gemini', 'browser', 'groq'}:
            raise RuntimeError('MEDI_AI_PROVIDER must be gemini, auto, browser, or groq')
        if os.getenv('RENDER') and not self.public:
            raise RuntimeError('Render must use DEPLOYMENT_MODE=public; anonymous local mode must not be exposed.')
        if self.public and not self.has_accounts:
            raise RuntimeError('Public mode requires SUPABASE_URL, SUPABASE_ANON_KEY and DATA_ENCRYPTION_KEY.')
        if self.has_accounts:
            from cryptography.fernet import Fernet
            Fernet(self.encryption_key.encode())
            if not self.supabase_url.startswith('https://'):
                raise RuntimeError('Supabase requires HTTPS')


settings = Settings()
