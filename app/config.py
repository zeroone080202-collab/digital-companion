"""MEDI runtime configuration.

All secrets stay in environment variables. MEDI can use Groq and/or Gemini free
API tiers and automatically fail over between them. Browser-local AI remains a
text-only last resort when no server provider is available.
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

    # Free AI providers. These are NOT OpenAI keys.
    ai_provider: str = field(default_factory=lambda: os.getenv('MEDI_AI_PROVIDER', 'auto').strip().lower())
    provider_failover: bool = field(default_factory=lambda: flag('MEDI_PROVIDER_FAILOVER', True))
    ai_request_retries: int = field(default_factory=lambda: integer('MEDI_AI_RETRIES', 2, 0, 3))

    groq_api_key: str = field(default_factory=lambda: os.getenv('GROQ_API_KEY', '').strip())
    groq_model: str = field(default_factory=lambda: os.getenv('GROQ_MODEL', 'qwen/qwen3.8-27b').strip())
    # Keep a dedicated vision model so text-model changes cannot silently break image input.
    groq_vision_model: str = field(default_factory=lambda: os.getenv('GROQ_VISION_MODEL', 'qwen/qwen3.8-27b').strip())

    gemini_api_key: str = field(default_factory=lambda: os.getenv('GEMINI_API_KEY', '').strip())
    gemini_model: str = field(default_factory=lambda: os.getenv('GEMINI_MODEL', 'gemini-2.5-flash-lite').strip())

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
        out: list[str] = []
        if self.groq_api_key:
            out.append('groq')
        if self.gemini_api_key:
            out.append('gemini')
        return tuple(out)

    @property
    def free_server_ai(self) -> str | None:
        if self.ai_provider == 'browser':
            return None
        if self.ai_provider == 'groq':
            return 'groq' if self.groq_api_key else None
        if self.ai_provider == 'gemini':
            return 'gemini' if self.gemini_api_key else None
        return self.configured_backends[0] if self.configured_backends else None

    @property
    def image_ai_available(self) -> bool:
        # Both configured providers support image input in MEDI's adapter.
        return bool(self.groq_api_key or self.gemini_api_key)

    def validate(self):
        if self.deployment not in {'local', 'public'}:
            raise RuntimeError('Invalid DEPLOYMENT_MODE')
        if self.ai_provider not in {'auto', 'groq', 'gemini', 'browser'}:
            raise RuntimeError('MEDI_AI_PROVIDER must be auto, groq, gemini, or browser')
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
