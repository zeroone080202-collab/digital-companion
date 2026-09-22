"""MEDI runtime configuration.

Secrets stay in environment variables. The app can run with no paid AI key:
- Groq free-tier key (optional, recommended for reliable text generation)
- Gemini free-tier key (optional fallback)
- Browser WebGPU local model (fallback when no server provider is configured)
"""
from dataclasses import dataclass, field
from pathlib import Path
import os
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / '.env', override=False)


def flag(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {'1', 'true', 'yes', 'on'}


@dataclass(frozen=True)
class Settings:
    database: Path = field(default_factory=lambda: Path(os.getenv('KNOWLEDGE_DB', str(ROOT / 'data/knowledge.sqlite'))))
    deployment: str = field(default_factory=lambda: os.getenv('DEPLOYMENT_MODE', 'public' if os.getenv('RENDER') else 'local'))

    # Optional free text-generation providers. These are NOT OpenAI keys.
    ai_provider: str = field(default_factory=lambda: os.getenv('MEDI_AI_PROVIDER', 'auto').strip().lower())
    groq_api_key: str = field(default_factory=lambda: os.getenv('GROQ_API_KEY', '').strip())
    groq_model: str = field(default_factory=lambda: os.getenv('GROQ_MODEL', 'qwen/qwen3.8-27b').strip())
    gemini_api_key: str = field(default_factory=lambda: os.getenv('GEMINI_API_KEY', '').strip())
    gemini_model: str = field(default_factory=lambda: os.getenv('GEMINI_MODEL', 'gemini-2.5-flash-lite').strip())

    # Account/history storage.
    supabase_url: str = field(default_factory=lambda: os.getenv('SUPABASE_URL', '').rstrip('/'))
    supabase_key: str = field(default_factory=lambda: os.getenv('SUPABASE_ANON_KEY', ''))
    encryption_key: str = field(default_factory=lambda: os.getenv('DATA_ENCRYPTION_KEY', ''))
    invite_code: str = field(default_factory=lambda: os.getenv('SIGNUP_INVITE_CODE', ''))
    open_signup: bool = field(default_factory=lambda: flag('ALLOW_OPEN_SIGNUP', True))

    # Uploaded knowledge may only be exposed when the operator has verified rights.
    dataset_rights_confirmed: bool = field(default_factory=lambda: flag('DATASET_RIGHTS_CONFIRMED'))

    allowed_hosts: tuple[str, ...] = field(default_factory=lambda: tuple(
        h.strip() for h in os.getenv('ALLOWED_HOSTS', '127.0.0.1,localhost,testserver').split(',') if h.strip()
    ) + ((os.getenv('RENDER_EXTERNAL_HOSTNAME'),) if os.getenv('RENDER_EXTERNAL_HOSTNAME') else ()))
    operator_contact: str = field(default_factory=lambda: os.getenv('OPERATOR_CONTACT', ''))

    timeout: float = 75.0
    max_body_bytes: int = 15 * 1024 * 1024
    max_image_bytes: int = 5 * 1024 * 1024
    requests_per_minute: int = 8
    max_concurrency: int = 2
    guest_daily_limit: int = field(default_factory=lambda: max(1, min(50, int(os.getenv('GUEST_DAILY_LIMIT', '8')))))

    @property
    def has_accounts(self) -> bool:
        return bool(self.supabase_url and self.supabase_key and self.encryption_key)

    @property
    def public(self) -> bool:
        return self.deployment == 'public'

    @property
    def free_server_ai(self) -> str | None:
        """Return the configured free provider name, in preferred order."""
        if self.ai_provider == 'groq':
            return 'groq' if self.groq_api_key else None
        if self.ai_provider == 'gemini':
            return 'gemini' if self.gemini_api_key else None
        if self.ai_provider == 'browser':
            return None
        if self.ai_provider == 'auto':
            if self.groq_api_key:
                return 'groq'
            if self.gemini_api_key:
                return 'gemini'
            return None
        return None

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
