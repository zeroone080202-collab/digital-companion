"""Prototype guardrails, NOT a validated triage or scope classifier.

These conservative rules miss some emergencies and can over-trigger.
They must never label a patient safe, normal, or cleared of disease.
"""
import re
from app.schemas import MedicalAnswer, Paragraph

DISCLAIMER='\uc5f0\uad6c\u00b7\ud559\uc2b5\uc6a9 \uc815\ubcf4\uc785\ub2c8\ub2e4. \uc9c4\ub2e8, \ucc98\ubc29, \uc601\uc0c1 \ud310\ub3c5\uc744 \ub300\uccb4\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.'

MEDICAL_TERMS=[
 '\uc758\ud559','\uc758\ub8cc','\uc99d\uc0c1','\ud1b5\uc99d','\uc544\ud30c','\uc544\ud514','\uc544\ud508','\uac74\uac15','\ubcd1\uc6d0','\uc9c4\ub8cc','\uc9c4\ub2e8','\uac80\uc0ac','\uce58\ub8cc','\ud658\uc790','\ucc98\ubc29','\uc57d\ubb3c','\ubcf5\uc6a9',
 '\uace8\uc808','\ub2f9\ub1e8','\uace0\ud608\uc555','\uac10\uc5fc','\ub450\ud1b5','\ubc1c\uc5f4','\uc5fc\uc99d','\ud608\uc555','\ud608\ub2f9','\uc554','\ubc1c\ubaa9','\ubb34\ub98e','\ud53c\ubd80','\ub450\ub4dc\ub7ec\uae30','\ucc9c\uc2dd',
 '\uc228','\ud638\ud761','\uac00\uc2b4','\ubcf5\ud1b5','\uadfc\uc721','\uc720\uc804','\uc138\ud3ec','\ud574\ubd80','\uc218\uc220','\uc751\uae09','\uc784\uc2e0','\uc0dd\ub9ac','\uc18c\uc544','\ud608\uc561','\ud569\ubcd1','\uad00\uc808','\uc57d\uc740',
 '\uc5fc\uc88c','\uc99d\ud6c4','\ubcf4\ud5d8','\uae30\uce68','\uad6c\ud1a0','\uc124\uc0ac','\ucd9c\ud608','\uc758\uc2dd','\ud604\uae30','\uc5b4\uc9c0','\uc790\ud574','\uc790\uc0b4','\uc8fd\uace0','\uc6b0\uc6b8','\ubd88\uc548','\uc815\uc2e0','\uc790\uad81','\ud3d0\ub834',
 '인공심폐기','인공심폐','심폐우회','체외순환','의료기기','심장','폐','medical','health','symptom','pain','fracture','disease','diagnos','treatment','blood','drug','medicine','report','x-ray','xray','mri','ct','diabet','asthma','hypertension','anatomy','fever','cancer','injury','suicid']
UNRELATED=['게임','주식 추천','로또','포켓몬','연애소설','주가','날씨','여행 일정','선거','대통령','파이썬','코딩','프로그래밍','축구','야구','영화 추천','노래 추천','bitcoin','javascript game','travel itinerary']
GREETINGS=['\uc548\ub155','\uace0\ub9c8\uc6cc','\uac10\uc0ac','hello','hi','thanks','\ub124','\uc751']

EMERGENCY_PATTERNS=[
 r'\uc228\s*(?:\uc744\s*)?\ubabb\s*\uc26c', r'\ud638\ud761\s*(?:\uc774\s*)?\uc548\s*\ub3fc',
 r'\uc758\uc2dd\s*(?:\uc774\s*)?(?:\uc5c6|\uc783)',r'\ubc18\uc751\s*(?:\uc774\s*)?\uc5c6',
 r'\ud53c\s*(?:\uac00\s*)?\uba48\ucd94\uc9c0\s*\uc54a',r'\uc2ec\ud55c\s*\ud638\ud761\uace4\ub780',
 r"(?:can'?t|cannot)\s+breathe",r'unconscious',r'bleeding\s+(?:will not|won.t)\s+stop',
 r'\uc9c0\uae08.{0,20}(?:\uc790\uc0b4|\uc790\ud574)',r'\uc57d.{0,10}(?:\ud55c\uaebc\ubc88\uc5d0|\uacfc\ub2e4).{0,12}(?:\uba39|\ubcf5\uc6a9)']
NEGATION=r'(?:\uc544\ub2c8|\uc544\ub2cc|\uc544\ub2c8\uc5d0\uc694|\uc5c6\uc5b4|\uc5c6\uc2b5|\uc5c6\uc74c|\ud574\uc18c|\uc0ac\ub77c\uc84c)'


def emergency_signal(text: str) -> bool:
    low=text.lower()
    for pattern in EMERGENCY_PATTERNS:
        for m in re.finditer(pattern,low):
            before=low[max(0,m.start()-14):m.start()]
            after=low[m.end():m.end()+20]
            if re.search(r'(?:not |no |\uc544\ub2cc )$',before): continue
            if re.search(NEGATION,after): continue
            return True
    # Multiple symptoms in one present-tense utterance; no safety assurance on miss.
    chest=bool(re.search(r'\uac00\uc2b4.{0,8}(?:\uc544\ud504|\uc544\ud30c|\ud1b5\uc99d)|\ud749\ud1b5|chest pain',low))
    breath=bool(re.search(r'\uc228.{0,6}(?:\ucc28|\ucc2c)|\ud638\ud761\uace4\ub780|shortness of breath',low))
    if chest and breath and not re.search(NEGATION,low): return True
    return False


