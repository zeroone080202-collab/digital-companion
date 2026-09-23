'use strict';
const T={
 skip:'\uc9c8\ubb38 \uc785\ub825\uc73c\ub85c \uac74\ub108\ub6f0\uae30',newChat:'\uc0c8 \ub300\ud654',history:'\ub098\uc758 \ub300\ud654',loading:'\uc5f0\uacb0 \ud655\uc778 \uc911',knowledgeLabel:'\uc5f0\uacb0\ub41c \uc758\ud559\uc9c0\uc2dd',dataCaution:'\uc784\uc0c1 \uac80\ud1a0 \uc804 \uc5c5\ub85c\ub4dc \uc790\ub8cc',privacy:'\uac1c\uc778\uc815\ubcf4\uc640 \ud559\uc2b5 \uc548\ub0b4',localSession:'\uac8c\uc2a4\ud2b8 \uc0ac\uc6a9',temporary:'\ub85c\uadf8\uc778 \uc5c6\uc774 \ubc14\ub85c \uc0ac\uc6a9 \uac00\ub2a5',export:'\ub300\ud654 \ub0b4\ubcf4\ub0b4\uae30',welcomeTitle:'의료가 궁금할 때, 편하게 물어보세요.',welcomeDescription:'증상, 질병, 검사, 수술, 약, 의료기기까지 어려운 의학 내용을 쉽게 설명해드려요. 사진을 올리거나 붙여넣어 물어볼 수도 있어요.',cardKnowledge:'증상이 궁금할 때',cardKnowledgeDesc:'아픈 곳과 증상을 말하면 가능한 이유를 쉽게 정리',cardImage:'사진으로 물어보기',cardImageDesc:'검사 결과, 상처 사진, X-ray 등 이미지를 올려 질문',cardStudy:'의학용어 쉽게 알아보기',cardStudyDesc:'인공심폐기 같은 낯선 용어도 일상적인 말로 설명',welcomeNote:'\uc5f0\uad6c\u00b7\ud559\uc2b5\uc6a9 \ubca0\ud0c0\uc785\ub2c8\ub2e4. \uc9c4\ub2e8\uc774\ub098 \ucc98\ubc29\uc744 \uc81c\uacf5\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.',pending:'처리하고 있습니다.',questionLabel:'\uc758\ub8cc\u00b7\uac74\uac15 \uc9c8\ubb38',questionPlaceholder:'예: 인공심폐기가 뭐야? / 무릎이 아픈데 왜 그럴까? 사진은 붙여넣어도 돼요.',attach:'\uc774\ubbf8\uc9c0 \ucca8\ubd80 (JPG, PNG, WebP)',image:'\uc774\ubbf8\uc9c0',mode:'\ub300\ud654 \ubaa8\ub4dc',health:'\uac74\uac15\uc9c0\uc2dd',study:'\uc758\ud559 \ud559\uc2b5',send:'\ubcf4\ub0b4\uae30',stop:'\uc911\ub2e8',saveChat:'\uc774 \ub300\ud654\ub97c \ub0b4 \uacc4\uc815\uc5d0 \uc800\uc7a5',processingInfo:'안전·개인정보 안내',disclaimer:'MEDI\ub294 \uc9c4\ub2e8\u00b7\ucc98\ubc29\u00b7\uc601\uc0c1 \ud310\ub3c5\uc744 \ub300\uccb4\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \uc751\uae09\uc0c1\ud669\uc740 \ucc57\ubd07\uc774 \uc544\ub2cc 119\ub85c \uc5f0\ub77d\ud558\uc138\uc694.',close:'\ub2eb\uae30',consentTitle:'MEDI 이용 전 확인해주세요',consentBody:'질문과 최근 대화는 관련 의료자료를 찾기 위해 MEDI 서버로 전송됩니다. Gemini가 연결된 경우 질문·검색된 의료자료 일부와 첨부 이미지의 메타데이터를 제거한 사본이 답변 생성을 위해 Google Gemini API에 전송될 수 있습니다. 원본 이미지는 대화기록에 저장하지 않습니다.',consentPrivacy:'실명, 주민번호, 연락처, 병원 등록번호 등 개인을 식별할 수 있는 정보는 입력하지 마세요. 사진·검사결과지에도 이름, 환자번호, 생년월일 등이 보이지 않도록 가려주세요. 심한 흉통, 호흡곤란, 의식저하, 마비, 멈추지 않는 출혈 등 긴급한 증상은 MEDI 답변을 기다리지 말고 119 또는 응급의료기관을 이용하세요.',consentCheck:'안내 내용을 확인했습니다.',cancel:'\ucde8\uc18c',agree:'확인하고 계속',login:'\ub85c\uadf8\uc778',signup:'\ud68c\uc6d0\uac00\uc785',authDescription:'\ub85c\uadf8\uc778\ud558\uc9c0 \uc54a\uc544\ub3c4 \ubc14\ub85c \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \ud68c\uc6d0\uac00\uc785\u00b7\ub85c\uadf8\uc778\ud558\uba74 \uc800\uc7a5\uc744 \uc120\ud0dd\ud55c \ub300\ud654 \uae30\ub85d\uc744 \ub0b4 \uacc4\uc815\uc5d0 \ub0a8\uae38 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',email:'\uc774\uba54\uc77c',password:'\ube44\ubc00\ubc88\ud638 (5\uc790 \uc774\uc0c1)',invite:'\ucd08\ub300\ucf54\ub4dc (\uc6b4\uc601\uc790\uac00 \uc81c\ud55c\ud55c \uacbd\uc6b0\uc5d0\ub9cc)',terms:'\uc758\ub8cc \uc11c\ube44\uc2a4\uac00 \uc544\ub2cc \uc5f0\uad6c\uc6a9 \ub3c4\uad6c\uc784\uc744 \uc774\ud574\ud558\uba70, \ube44\uc2dd\ubcc4 \uc815\ubcf4\ub85c\ub9cc \uc2dc\ud5d8\ud569\ub2c8\ub2e4.',toSignup:'\uc544\uc9c1 \uacc4\uc815\uc774 \uc5c6\uc73c\uc2e0\uac00\uc694? \ud68c\uc6d0\uac00\uc785',toLogin:'\uc774\ubbf8 \uacc4\uc815\uc774 \uc788\uc73c\uc2e0\uac00\uc694? \ub85c\uadf8\uc778',feedbackTitle:'\ub354 \ub098\uc740 \ub2f5\ubcc0\uc744 \uc704\ud55c \ud53c\ub4dc\ubc31',feedbackDescription:'\ud53c\ub4dc\ubc31\uc740 \uc989\uc2dc \ud559\uc2b5\ub418\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \ub3d9\uc758\ud55c \ub0b4\uc6a9\ub9cc \uc6b4\uc601\uc790\uc758 \uac80\ud1a0 \ub300\uae30\uc5f4\uc5d0 \ubcf4\ub0b4\uba70, \uc758\ud559\u00b7\uac1c\uc778\uc815\ubcf4 \uac80\ud1a0 \ud6c4 \uc218\ub3d9\uc73c\ub85c \ubc18\uc601\ud569\ub2c8\ub2e4. \uc544\ub798 \ub0b4\uc6a9\uc5d0\uc11c \uac1c\uc778\uc815\ubcf4\ub97c \uc0ad\uc81c\ud558\uc138\uc694.',feedbackQuestion:'\uac80\ud1a0\uc6a9 \uc9c8\ubb38 (\uc218\uc815 \uac00\ub2a5)',feedbackAnswer:'\uac80\ud1a0\uc6a9 \ub2f5\ubcc0 (\uc218\uc815 \uac00\ub2a5)',correction:'\uc218\uc815 \uc758\uacac\u00b7\ucc38\uace0 \uadfc\uac70',rating:'\ud3c9\uac00',needsReview:'\uac80\ud1a0\uac00 \ud544\uc694\ud574\uc694',helpful:'\ub3c4\uc6c0\uc774 \ub410\uc5b4\uc694',feedbackConsent:'\uc704 \ud53c\ub4dc\ubc31\uc744 \uc6b4\uc601\uc790\uac00 \uc77d\uace0 \uc11c\ube44\uc2a4 \uac1c\uc120\uc5d0 \uac80\ud1a0\ud558\ub294 \ub370 \ubcc4\ub3c4\ub85c \ub3d9\uc758\ud569\ub2c8\ub2e4.',deidentified:'\uc9c8\ubb38\u00b7\ub2f5\ubcc0\u00b7\uc218\uc815 \uc758\uacac\uc5d0\uc11c \uc2dd\ubcc4 \uac00\ub2a5\ud55c \uac1c\uc778\uc815\ubcf4\ub97c \uc81c\uac70\ud588\uc2b5\ub2c8\ub2e4.',feedbackSend:'\uac80\ud1a0 \ub300\uae30\uc5f4\uc5d0 \ubcf4\ub0b4\uae30',promptKnowledge:'무릎이 아픈데 어떤 원인이 있을 수 있어?',promptStudy:'인공심폐기가 뭐야? 일반인이 이해하기 쉽게 설명해줘.',promptImage:'이 이미지에서 보이는 내용을 일반인이 이해하기 쉽게 설명해줘.',emptyHistory:'\uc800\uc7a5\ud55c \ub300\ud654\uac00 \uc5ec\uae30\uc5d0 \ud45c\uc2dc\ub429\ub2c8\ub2e4.',demo:'MEDI',connected:'MEDI 의료 AI',demoNotice:'MEDI는 연결된 의료지식 자료를 우선 활용합니다.',rightsNotice:'\uc790\ub8cc \uc774\uc6a9\uad8c\ud55c\uc744 \uc6b4\uc601\uc790\uac00 \ud655\uc778\ud558\uae30 \uc804\uae4c\uc9c0 \uc678\ubd80 \uc11c\ube44\uc2a4\uc5d0\uc11c\ub294 \uc790\ub8cc \uac80\uc0c9\uc774 \ube44\ud65c\uc131\ud654\ub429\ub2c8\ub2e4.',noAccounts:'\ub85c\uceec \uccb4\ud5d8\uc5d0\uc11c\ub294 \uacc4\uc815 \uc800\uc7a5\uc744 \uc0ac\uc6a9\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. Supabase\ub97c \uc5f0\uacb0\ud558\uba74 \ud68c\uc6d0 \uae30\ub2a5\uc744 \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',loginNeeded:'\ub300\ud654 \uc800\uc7a5 \uae30\ub2a5\uc740 \ub85c\uadf8\uc778 \ud6c4 \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',copy:'\ubcf5\uc0ac',copied:'\ub2f5\ubcc0\uc744 \ubcf5\uc0ac\ud588\uc2b5\ub2c8\ub2e4.',feedback:'\ud53c\ub4dc\ubc31',references:'\ucc38\uace0\ud55c \uc5c5\ub85c\ub4dc \uc790\ub8cc',referenceWarning:'\ucd9c\ucc98\uba85\u00b7\uc5f0\ub3c4\ub294 \ub370\uc774\ud130\uc14b \ud45c\uae30\uc785\ub2c8\ub2e4. \uc6d0\ubb38\u00b7\ucd5c\uc2e0\uc131\u00b7\uc758\ud559\uc801 \uc815\ud655\uc131\uc740 \ubcc4\ub3c4 \uac80\ud1a0\uac00 \ud544\uc694\ud569\ub2c8\ub2e4.',observations:'이미지에서 보이는 점',notSaved:'\uc800\uc7a5\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4. \uc774 \ub300\ud654\ub97c \ub0b4\ubcf4\ub0b8 \ub4a4 \uc774\ub3d9\ud574 \uc8fc\uc138\uc694.',imageLimit:'\uc774\ubbf8\uc9c0\ub294 \ud55c \ubc88\uc5d0 2\uc7a5, \uac01 5MB\uae4c\uc9c0\uc785\ub2c8\ub2e4.',imageType:'JPG, PNG, WebP \uc774\ubbf8\uc9c0\ub9cc \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',report:'\uac80\uc0ac\uc9c0\u00b7\ud310\ub3c5\ubb38',photo:'\ud53c\ubd80 \ub4f1 \uc678\ubd80 \uc0ac\uc9c4',radiology:'의료영상',delete:'\uc0ad\uc81c',logout:'\ub85c\uadf8\uc544\uc6c3',deleteAccount:'\uacc4\uc815\uacfc \uc800\uc7a5 \ub0b4\uc6a9 \uc0ad\uc81c',deleteConfirm:'\uc774 \ub300\ud654\ub97c \uc0ad\uc81c\ud560\uae4c\uc694? \ubcf5\uad6c\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.',accountConfirm:'\uacc4\uc815\u00b7\ub300\ud654\u00b7\ubcf4\uad00 \uc911\uc778 \ud53c\ub4dc\ubc31\uc744 \uc0ad\uc81c\ud569\ub2c8\ub2e4. \uacc4\uc18d\ud558\ub824\uba74 DELETE MY ACCOUNT\ub97c \uc785\ub825\ud558\uc138\uc694.',stopped:'처리를 중단했습니다.',unsavedConfirm:'\uc800\uc7a5\ub418\uc9c0 \uc54a\uc740 \ub300\ud654\uac00 \uc788\uc2b5\ub2c8\ub2e4. \ub0b4\ubcf4\ub0b4\uae30 \uc5c6\uc774 \uc774\ub3d9\ud560\uae4c\uc694?',checkEmail:'\uc778\uc99d \uba54\uc77c\uc744 \ud655\uc778\ud55c \ub4a4 \ub2e4\uc2dc \ub85c\uadf8\uc778\ud574 \uc8fc\uc138\uc694.',feedbackSuccess:'\uac80\ud1a0 \ub300\uae30\uc5f4\uc5d0 \uc800\uc7a5\ud588\uc2b5\ub2c8\ub2e4. \uc790\ub3d9\uc73c\ub85c \ud559\uc2b5\ub418\uc9c0\ub294 \uc54a\uc2b5\ub2c8\ub2e4.',feedbackLocal:'\ub85c\uceec \uac80\ud1a0 \ud6c4\ubcf4 \ud30c\uc77c\uc744 \ub9cc\ub4e4\uc5c8\uc2b5\ub2c8\ub2e4. \uc11c\ubc84\uc5d0\ub294 \ubcf4\ub0b4\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.',saved:'\uacc4\uc815\uc5d0 \uc800\uc7a5\ub428',temporaryChat:'\uc784\uc2dc \ub300\ud654',emptyExport:'\ub0b4\ubcf4\ub0bc \ub300\ud654\uac00 \uc544\uc9c1 \uc5c6\uc2b5\ub2c8\ub2e4.'
};
const ERR={login_required:T.loginNeeded,invalid_invite:'\ucd08\ub300\ucf54\ub4dc\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.',membership_required:'\ucc98\uc74c \ub85c\uadf8\uc778\ud560 \ub54c \uc720\ud6a8\ud55c \ucd08\ub300\ucf54\ub4dc\ub97c \uc785\ub825\ud574 \uc8fc\uc138\uc694.',rate_limited:'\uc694\uccad\uc774 \ub9ce\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.',daily_limit:'\uc624\ub298\uc758 \uc5f0\uad6c\uc6a9 AI \uc0ac\uc6a9 \ud55c\ub3c4\uc5d0 \ub3c4\ub2ec\ud588\uc2b5\ub2c8\ub2e4.',storage_limit:'\uc800\uc7a5 \ud55c\ub3c4\uc5d0 \ub3c4\ub2ec\ud588\uc2b5\ub2c8\ub2e4. \ubd88\ud544\uc694\ud55c \ub300\ud654\ub97c \uc0ad\uc81c\ud574 \uc8fc\uc138\uc694.',server_busy:'\uc11c\ubc84\uac00 \ub2e4\ub978 \uc694\uccad\uc744 \ucc98\ub9ac \uc911\uc785\ub2c8\ub2e4. \uc790\ub3d9 \uc7ac\uc804\uc1a1\ud558\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.',auth_failed_check_email_and_password:'\uc774\uba54\uc77c\u00b7\ube44\ubc00\ubc88\ud638\u00b7\uc774\uba54\uc77c \uc778\uc99d \uc5ec\ubd80\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.',cloud_unavailable:'\uacc4\uc815 \uc800\uc7a5\uc18c\uc5d0 \uc5f0\uacb0\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.',cloud_request_failed:'\uc800\uc7a5\uc18c \uc124\uc815\uc744 \uc6b4\uc601\uc790\uac00 \ud655\uc778\ud574\uc57c \ud569\ub2c8\ub2e4.',identifiers_detected:'\ud53c\ub4dc\ubc31\uc5d0 \uc5f0\ub77d\ucc98 \ub4f1 \uac1c\uc778\uc815\ubcf4\ub85c \ubcf4\uc774\ub294 \ubb38\uad6c\uac00 \uc788\uc2b5\ub2c8\ub2e4. \uc81c\uac70\ud574 \uc8fc\uc138\uc694.',invalid_image:'\uc774\ubbf8\uc9c0 \ud615\uc2dd\u00b7\ud06c\uae30\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694. 5MB, 1,200\ub9cc \ud654\uc18c \uc774\ud558\uc785\ub2c8\ub2e4.',conversation_full:'\uc774 \ub300\ud654\uac00 \uae38\uc5b4\uc838 \uc0c8 \ub300\ud654\ub97c \uc2dc\uc791\ud574\uc57c \ud569\ub2c8\ub2e4.',invalid_request:'\uc785\ub825 \ud56d\ubaa9\uc758 \ud615\uc2dd\uacfc \uae38\uc774\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.',request_in_progress:'\ub3d9\uc77c\ud55c \uc694\uccad\uc744 \uc774\ubbf8 \ucc98\ub9ac \uc911\uc785\ub2c8\ub2e4.',terms_required:'\uc5f0\uad6c\uc6a9 \uc774\uc6a9 \uc548\ub0b4\uc5d0 \ub3d9\uc758\ud574 \uc8fc\uc138\uc694.',gemini_not_configured:'Gemini 무료 API가 아직 연결되지 않았습니다. Render Environment에 GEMINI_API_KEY를 추가한 뒤 다시 배포해 주세요.',gemini_network:'Gemini 서버 연결이 잠시 불안정합니다. 잠시 후 다시 보내 주세요.',gemini_limit:'Gemini 무료 사용 한도에 잠시 도달했습니다. 한도가 풀린 뒤 다시 시도해 주세요.',gemini_key:'Gemini API 키가 올바르지 않거나 권한이 없습니다. AI Studio에서 새 API 키를 확인해 주세요.',gemini_model:'Gemini 모델 설정을 확인해 주세요. GEMINI_MODEL=gemini-2.5-flash를 권장합니다.',gemini_upstream:'Gemini가 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',gemini_output:'Gemini 답변을 MEDI 형식으로 변환하지 못했습니다. 같은 질문을 다시 보내 주세요.'};
function requestId(){
 if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
 const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
 const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
 return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
const $=id=>document.getElementById(id);
const state={config:null,user:null,cid:null,turns:[],images:[],busy:false,consent:false,pendingConsent:false,controller:null,signup:false,feedbackTurn:null,refresh:null,loadVersion:0};
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
for(const n of document.querySelectorAll('[data-i18n]'))n.textContent=T[n.dataset.i18n]||n.dataset.i18n;
for(const n of document.querySelectorAll('[data-placeholder]'))n.placeholder=T[n.dataset.placeholder];
for(const n of document.querySelectorAll('[data-title]'))n.title=T[n.dataset.title];
function prefGet(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
function prefSet(key,value){try{localStorage.setItem(key,value);}catch{}}
const appearance={theme:prefGet('medi-theme','system'),font:prefGet('medi-font-scale','1')};
const safetyNoticeEnabled=()=>prefGet('medi-safety-notice','show')!=='hide';
function safetySeenThisSession(){try{return sessionStorage.getItem('medi-safety-seen')==='1';}catch{return false;}}
function markSafetySeen(){try{sessionStorage.setItem('medi-safety-seen','1');}catch{}state.consent=true;}
function resetSafetySeen(){try{sessionStorage.removeItem('medi-safety-seen');}catch{}state.consent=false;}
state.consent=!safetyNoticeEnabled()||safetySeenThisSession();
function updateSafetySettings(){if($('safetyToggle'))$('safetyToggle').checked=safetyNoticeEnabled();if($('safetySettingText'))$('safetySettingText').textContent=safetyNoticeEnabled()?'첫 질문 전에 한 번 표시합니다.':'자동 안내를 표시하지 않습니다. 아래 버튼으로 언제든 다시 볼 수 있습니다.';}
function setPendingText(text){const n=$('pending')?.querySelector('span:last-child');if(n&&text)n.textContent=text;}
function updateLocalAIStatus(){if($('localAiCard'))$('localAiCard').hidden=true;}
function applyAppearance(){const dark=appearance.theme==='dark'||(appearance.theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.style.setProperty('--font-scale',appearance.font);}
applyAppearance();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(appearance.theme==='system')applyAppearance();});
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,6000);}
function failure(e){return e.name==='AbortError'?T.stopped:(ERR[e.code]||e.detail||'\uc694\uccad\uc744 \ucc98\ub9ac\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4. \uc5f0\uacb0 \uc0c1\ud0dc\uc640 \uc11c\ubc84 \uc124\uc815\uc744 \ud655\uc778\ud574 \uc8fc\uc138\uc694.');}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function api(path,options={},retry=true,networkAttempt=0){
 const method=options.method||'GET';const headers={'X-Medi-Client':'web',...(method!=='GET'?{'Content-Type':'application/json'}:{}),...options.headers};
 let r;
 try{
  r=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,headers});
 }catch(err){
  if(networkAttempt<2&&err?.name!=='AbortError'){
   if(state.busy)setPendingText(networkAttempt===0?'연결을 다시 확인하고 있습니다…':'서버에 다시 연결하고 있습니다…');
   await sleep(900*(networkAttempt+1));
   return api(path,options,retry,networkAttempt+1);
  }
  throw Object.assign(err||new Error('network'),{code:err?.name==='AbortError'?'aborted':'network'});
 }
 if([502,503,504].includes(r.status)&&networkAttempt<2){
  if(state.busy)setPendingText('서버가 깨어나는 중입니다. 잠시만 기다려 주세요…');
  await sleep(1200*(networkAttempt+1));
  return api(path,options,retry,networkAttempt+1);
 }
 if(r.status===401&&retry&&!path.startsWith('/api/auth/')){
  if(!state.refresh)state.refresh=api('/api/auth/refresh',{method:'POST',body:'{}'},false).finally(()=>state.refresh=null);
  await state.refresh;return api(path,options,false,networkAttempt);
 }
 let data;try{data=await r.json();}catch{throw Object.assign(new Error('Invalid server response'),{code:'network',status:r.status});}
 if(!r.ok)throw Object.assign(new Error(data.error||'network'),{code:data.error,detail:data.detail,status:r.status});return data;
}
async function keepSessionWarm(){
 if(document.hidden||!navigator.onLine)return;
 try{await fetch('/healthz',{cache:'no-store',credentials:'same-origin'});}catch{}
}
setInterval(keepSessionWarm,4*60*1000);
window.addEventListener('online',keepSessionWarm);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)keepSessionWarm();});
function closeMenu(){$('sidebar').classList.remove('open');$('shade').hidden=true;}
$('menuButton').onclick=()=>{$('sidebar').classList.toggle('open');$('shade').hidden=!$('sidebar').classList.contains('open');};$('shade').onclick=closeMenu;
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();
for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
function showInfo(title,fill){$('infoTitle').textContent=title;$('infoBody').replaceChildren();fill($('infoBody'));$('infoDialog').showModal();}
function para(root,text,cls=''){root.append(el('p',cls,text));}
function stat(root,label,value){const row=el('div','stat-row');row.append(el('span','',label),el('span','',value));root.append(row);}
function statusUI(){
 const c=state.config;if(!c)return;
 if(c.ai_connected){
  $('connection').textContent='MEDI 의료 AI';
  $('connection').title='Gemini 무료 API · '+(c.ai_model||'');
 }else{
  $('connection').textContent='Gemini 연결 필요';
  $('connection').title='Render에 GEMINI_API_KEY를 추가하면 새 답변과 이미지 분석이 활성화됩니다.';
 }
 $('docCount').textContent=(c.knowledge.documents||0).toLocaleString()+'건';
 $('chunkCount').textContent=(c.knowledge.chunks||0).toLocaleString()+'개 검색 조각';
 const notes=[];
 if(!c.knowledge_enabled)notes.push('업로드한 MEDI 의료자료 검색이 현재 비활성화되어 있습니다. 자료 이용권한을 확인한 경우 Render의 DATASET_RIGHTS_CONFIRMED=true로 설정해야 의료자료가 답변에 사용됩니다.');
 $('systemNotice').textContent=notes.join(' ');$('systemNotice').hidden=!notes.length;
 if($('serverAiStatus')){
  if(c.ai_connected){
   const names=(c.ai_backends||[]).map(x=>x==='gemini'?'Gemini':x);
   const backup=names.length>1?' · 자동 예비 연결 '+names.slice(1).join(', '):'';
   const n=c.ai_backend==='gemini'?'Gemini 무료 서버 AI':'무료 서버 AI';
   $('serverAiStatus').textContent=`${n} 연결 설정됨 · ${c.ai_model||''}${backup}`;
  }else $('serverAiStatus').textContent='Gemini 무료 AI 미연결 · Render에 GEMINI_API_KEY를 추가하면 PC·휴대폰에서 답변과 이미지 분석이 가능합니다.';
 }
 if($('knowledgeStatus'))$('knowledgeStatus').textContent=c.knowledge_enabled?`MEDI 의료자료 활성 · ${(c.knowledge.documents||0).toLocaleString()}건`:'MEDI 의료자료 비활성 · DATASET_RIGHTS_CONFIRMED 확인 필요';
 if($('localAiCard'))$('localAiCard').hidden=true;
 $('accountName').textContent=state.user?.email||(c.accounts?T.login:T.localSession);$('accountState').textContent=state.user?T.saved:T.temporary;
 $('saveChat').disabled=!c.accounts||!state.user||state.busy||!!state.cid;
 if(!c.accounts||!state.user)$('saveChat').checked=false;
 $('inviteField').hidden=!c.invite_required;
 updateLocalAIStatus();updateSafetySettings();
}
async function historyList(){
 $('conversationList').replaceChildren();if(!state.config?.accounts||!state.user){$('conversationList').append(el('p','conversation-empty',T.emptyHistory));return;}
 try{const data=await api('/api/conversations');for(const c of data.conversations){const row=el('div','conversation-row'+(c.id===state.cid?' active':''));const open=el('button','conversation-open',c.title);open.title=c.title;open.onclick=()=>loadConversation(c.id);const del=el('button','conversation-delete','\u00d7');del.title=T.delete;del.setAttribute('aria-label',T.delete+' '+c.title);del.onclick=async()=>{if(state.busy)return;if(!confirm(T.deleteConfirm))return;try{await api('/api/conversations/'+c.id,{method:'DELETE'});if(state.cid===c.id)newChat(true);await historyList();}catch(e){toast(failure(e));}};row.append(open,del);$('conversationList').append(row);}if(!data.conversations.length)$('conversationList').append(el('p','conversation-empty',T.emptyHistory));}catch(e){toast(failure(e));}
}
function hasUnsaved(){return state.turns.some(t=>t.response&&!t.response.saved);}
function clearImages(){state.images=[];renderAttachments();$('fileInput').value='';}
function newChat(force=false){if(state.busy)return;if(!force&&hasUnsaved()&&!confirm(T.unsavedConfirm))return;state.loadVersion++;state.cid=null;state.turns=[];$('messages').replaceChildren();$('welcome').hidden=false;$('question').value='';updateInput();clearImages();$('saveChat').checked=false;statusUI();historyList();closeMenu();$('question').focus();}
$('newChat').onclick=()=>newChat();
async function loadConversation(cid){if(state.busy)return;if(hasUnsaved()&&!confirm(T.unsavedConfirm))return;const version=++state.loadVersion;try{const r=await api('/api/conversations/'+cid);if(version!==state.loadVersion)return;state.cid=cid;state.turns=r.turns;$('messages').replaceChildren();$('welcome').hidden=state.turns.length>0;for(const t of state.turns)renderTurn(t);$('saveChat').checked=true;clearImages();statusUI();historyList();closeMenu();scrollBottom();}catch(e){toast(failure(e));}}
function updateInput(){$('charCount').textContent=$('question').value.length+' / 4000';$('question').style.height='auto';$('question').style.height=Math.min(120,Math.max(52,$('question').scrollHeight))+'px';}
$('question').addEventListener('input',updateInput);
$('question').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&window.innerWidth>540){e.preventDefault();$('chatForm').requestSubmit();}});
for(const b of document.querySelectorAll('[data-prompt]'))b.onclick=()=>{if(state.busy)return;$('question').value=T[b.dataset.prompt];updateInput();$('question').focus();};
$('welcomeImage').onclick=()=>{$('question').value=T.promptImage;updateInput();$('fileInput').click();};$('attachButton').onclick=()=>$('fileInput').click();
async function addImageFiles(files,label='이미지'){
 for(const f of files){
  if(state.images.length>=2){toast(T.imageLimit);break;}
  if(f.size>5*1024*1024){toast(T.imageLimit);continue;}
  if(!['image/jpeg','image/png','image/webp'].includes(f.type)){toast(T.imageType);continue;}
  try{
   const url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f);});
   state.images.push({name:(f.name||label).slice(0,160),data_url:url,kind:'photo'});
  }catch{toast(T.imageType);}
 }
 renderAttachments();
}
$('fileInput').onchange=async e=>{await addImageFiles([...e.target.files]);e.target.value='';};
$('question').addEventListener('paste',async e=>{
 const files=[...(e.clipboardData?.items||[])].filter(x=>x.kind==='file'&&x.type.startsWith('image/')).map(x=>x.getAsFile()).filter(Boolean);
 if(!files.length)return;
 e.preventDefault();
 await addImageFiles(files,'붙여넣은 이미지');
 toast('이미지를 붙여넣었습니다. 바로 질문하거나 이미지만 보내도 됩니다.');
});
function renderAttachments(){$('attachments').replaceChildren();state.images.forEach((im,i)=>{const card=el('div','attachment'),img=el('img');img.src=im.data_url;img.alt=T.image;const inf=el('div','attachment-info');inf.append(el('span','attachment-name',im.name),el('small','attachment-kind','첨부 이미지'));const del=el('button','','\u00d7');del.type='button';del.setAttribute('aria-label',T.delete+' '+im.name);del.onclick=()=>{state.images.splice(i,1);renderAttachments();};card.append(img,inf,del);$('attachments').append(card);});}
function setBusy(b){state.busy=b;$('pending').hidden=!b;$('sendButton').hidden=b;$('stopButton').hidden=!b;for(const id of ['question','mode','attachButton','newChat','welcomeImage'])$(id).disabled=b;statusUI();}
function scrollBottom(){requestAnimationFrame(()=>$('scrollArea').scrollTo({top:$('scrollArea').scrollHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));}
function answerText(a){return a.paragraphs.map(p=>(p.heading?p.heading+'\n':'')+p.text).join('\n\n')+(a.image_observations.length?'\n\n'+a.image_observations.join('\n'):'')+'\n\n'+a.limitations;}
const VISUAL_AIDS=[
 {keys:['인공심폐기','인공심폐','심폐우회','체외순환','heart-lung','cardiopulmonary bypass'],src:'/static/visuals/heart_lung_machine.svg',title:'인공심폐기는 이렇게 도와줘요',caption:'심장수술 중 혈액이 저장통·펌프·산화기를 거쳐 다시 몸으로 돌아오는 흐름을 표시했어요.'},
 {keys:['무릎','슬관절','슬개','반월상','십자인대','knee'],src:'/static/visuals/knee_detail.png',title:'무릎은 이런 구조예요',caption:'대퇴골·정강뼈·무릎뼈·연골·반월상연골·십자인대의 위치를 함께 표시했어요.'},
 {keys:['고혈압','저혈압','혈압','blood pressure'],src:'/static/visuals/blood_pressure.svg',title:'혈압은 이런 뜻이에요',caption:'혈관 안의 압력과 수축기·이완기 숫자가 무엇을 뜻하는지 함께 보여줘요.'},
 {keys:['당뇨','혈당','인슐린','diabetes','glucose'],src:'/static/visuals/diabetes.svg',title:'혈당과 인슐린의 관계',caption:'혈액 속 포도당, 췌장, 인슐린, 세포가 어떻게 연결되는지 보여줘요.'},
 {keys:['천식','폐렴','호흡','기관지','기침','폐','lung','asthma'],src:'/static/visuals/lungs.svg',title:'폐와 기도는 이렇게 이어져요',caption:'기관·기관지·좌우 폐와 폐포까지 공기가 이동하는 길을 표시했어요.'},
 {keys:['상처','피부','발진','봉합','찰과상','화상','염증','wound','rash'],src:'/static/visuals/wound.svg',title:'상처는 겉모습 변화도 중요해요',caption:'피부 단면과 함께 붉음·붓기·열감·분비물 같은 변화 포인트를 표시했어요.'},
 {keys:['복통','위염','소화','위','장','stomach','digest'],src:'/static/visuals/stomach.svg',title:'소화기관은 이렇게 이어져요',caption:'식도에서 위·십이지장·장으로 이어지는 소화기관의 흐름을 보여줘요.'},
 {keys:['허리','척추','디스크','목 통증','요추','경추','spine'],src:'/static/visuals/spine.svg',title:'척추는 몸의 중심을 지지해요',caption:'척추뼈·디스크·신경뿌리의 위치와 신경 증상이 생길 수 있는 이유를 보여줘요.'},
 {keys:['뇌','두통','뇌졸중','마비','신경','brain'],src:'/static/visuals/brain.svg',title:'뇌는 몸의 여러 기능을 조절해요',caption:'뇌의 주요 영역과 갑작스러운 신경 증상에서 확인할 점을 함께 표시했어요.'},
 {keys:['약','복용','처방','알약','캡슐','medicine','drug'],src:'/static/visuals/medicine.svg',title:'약은 복용정보 확인이 중요해요',caption:'약 봉투나 처방전 사진에서 이름·용량·횟수·시간을 어디서 확인하는지 보여줘요.'},
 {keys:['심장','심근','협심','심부전','부정맥','맥박','heart'],src:'/static/visuals/heart.svg',title:'심장은 혈액을 보내는 펌프예요',caption:'심장의 네 방과 폐·온몸으로 혈액이 이동하는 기본 흐름을 표시했어요.'}
];
const VISUAL_SKIP_TERMS=['고소','소송','합의','손해배상','배상','법률','법적','과실','보험금','보험처리','진단서 발급'];
function pickVisualAid(question,answer,hadImages){
 if(hadImages)return null;
 const text=(question||'').trim().toLowerCase();
 if(!text||text.length<3||VISUAL_SKIP_TERMS.some(k=>text.includes(k)))return null;
 // A diagram is supplemental, never automatic decoration. Show one only when
 // the user explicitly asks to see/understand structure, location, flow or a diagram.
 const visualIntent=['그림','도식','구조','위치','해부','생김새','어떻게 생','흐름','작동 원리','원리 그림','그려','보여줘','어디에'];
 if(!visualIntent.some(k=>text.includes(k)))return null;
 for(const item of VISUAL_AIDS){if(item.keys.some(k=>text.includes(k.toLowerCase())))return item;}
 return null;
}
function makeVisualAid(item){
 const fig=el('figure','medi-visual');
 const img=el('img');img.src=item.src;img.alt=item.title;img.loading='lazy';img.decoding='async';
 img.tabIndex=0;img.title='그림 크게 보기';
 const enlarge=()=>showInfo(item.title,b=>{const big=el('img','visual-dialog-image');big.src=item.src;big.alt=item.title;b.append(big);para(b,item.caption,'subtle');});
 img.onclick=enlarge;img.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();enlarge();}};
 const cap=el('figcaption','');cap.append(el('strong','',item.title),el('span','',item.caption),el('small','','교육용으로 구조와 흐름을 단순화한 그림 · 그림을 누르면 크게 볼 수 있어요'));
 fig.append(img,cap);return fig;
}

