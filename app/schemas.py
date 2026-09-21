from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, model_validator

class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid')

class HistoryMessage(Strict):
    role: Literal['user', 'assistant']
    content: str = Field(min_length=1, max_length=6000)

class ImageInput(Strict):
    name: str = Field(default='image', max_length=160)
    data_url: str = Field(max_length=7_100_000)
    kind: Literal['report', 'photo', 'radiology']

class ChatRequest(Strict):
    request_id: UUID
    conversation_id: UUID | None = None
    message: str = Field(min_length=1, max_length=4000)
    history: list[HistoryMessage] = Field(default_factory=list, max_length=12)
    images: list[ImageInput] = Field(default_factory=list, max_length=2)
    mode: Literal['health', 'study'] = 'health'
    consent: bool = False

    @model_validator(mode='after')
    def validate_total(self):
        self.message = self.message.strip()
        if not self.message:
            raise ValueError('Message cannot be blank')
        if sum(len(m.content) for m in self.history) > 24000:
            raise ValueError('History too long; start a new conversation')
        return self

class Paragraph(Strict):
    heading: str
    text: str
    source_ids: list[str]

class MedicalAnswer(Strict):
    in_scope: bool
    urgency: Literal['emergency', 'medical_review', 'general_information', 'unknown']
    evidence_status: Literal['supported', 'partial', 'insufficient', 'not_applicable']
    paragraphs: list[Paragraph]
    follow_up_questions: list[str]
    image_observations: list[str]
    limitations: str

class Credentials(Strict):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=12, max_length=128)
    invite_code: str = Field(default='',max_length=200)
    terms_accepted: bool = False

class NewConversation(Strict):
    title: str = Field(default='New conversation',min_length=1,max_length=70)

class FeedbackRequest(Strict):
    turn_id: str = Field(min_length=36,max_length=36)
    question: str = Field(min_length=1,max_length=4000)
    answer: str = Field(min_length=1,max_length=16000)
    correction: str = Field(default='',max_length=4000)
    rating: Literal['helpful','needs_review']
    consent: bool = False
    deidentified_ack: bool = False

class DeleteAccount(Strict):
    confirm: Literal['DELETE MY ACCOUNT']
