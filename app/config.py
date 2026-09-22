"""Environment-only secrets. Public deployments fail closed without persistence."""
from dataclasses import dataclass, field
from pathlib import Path
import os
from dotenv import load_dotenv
ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / '.env', override=False)
def flag(name, default=False):
    return os.getenv(name, str(default)).lower() in {'1','true','yes'}
@dataclass(frozen=True)
class Settings:
    database: Path = field(default_factory=lambda: Path(os.getenv('KNOWLEDGE_DB', str(ROOT/'data/knowledge.sqlite'))))
    deployment: str = field(default_factory=lambda: os.getenv('DEPLOYMENT_MODE','public' if os.getenv('RENDER') else 'local'))
    supabase_url: str = field(default_factory=lambda: os.getenv('SUPABASE_URL','').rstrip('/'))
    supabase_key: str = field(default_factory=lambda: os.getenv('SUPABASE_ANON_KEY',''))
    encryption_key: str = field(default_factory=lambda: os.getenv('DATA_ENCRYPTION_KEY',''))
    invite_code: str = field(default_factory=lambda: os.getenv('SIGNUP_INVITE_CODE',''))
    open_signup: bool = field(default_factory=lambda: flag('ALLOW_OPEN_SIGNUP'))
    dataset_rights_confirmed: bool = field(default_factory=lambda: flag('DATASET_RIGHTS_CONFIRMED'))
    allowed_hosts: tuple[str,...] = field(default_factory=lambda: tuple(h.strip() for h in os.getenv('ALLOWED_HOSTS','127.0.0.1,localhost,testserver').split(',') if h.strip()) + ((os.getenv('RENDER_EXTERNAL_HOSTNAME'),) if os.getenv('RENDER_EXTERNAL_HOSTNAME') else ()))
    operator_contact: str = field(default_factory=lambda: os.getenv('OPERATOR_CONTACT',''))
    timeout: float = 75.0
    max_body_bytes: int = 15*1024*1024
    max_image_bytes: int = 5*1024*1024
    requests_per_minute: int = 8
    max_concurrency: int = 2
    guest_daily_limit: int = field(default_factory=lambda: max(1, min(50, int(os.getenv('GUEST_DAILY_LIMIT','5')))))
    @property
    def has_accounts(self): return bool(self.supabase_url and self.supabase_key and self.encryption_key)
    @property
    def public(self): return self.deployment=='public'
    def validate(self):
        if self.deployment not in {'local','public'}: raise RuntimeError('Invalid DEPLOYMENT_MODE')
        if os.getenv('RENDER') and not self.public:
            raise RuntimeError('Render must use DEPLOYMENT_MODE=public; anonymous local mode must not be exposed.')
        if self.public and not self.has_accounts:
            raise RuntimeError('Public mode requires SUPABASE_URL, SUPABASE_ANON_KEY and DATA_ENCRYPTION_KEY. See docs/RENDER_KO.md.')
        if self.has_accounts:
            from cryptography.fernet import Fernet
            Fernet(self.encryption_key.encode())
            if not self.supabase_url.startswith('https://'): raise RuntimeError('Supabase requires HTTPS')
settings=Settings()