function retryImageTurn(t){
 if(state.busy||!t?.previewImages?.length)return;
 state.images=t.previewImages.map((src,i)=>({name:'다시 분석 이미지 '+(i+1),data_url:src,kind:'photo'}));
 renderAttachments();
 $('question').value=t.question||'이 이미지를 다시 분석해줘.';
 updateInput();
 $('question').focus();
 scrollBottom();
 toast('같은 이미지와 질문을 다시 준비했습니다. 전송하면 재분석합니다.');
}
function renderTurn(t){
 const turn=el('article','turn');turn.dataset.id=t.id;turn.append(el('div','user-message',t.question));if(t.previewImages?.length){const imgs=el('div','user-images');for(const src of t.previewImages){const img=el('img');img.src=src;img.alt=T.image;imgs.append(img);}turn.append(imgs);}if(t.had_images&&!t.previewImages?.length)turn.append(el('p','source-meta','\uc774\ubbf8\uc9c0 \ucca8\ubd80 \uc774\ub825\uc774 \uc788\uc2b5\ub2c8\ub2e4. \uc6d0\ubcf8\uc740 \uc800\uc7a5\ud558\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.'));
 if(t.response){const r=t.response,a=r.answer,assistant=el('div','assistant-message'),label=el('div','assistant-label'),mark=el('img');mark.src='/static/mark.svg';mark.alt='';label.append(mark,el('span','','MEDI'));
 if(a.urgency==='emergency')label.append(el('span','evidence-badge emergency','즉시 도움 안내'));
 assistant.append(label);
 const visual=pickVisualAid(t.question,a,t.had_images);
 a.paragraphs.forEach((p,index)=>{const block=el('div','answer-paragraph'+(index===0?' answer-summary':''));if(p.heading)block.append(el('h3','',p.heading));block.append(el('p','',p.text));assistant.append(block);if(index===0&&visual)assistant.append(makeVisualAid(visual));});
 if(a.image_observations.length){
  const obs=el('div',r.image_analysis_ok?'answer-paragraph image-analysis-ok':'answer-paragraph image-analysis-warning');
  obs.append(el('h3','',r.image_analysis_ok?T.observations:'이미지 분석 연결 안내'),el('p','',a.image_observations.join('\n')));
  if(t.had_images&&!r.image_analysis_ok&&r.retryable&&t.previewImages?.length){const retry=el('button','retry-analysis','이미지 다시 분석');retry.type='button';retry.onclick=()=>retryImageTurn(t);obs.append(retry);}
  assistant.append(obs);
 }
 if(t.had_images&&!r.image_analysis_ok&&r.retryable&&!a.image_observations.length&&t.previewImages?.length){const retryBox=el('div','answer-paragraph image-analysis-warning');retryBox.append(el('h3','','이미지 분석 연결 안내'),el('p','','이미지 분석 연결이 일시적으로 실패했습니다. 같은 사진으로 다시 시도할 수 있어요.'));const retry=el('button','retry-analysis','이미지 다시 분석');retry.type='button';retry.onclick=()=>retryImageTurn(t);retryBox.append(retry);assistant.append(retryBox);}
 if(r.sources.length){const sources=el('details','source-list');sources.append(el('summary','','답변에 참고한 MEDI 자료 '+r.sources.length+'개'));for(const s of r.sources){const item=el('details','source-item');item.dataset.source=s.id;item.append(el('summary','',s.id+'  '+s.title),el('p','source-meta',(s.source_label||'\uc5c5\ub85c\ub4dc \uc790\ub8cc')+' \u00b7 '+(s.year||'\uc5f0\ub3c4 \ubbf8\uc0c1')+' \u00b7 '+(s.source_type==='qa'?'\ud559\uc2b5 \ubb38\ud56d':'\ucc38\uace0 \ubb38\uc11c')),el('p','excerpt',s.excerpt));sources.append(item);}sources.append(el('p','source-warning',T.referenceWarning));assistant.append(sources);}
 if(a.follow_up_questions.length){const fs=el('div','followups');for(const q of a.follow_up_questions){const b=el('button','followup',q);b.onclick=()=>{if(!state.busy){$('question').value=q;updateInput();$('question').focus();}};fs.append(b);}assistant.append(fs);}assistant.append(el('p','answer-limits',a.limitations));
 const actions=el('div','turn-actions');const copy=el('button','turn-action',T.copy);copy.onclick=async()=>{try{await navigator.clipboard.writeText(answerText(a));toast(T.copied);}catch{toast('Clipboard is unavailable.');}};actions.append(copy);if(state.user){const fb=el('button','turn-action',T.feedback);fb.onclick=()=>openFeedback(t);actions.append(fb);}assistant.append(actions);if(r.save_warning)assistant.append(el('p','inline-error',T.notSaved));turn.append(assistant);
 }else if(t.error){turn.append(el('p','inline-error',t.error));}
 const old=[...$('messages').children].find(x=>x.dataset.id===t.id);if(old)old.replaceWith(turn);else $('messages').append(turn);
}
function askConsent(sendAfter=false){state.pendingConsent=sendAfter;$('consentDialog').showModal();}
$('settingsButton').onclick=()=>{$('themeSelect').value=appearance.theme;$('fontScale').value=appearance.font;updateSafetySettings();updateLocalAIStatus();$('settingsDialog').showModal();};
$('themeSelect').onchange=()=>{appearance.theme=$('themeSelect').value;prefSet('medi-theme',appearance.theme);applyAppearance();};
$('fontScale').onchange=()=>{appearance.font=$('fontScale').value;prefSet('medi-font-scale',appearance.font);applyAppearance();};
$('consentButton').onclick=()=>askConsent(false);
$('acceptConsent').onclick=()=>{markSafetySeen();$('consentDialog').close();if(state.pendingConsent){state.pendingConsent=false;$('chatForm').requestSubmit();}};
$('neverConsent').onclick=()=>{prefSet('medi-safety-notice','hide');markSafetySeen();updateSafetySettings();$('consentDialog').close();if(state.pendingConsent){state.pendingConsent=false;$('chatForm').requestSubmit();}};
$('safetyToggle').onchange=()=>{if($('safetyToggle').checked){try{localStorage.removeItem('medi-safety-notice');}catch{}resetSafetySeen();}else{prefSet('medi-safety-notice','hide');markSafetySeen();}updateSafetySettings();};
$('showSafetyNow').onclick=()=>{state.pendingConsent=false;$('consentDialog').showModal();};
$('saveChat').onchange=()=>{if($('saveChat').checked&&!state.user){$('saveChat').checked=false;openAuth();}};
$('chatForm').onsubmit=async e=>{
 e.preventDefault();if(state.busy||!state.config)return;const typed=$('question').value.trim();if(!typed&&!state.images.length){$('question').focus();return;}const question=typed||'첨부한 이미지를 일반인이 이해하기 쉽게 설명해줘.';if(!state.consent){askConsent(true);return;}
 const id=requestId(),images=state.images.map(i=>({...i}));const t={id,question,had_images:!!images.length,mode:'health',previewImages:images.map(i=>i.data_url)};let mounted=false;setBusy(true);state.controller=new AbortController();
 const timer=setTimeout(()=>state.controller?.abort(),100000);
 try{
  if($('saveChat').checked&&!state.cid){const c=await api('/api/conversations',{method:'POST',body:JSON.stringify({title:(typed||'이미지 질문').slice(0,70)})});state.cid=c.id;}
  const history=state.turns.filter(x=>x.response).slice(-4).flatMap(x=>[{role:'user',content:x.question.slice(0,1600)},{role:'assistant',content:answerText(x.response.answer).slice(0,2200)}]);
  state.turns.push(t);mounted=true;$('welcome').hidden=true;renderTurn(t);scrollBottom();setPendingText('관련 의료자료를 찾고 있습니다…');
  const r=await api('/api/chat',{method:'POST',body:JSON.stringify({request_id:id,conversation_id:state.cid,message:question,history:state.cid?[]:history,images,mode:t.mode,consent:true}),signal:state.controller.signal});
  clearTimeout(timer);state.controller=null;
  if(state.cid&&state.user){
   try{await api('/api/conversations/'+state.cid+'/turns/local',{method:'POST',body:JSON.stringify({request_id:id,question,mode:t.mode,had_images:!!images.length,response:r})});r.saved=true;}
   catch(saveErr){r.saved=false;r.save_warning='answer_not_saved_export_before_leaving';}
  }
  t.response=r;renderTurn(t);$('question').value='';clearImages();updateInput();scrollBottom();if(state.cid)historyList();
 }catch(err){if(mounted){t.error=failure(err);renderTurn(t);}toast(failure(err));if(err.code==='login_required'){state.user=null;openAuth();}}
 finally{clearTimeout(timer);state.controller=null;setBusy(false);setPendingText(T.pending);}
};
$('stopButton').onclick=()=>{if(state.controller)state.controller.abort();else toast('현재 처리 중인 요청이 없습니다.');};
function download(name,obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
$('exportButton').onclick=()=>{if(!state.turns.length){toast(T.emptyExport);return;}download('MEDI-conversation-'+new Date().toISOString().slice(0,10)+'.json',{version:'0.1.0',purpose:'research_only',exported_at:new Date().toISOString(),turns:state.turns.map(({previewImages,...t})=>t)});};
function openAuth(){if(!state.config?.accounts){showInfo(T.localSession,b=>para(b,T.noAccounts));return;}$('authError').textContent='';$('authDialog').showModal();}
function authMode(signup){state.signup=signup;$('authTitle').textContent=signup?T.signup:T.login;$('authSubmit').textContent=signup?T.signup:T.login;$('authToggle').textContent=signup?T.toLogin:T.toSignup;$('termsField').hidden=!signup;$('terms').required=signup;$('inviteField').hidden=!(signup&&state.config?.invite_required);$('password').autocomplete=signup?'new-password':'current-password';}
$('authToggle').onclick=()=>authMode(!state.signup);
$('authForm').onsubmit=async e=>{e.preventDefault();$('authSubmit').disabled=true;$('authError').textContent='';try{const r=await api('/api/auth/'+(state.signup?'signup':'login'),{method:'POST',body:JSON.stringify({email:$('email').value.trim(),password:$('password').value,invite_code:$('invite').value,terms_accepted:$('terms').checked})},false);if(r.email_confirmation_required){toast(T.checkEmail);authMode(false);return;}const me=await api('/api/auth/session',{},false);state.user=me.user;$('authDialog').close();$('password').value='';$('invite').value='';newChat(true);statusUI();await historyList();}catch(err){$('authError').textContent=failure(err);}finally{$('authSubmit').disabled=false;}};
$('accountButton').onclick=async()=>{
 if(!state.user){openAuth();return;}
 showInfo('\ub098\uc758 \uacc4\uc815',b=>{para(b,state.user.email);para(b,'\uc800\uc7a5\ud55c \ub300\ud654\uc640 \ud53c\ub4dc\ubc31\uc740 \uac01\uac01 \uc0ad\uc81c\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \uc6b4\uc601\uc790\uac00 \uc774\ubbf8 \ub0b4\ubcf4\ub0b8 \uac80\ud1a0 \uc0ac\ubcf8\uc758 \ucca0\ud68c\ub294 \uc6b4\uc601\uc790\uc5d0\uac8c \ubb38\uc758\ud574\uc57c \ud569\ub2c8\ub2e4.');const section=el('div');section.id='myFeedback';b.append(section);const logout=el('button','quiet-button full',T.logout);logout.onclick=async()=>{if(state.busy)return;try{await api('/api/auth/logout',{method:'POST',body:'{}'});state.user=null;$('infoDialog').close();newChat(true);statusUI();}catch(e){toast(failure(e));}};b.append(logout);const del=el('button','quiet-button full danger',T.deleteAccount);del.onclick=async()=>{if(state.busy)return;if(prompt(T.accountConfirm)!=='DELETE MY ACCOUNT')return;try{await api('/api/account',{method:'DELETE',body:JSON.stringify({confirm:'DELETE MY ACCOUNT'})});state.user=null;$('infoDialog').close();newChat(true);statusUI();}catch(e){toast(failure(e));}};b.append(del);});
 try{const r=await api('/api/feedback');const b=$('myFeedback');if(!b)return;b.append(el('h3','','\ub0b4\uac00 \ubcf4\ub0b8 \ud53c\ub4dc\ubc31'));if(!r.feedback.length)para(b,'\uc800\uc7a5\ub41c \ud53c\ub4dc\ubc31\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.','subtle');for(const f of r.feedback){const row=el('div','feedback-row');row.append(el('span','',new Date(f.created_at).toLocaleDateString()+' \u00b7 '+f.id.slice(0,8)));const d=el('button','quiet-button',T.delete);d.onclick=async()=>{try{await api('/api/feedback/'+f.id,{method:'DELETE'});row.remove();}catch(e){toast(failure(e));}};row.append(d);b.append(row);}}catch(e){toast(failure(e));}
};
$('dataInfo').onclick=()=>showInfo(T.knowledgeLabel,b=>{stat(b,'\uac80\uc0c9\uc5d0 \uc5f0\uacb0\ub41c \ubb38\uc11c\u00b7\ubb38\ud56d',(state.config?.knowledge.documents||0).toLocaleString());stat(b,'\uac80\uc0c9 \uc870\uac01',(state.config?.knowledge.chunks||0).toLocaleString());stat(b,'\ub370\uc774\ud130\uc14b \uc784\ud3ec\ud2b8',(state.config?.knowledge.datasets||0).toString());para(b,'MEDI는 학습용 QA와 참고 문서를 모두 검색 대상으로 활용하되, 검증·테스트 분할 자료는 대화 검색에서 제외합니다. 검색 결과는 의료적 확신도가 아니라 질문과 자료의 관련도입니다.');para(b,T.referenceWarning,'notice-box');para(b,'\uace8\uc808 \uc601\uc0c1 \uc790\ub8cc 1,539\uc7a5\uc758 \uad6c\uc870\uc640 \ub77c\ubca8\uc744 \uc810\uac80\ud588\uc9c0\ub9cc, \uc601\uc0c1 \ubaa8\ub378\uc744 \ud559\uc2b5\ud55c \uac83\uc740 \uc544\ub2d9\ub2c8\ub2e4. \uc601\uc0c1 \ud310\ub3c5\uc740 \ube44\ud65c\uc131\ud654\ub418\uc5b4 \uc788\uc2b5\ub2c8\ub2e4.');});
$('privacyButton').onclick=()=>showInfo(T.privacy,b=>{para(b,T.consentBody);para(b,T.consentPrivacy,'notice-box');b.append(el('h3','','저장과 학습은 다릅니다'));para(b,'비로그인 대화는 현재 브라우저 화면에서만 사용합니다. 로그인 후 저장을 선택한 문자 대화만 Supabase에 암호화된 형태로 보관됩니다.');para(b,'무료 서버 AI가 연결된 경우 질문과 검색된 MEDI 근거자료 일부가 답변 생성을 위해 해당 제공자에 전송될 수 있습니다. 첨부 이미지는 메타데이터를 제거한 사본으로 처리되며, 이미지 이해가 가능한 무료 서버 AI가 연결된 경우 답변 생성을 위해 전송될 수 있습니다. 원본 이미지는 MEDI 대화기록에 저장하지 않습니다.');para(b,T.feedbackDescription);para(b,'사용자 피드백은 자동으로 모델을 재학습시키지 않으며, 검토 후 별도로 반영해야 합니다.');if(state.config?.operator_contact)para(b,'운영자 문의: '+state.config.operator_contact);});
function openFeedback(t){state.feedbackTurn=t;$('feedbackQuestion').value=t.question;$('feedbackAnswer').value=answerText(t.response.answer);$('correction').value='';$('feedbackConsent').checked=false;$('deidentified').checked=false;$('feedbackError').textContent='';$('feedbackSubmit').textContent=(state.config.accounts&&state.user)?T.feedbackSend:'\ub85c\uceec \uac80\ud1a0 \ud30c\uc77c \ub9cc\ub4e4\uae30';$('feedbackDialog').showModal();}
$('feedbackForm').onsubmit=async e=>{e.preventDefault();const t=state.feedbackTurn;if(!t)return;const p={turn_id:t.id,question:$('feedbackQuestion').value,answer:$('feedbackAnswer').value,correction:$('correction').value,rating:$('rating').value,consent:$('feedbackConsent').checked,deidentified_ack:$('deidentified').checked};$('feedbackSubmit').disabled=true;try{if(state.config.accounts&&state.user){await api('/api/feedback',{method:'POST',body:JSON.stringify(p)});toast(T.feedbackSuccess);}else{download('MEDI-feedback-candidate.json',{...p,status:'pending_human_review',automatically_trained:false});toast(T.feedbackLocal);}$('feedbackDialog').close();}catch(e){$('feedbackError').textContent=failure(e);}finally{$('feedbackSubmit').disabled=false;}};
window.addEventListener('beforeunload',e=>{if(state.busy||hasUnsaved()){e.preventDefault();e.returnValue='';}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
(async()=>{try{state.config=await api('/api/config');if(state.config.accounts){state.user=(await api('/api/auth/session',{},false)).user;}statusUI();updateSafetySettings();updateLocalAIStatus();authMode(false);await historyList();}catch(e){$('connection').textContent='연결 실패';toast(failure(e));}})();