def is_medical(text: str, history=(), has_images=False) -> bool:
    """Broad medical-domain gate for a consumer-facing medical assistant.

    Uncommon medical terms should not be rejected merely because they are not
    present in a small whitelist. Clearly unrelated requests are still blocked.
    """
    low=(text or '').strip().lower()
    if has_images:
        return True
    if not low:
        return False
    if any(term in low for term in UNRELATED):
        return False
    if any((bool(re.search(r'\b'+re.escape(term)+r'\b',low)) if term in {'ct','mri'} else term in low) for term in MEDICAL_TERMS):
        return True
    if len(low)<24 and any(low.startswith(g) for g in GREETINGS):
        return True
    if len(low)<160 and any(any(t in m.content.lower() for t in MEDICAL_TERMS) for m in history if m.role=='user'):
        return True
    return len(low) >= 2


def fixed_answer(kind: str) -> MedicalAnswer:
    if kind=='emergency':
        return MedicalAnswer(in_scope=True,urgency='emergency',evidence_status='not_applicable',
          paragraphs=[Paragraph(heading='\uc9c0\uae08\uc740 \ub300\uba74 \ub3c4\uc6c0\uc774 \uc6b0\uc120\uc785\ub2c8\ub2e4',
           text='\uc785\ub825\ud558\uc2e0 \ub0b4\uc6a9\uc5d0 \uc751\uae09\uc0c1\ud669\uc744 \uc758\uc2ec\ud560 \uc218 \uc788\ub294 \ud45c\ud604\uc774 \uc788\uc2b5\ub2c8\ub2e4. \uc2e4\uc81c\ub85c \uc9c0\uae08 \uacaa\uace0 \uacc4\uc2e0 \uc0c1\ud669\uc774\ub77c\uba74 \ucc57\ubd07 \ub2f5\ubcc0\uc744 \uae30\ub2e4\ub9ac\uc9c0 \ub9d0\uace0 \ud55c\uad6d\uc5d0\uc11c\ub294 119, \ud574\uc678\uc5d0\uc11c\ub294 \ud604\uc9c0 \uc751\uae09\ubc88\ud638\ub85c \uc5f0\ub77d\ud558\uc138\uc694. \uac00\uae4c\uc774 \uc788\ub294 \uc0ac\ub78c\uc5d0\uac8c \ub3c4\uc6c0\uc744 \uc694\uccad\ud558\uace0, \uc0c1\ud669\uc2e4\uc758 \uc548\ub0b4\ub97c \ub530\ub974\uc138\uc694.',source_ids=[])],
          follow_up_questions=[],image_observations=[],limitations='\ubb38\uad6c \uae30\ubc18 \uc8fc\uc758 \uc548\ub0b4\uc774\uba70 \uc758\ub8cc\uc801 \uc911\uc99d\ub3c4 \ud310\uc815\uc774 \uc544\ub2d9\ub2c8\ub2e4. '+DISCLAIMER)
    if kind=='radiology':
        return MedicalAnswer(in_scope=True,urgency='unknown',evidence_status='insufficient',
          paragraphs=[Paragraph(heading='\uc601\uc0c1 \ud310\ub3c5 \ubaa8\ub378\uc740 \uc544\uc9c1 \uc5f0\uacb0\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4',
           text='\uc774 \uae30\ubc18 \ubc84\uc804\uc740 X-ray\u00b7CT\u00b7MRI\uc5d0\uc11c \uace8\uc808\uc774\ub098 \uc9c8\ud658\uc758 \uc720\ubb34\ub97c \ud310\uc815\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \uc5c5\ub85c\ub4dc \uc601\uc0c1\uc740 \ud310\ub3c5 API\ub85c \uc804\uc1a1\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4. \uc758\ub8cc\uc9c4\uc758 \ud310\ub3c5\ubb38\uc744 \uac1c\uc778\uc815\ubcf4 \uc5c6\uc774 \uc785\ub825\ud558\uba74 \uc6a9\uc5b4\uc640 \uc9c4\ub8cc \uc2dc \ubb3c\uc5b4\ubcfc \uc9c8\ubb38\uc744 \uc124\uba85\ud558\ub294 \ub370 \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',source_ids=[])],
          follow_up_questions=['\uc758\ub8cc\uc9c4\uc758 \ud310\ub3c5\ubb38\uc774 \uc788\ub098\uc694?'],image_observations=[],limitations=DISCLAIMER)
    return MedicalAnswer(in_scope=False,urgency='unknown',evidence_status='not_applicable',
      paragraphs=[Paragraph(heading='\uc758\ub8cc\u00b7\uac74\uac15 \uc9c0\uc2dd\uc744 \uc704\ud55c \ub300\ud654\uc785\ub2c8\ub2e4',
       text='\uc758\ud559 \uac1c\ub150, \uac80\uc0ac \uc6a9\uc5b4, \uc99d\uc0c1 \uc815\ub9ac, \uc9c4\ub8cc \uc804 \uc9c8\ubb38 \uc900\ube44\ub97c \ub3c4\uc640\ub4dc\ub9bd\ub2c8\ub2e4. \uc758\ub8cc\uc640 \uad00\uacc4\uc5c6\ub294 \uc694\uccad\uc740 \uc774 \ucc57\ubd07\uc5d0\uc11c \ub2e4\ub8e8\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.',source_ids=[])],follow_up_questions=[],image_observations=[],limitations=DISCLAIMER)
