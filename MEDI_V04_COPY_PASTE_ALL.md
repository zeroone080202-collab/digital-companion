# MEDI v0.4 - 전체 교체 파일 복사/붙여넣기

각 제목에 적힌 GitHub 경로의 파일 내용을 **전부 지우고**, 해당 코드블록 내용을 통째로 붙여넣으세요. `static/local_ai.js`는 새 파일입니다.

## `static/index.html`

````html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark"><meta name="robots" content="noindex,nofollow">
<title>MEDI - Medical Research Companion</title>
<link rel="icon" href="/static/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="/static/app.css?v=0400">
<script src="/static/local_ai.js?v=0400" defer></script>
<script src="/static/app.js?v=0400" defer></script>
</head>
<body>
<a class="skip" href="#question" data-i18n="skip"></a>
<div class="layout">
<button id="shade" class="shade" aria-label="Close navigation" hidden></button>
<aside id="sidebar" class="sidebar" aria-label="Conversation navigation">
 <a class="brand" href="/" aria-label="MEDI home"><img src="/static/mark.svg" width="35" height="35" alt=""><span>MEDI<small>RESEARCH COMPANION</small></span></a>
 <button id="newChat" class="new-chat"><span class="plus">+</span><span data-i18n="newChat"></span><kbd>N</kbd></button>
 <div class="nav-caption" data-i18n="history"></div><div id="conversationList" class="conversation-list"></div>
 <div class="sidebar-bottom">
  <button id="dataInfo" class="data-card"><span class="data-top"><span class="status-dot"></span><span data-i18n="knowledgeLabel"></span><span class="arrow">&#8599;</span></span><strong id="docCount">--</strong><small id="chunkCount" data-i18n="loading"></small><span class="data-line"></span><small data-i18n="dataCaution"></small></button>
  <button id="privacyButton" class="side-link"><span aria-hidden="true">&#9671;</span><span data-i18n="privacy"></span></button>
  <button id="accountButton" class="account-button"><span class="avatar">M</span><span><b id="accountName" data-i18n="localSession"></b><small id="accountState" data-i18n="temporary"></small></span><span class="arrow">&#8250;</span></button>
 </div>
</aside>
<div class="workspace">
 <header class="topbar"><div class="top-left"><button id="menuButton" class="icon-button menu-button" aria-label="Open navigation">&#9776;</button><b>MEDI</b><span class="version-tag">RESEARCH BETA</span></div><div class="top-right"><span id="connection" class="connection" data-i18n="loading"></span><button id="settingsButton" class="quiet-button" type="button">설정</button><button id="exportButton" class="quiet-button" data-i18n="export"></button></div></header>
 <div id="systemNotice" class="system-notice" role="status" hidden></div>
 <main id="scrollArea" class="scroll-area">
  <section id="welcome" class="welcome">
   <div class="welcome-symbol"><img src="/static/mark.svg" width="42" height="42" alt=""></div>
   <p class="eyebrow">A SPACE FOR BETTER UNDERSTANDING</p><h1 data-i18n="welcomeTitle"></h1><p class="welcome-description" data-i18n="welcomeDescription"></p>
   <div class="suggestions">
    <button class="suggestion" data-prompt="promptKnowledge"><span class="card-icon">&#9783;</span><b data-i18n="cardKnowledge"></b><p data-i18n="cardKnowledgeDesc"></p><span class="card-arrow">&#8599;</span></button>
    <button class="suggestion" id="welcomeImage"><span class="card-icon">&#9635;</span><b data-i18n="cardImage"></b><p data-i18n="cardImageDesc"></p><span class="card-arrow">&#8599;</span></button>
    <button class="suggestion" data-prompt="promptStudy" data-mode="study"><span class="card-icon">&#10022;</span><b data-i18n="cardStudy"></b><p data-i18n="cardStudyDesc"></p><span class="card-arrow">&#8599;</span></button>
   </div><p class="welcome-note"><span class="status-dot"></span><span data-i18n="welcomeNote"></span></p>
  </section>
  <section id="messages" class="messages" aria-label="Conversation"></section>
  <div id="pending" class="pending" role="status" hidden><span class="pulse"></span><span data-i18n="pending"></span></div>
 </main>
 <footer class="composer-area"><form id="chatForm" class="composer">
  <div id="attachments" class="attachments"></div>
  <label class="sr-only" for="question" data-i18n="questionLabel"></label><textarea id="question" rows="2" maxlength="4000" data-placeholder="questionPlaceholder"></textarea>
  <div class="composer-tools"><div class="tool-group"><button type="button" id="attachButton" class="attach-button" data-title="attach"><span class="plus">+</span><span class="attach-label" data-i18n="image"></span></button><span class="tool-divider"></span><label class="sr-only" for="mode" data-i18n="mode"></label><select id="mode"><option value="health" data-i18n="health"></option><option value="study" data-i18n="study"></option></select></div><div class="tool-group"><span id="charCount" class="char-count">0 / 4000</span><button type="submit" id="sendButton" class="send-button" data-title="send" aria-label="Send message">&#8593;</button><button type="button" id="stopButton" class="stop-button" data-i18n="stop" hidden></button></div></div>
 </form>
 <div class="composer-options"><label class="save-option"><input type="checkbox" id="saveChat"><span data-i18n="saveChat"></span></label><button id="consentButton" class="text-button" data-i18n="processingInfo"></button></div>
 <p class="disclaimer" data-i18n="disclaimer"></p>
 </footer>
</div>
</div>
<input type="file" id="fileInput" accept="image/png,image/jpeg,image/webp" multiple hidden>
<div id="toast" class="toast" role="status" hidden></div>
<dialog id="infoDialog"><div class="dialog-heading"><h2 id="infoTitle"></h2><button class="icon-button" data-close="infoDialog" aria-label="Close">&#215;</button></div><div id="infoBody" class="dialog-body"></div><div class="dialog-actions"><button class="primary-button" data-close="infoDialog" data-i18n="close"></button></div></dialog>
<dialog id="consentDialog" class="safety-dialog"><div class="dialog-heading"><h2 data-i18n="consentTitle"></h2><button class="icon-button" data-close="consentDialog" aria-label="Close">&#215;</button></div><div class="dialog-body"><p data-i18n="consentBody"></p><p class="notice-box" data-i18n="consentPrivacy"></p><p class="subtle">이 안내는 기본적으로 첫 질문 전에 한 번만 표시됩니다. 설정에서 언제든 다시 켜거나 직접 다시 볼 수 있습니다.</p></div><div class="dialog-actions safety-actions"><button id="neverConsent" class="quiet-button" type="button">다시 보지 않기</button><button id="acceptConsent" class="primary-button" type="button">확인하고 계속</button></div></dialog>
<dialog id="authDialog"><div class="dialog-heading"><h2 id="authTitle" data-i18n="login"></h2><button class="icon-button" data-close="authDialog" aria-label="Close">&#215;</button></div><form id="authForm" class="dialog-body"><p class="subtle" data-i18n="authDescription"></p><label class="field"><span data-i18n="email"></span><input id="email" type="email" autocomplete="email" maxlength="254" required></label><label class="field"><span data-i18n="password"></span><input id="password" type="password" autocomplete="current-password" minlength="5" maxlength="128" required></label><label id="inviteField" class="field"><span data-i18n="invite"></span><input id="invite" type="password" autocomplete="off" maxlength="200"></label><label id="termsField" class="check-line" hidden><input id="terms" type="checkbox"><span data-i18n="terms"></span></label><p id="authError" class="inline-error" role="alert"></p><button id="authSubmit" class="primary-button full" type="submit" data-i18n="login"></button><button id="authToggle" type="button" class="text-button full" data-i18n="toSignup"></button></form></dialog>
<dialog id="settingsDialog"><div class="dialog-heading"><h2>설정</h2><button class="icon-button" data-close="settingsDialog" aria-label="Close">&#215;</button></div><div class="dialog-body settings-grid"><label class="field"><span>화면 모드</span><select id="themeSelect"><option value="light">라이트 모드</option><option value="dark">다크 모드</option><option value="system">기기 설정 따르기</option></select></label><label class="field"><span>글자 크기</span><select id="fontScale"><option value="1">기본 100%</option><option value="1.12">크게 112%</option><option value="1.25">더 크게 125%</option><option value="1.4">매우 크게 140%</option></select></label><section class="settings-card"><div><strong>무료 기기 AI</strong><p id="localAiStatus" class="subtle">기기 호환성을 확인하는 중입니다.</p></div><button id="localAiPrepare" class="quiet-button" type="button">무료 AI 준비</button></section><section class="settings-card"><div><strong>첫 질문 전 주의 안내</strong><p id="safetySettingText" class="subtle">첫 질문 전에 한 번 표시합니다.</p></div><label class="switch"><input id="safetyToggle" type="checkbox" checked><span></span></label><button id="showSafetyNow" class="quiet-button full" type="button">주의사항 지금 다시 보기</button></section><p class="subtle">무료 AI는 OpenAI API를 사용하지 않습니다. 지원되는 브라우저에서 WebGPU로 실행되며 최초 1회 모델 파일을 내려받습니다. 화면 설정과 주의 안내 설정은 현재 브라우저에 저장됩니다.</p></div><div class="dialog-actions"><button class="primary-button" data-close="settingsDialog">완료</button></div></dialog>
<dialog id="feedbackDialog"><div class="dialog-heading"><h2 data-i18n="feedbackTitle"></h2><button class="icon-button" data-close="feedbackDialog" aria-label="Close">&#215;</button></div><form id="feedbackForm" class="dialog-body"><p class="notice-box" data-i18n="feedbackDescription"></p><label class="field"><span data-i18n="feedbackQuestion"></span><textarea id="feedbackQuestion" maxlength="4000" rows="2" required></textarea></label><label class="field"><span data-i18n="feedbackAnswer"></span><textarea id="feedbackAnswer" maxlength="16000" rows="4" required></textarea></label><label class="field"><span data-i18n="correction"></span><textarea id="correction" maxlength="4000" rows="3"></textarea></label><label class="field"><span data-i18n="rating"></span><select id="rating"><option value="needs_review" data-i18n="needsReview"></option><option value="helpful" data-i18n="helpful"></option></select></label><label class="check-line"><input id="feedbackConsent" type="checkbox" required><span data-i18n="feedbackConsent"></span></label><label class="check-line"><input id="deidentified" type="checkbox" required><span data-i18n="deidentified"></span></label><button id="feedbackSubmit" class="primary-button full" type="submit" data-i18n="feedbackSend"></button><p id="feedbackError" class="inline-error" role="alert"></p></form></dialog>
</body></html>

````

## `static/app.js`

````javascript
'use strict';
const T={
 skip:'\uc9c8\ubb38 \uc785\ub825\uc73c\ub85c \uac74\ub108\ub6f0\uae30',newChat:'\uc0c8 \ub300\ud654',history:'\ub098\uc758 \ub300\ud654',loading:'\uc5f0\uacb0 \ud655\uc778 \uc911',knowledgeLabel:'\uc5f0\uacb0\ub41c \uc758\ud559\uc9c0\uc2dd',dataCaution:'\uc784\uc0c1 \uac80\ud1a0 \uc804 \uc5c5\ub85c\ub4dc \uc790\ub8cc',privacy:'\uac1c\uc778\uc815\ubcf4\uc640 \ud559\uc2b5 \uc548\ub0b4',localSession:'\uac8c\uc2a4\ud2b8 \uc0ac\uc6a9',temporary:'\ub85c\uadf8\uc778 \uc5c6\uc774 \ubc14\ub85c \uc0ac\uc6a9 \uac00\ub2a5',export:'\ub300\ud654 \ub0b4\ubcf4\ub0b4\uae30',welcomeTitle:'\uc758\ud559\uc744 \ubb3b\uace0,\n\uadfc\uac70\ub85c \uc774\ud574\ud558\uc138\uc694.',welcomeDescription:'\uc5b4\ub824\uc6b4 \uc758\ud559 \uc6a9\uc5b4\ubd80\ud130 \uac80\uc0ac\uc9c0\uc758 \ubb38\uad6c\uae4c\uc9c0.\n\uc5f0\uacb0\ub41c \uc790\ub8cc\ub97c \ucc38\uace0\ud558\uba70, \ud568\uaed8 \uc774\ud574\ud574 \ub098\uac11\ub2c8\ub2e4.',cardKnowledge:'\uc758\ud559\uc9c0\uc2dd \uc54c\uc544\ubcf4\uae30',cardKnowledgeDesc:'\uc9c8\ud658\uacfc \uac74\uac15 \uac1c\ub150\uc744 \uadfc\uac70 \uc790\ub8cc\uc640 \ud568\uaed8',cardImage:'이미지 기능 확인',cardImageDesc:'현재 무료 버전의 이미지 분석 범위와 제한 확인',cardStudy:'\uc758\ud559 \ud559\uc2b5 \ub3c4\uc6c0\ubc1b\uae30',cardStudyDesc:'\uac1c\ub150\uacfc \ud559\uc2b5\uc6a9 \ubb38\ud56d\uc744 \uc5f0\uacb0\ud574 \uc774\ud574\ud558\uae30',welcomeNote:'\uc5f0\uad6c\u00b7\ud559\uc2b5\uc6a9 \ubca0\ud0c0\uc785\ub2c8\ub2e4. \uc9c4\ub2e8\uc774\ub098 \ucc98\ubc29\uc744 \uc81c\uacf5\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.',pending:'처리하고 있습니다.',questionLabel:'\uc758\ub8cc\u00b7\uac74\uac15 \uc9c8\ubb38',questionPlaceholder:'\uad81\uae08\ud55c \uc758\ud559\uc9c0\uc2dd\uc744 \ubb3c\uc5b4\ubcf4\uc138\uc694. \uc0ac\uc9c4\ub3c4 \ud568\uaed8 \ubcf4\ub0bc \uc218 \uc788\uc5b4\uc694.',attach:'\uc774\ubbf8\uc9c0 \ucca8\ubd80 (JPG, PNG, WebP)',image:'\uc774\ubbf8\uc9c0',mode:'\ub300\ud654 \ubaa8\ub4dc',health:'\uac74\uac15\uc9c0\uc2dd',study:'\uc758\ud559 \ud559\uc2b5',send:'\ubcf4\ub0b4\uae30',stop:'\uc911\ub2e8',saveChat:'\uc774 \ub300\ud654\ub97c \ub0b4 \uacc4\uc815\uc5d0 \uc800\uc7a5',processingInfo:'안전·개인정보 안내',disclaimer:'MEDI\ub294 \uc9c4\ub2e8\u00b7\ucc98\ubc29\u00b7\uc601\uc0c1 \ud310\ub3c5\uc744 \ub300\uccb4\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \uc751\uae09\uc0c1\ud669\uc740 \ucc57\ubd07\uc774 \uc544\ub2cc 119\ub85c \uc5f0\ub77d\ud558\uc138\uc694.',close:'\ub2eb\uae30',consentTitle:'MEDI 이용 전 확인해주세요',consentBody:'질문과 최근 대화는 관련 의료자료를 찾기 위해 MEDI 서버로 전송됩니다. 답변 생성은 OpenAI API가 아니라 지원되는 기기의 브라우저에서 무료 오픈소스 AI로 실행됩니다. 첨부 이미지는 현재 무료 기기 AI가 분석하지 않습니다.',consentPrivacy:'실명, 주민번호, 연락처, 병원 등록번호 등 개인을 식별할 수 있는 정보는 입력하지 마세요. 심한 흉통, 호흡곤란, 의식저하, 마비, 멈추지 않는 출혈 등 긴급한 증상은 MEDI 답변을 기다리지 말고 119 또는 응급의료기관을 이용하세요.',consentCheck:'안내 내용을 확인했습니다.',cancel:'\ucde8\uc18c',agree:'확인하고 계속',login:'\ub85c\uadf8\uc778',signup:'\ud68c\uc6d0\uac00\uc785',authDescription:'\ub85c\uadf8\uc778\ud558\uc9c0 \uc54a\uc544\ub3c4 \ubc14\ub85c \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \ud68c\uc6d0\uac00\uc785\u00b7\ub85c\uadf8\uc778\ud558\uba74 \uc800\uc7a5\uc744 \uc120\ud0dd\ud55c \ub300\ud654 \uae30\ub85d\uc744 \ub0b4 \uacc4\uc815\uc5d0 \ub0a8\uae38 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',email:'\uc774\uba54\uc77c',password:'\ube44\ubc00\ubc88\ud638 (5\uc790 \uc774\uc0c1)',invite:'\ucd08\ub300\ucf54\ub4dc (\uc6b4\uc601\uc790\uac00 \uc81c\ud55c\ud55c \uacbd\uc6b0\uc5d0\ub9cc)',terms:'\uc758\ub8cc \uc11c\ube44\uc2a4\uac00 \uc544\ub2cc \uc5f0\uad6c\uc6a9 \ub3c4\uad6c\uc784\uc744 \uc774\ud574\ud558\uba70, \ube44\uc2dd\ubcc4 \uc815\ubcf4\ub85c\ub9cc \uc2dc\ud5d8\ud569\ub2c8\ub2e4.',toSignup:'\uc544\uc9c1 \uacc4\uc815\uc774 \uc5c6\uc73c\uc2e0\uac00\uc694? \ud68c\uc6d0\uac00\uc785',toLogin:'\uc774\ubbf8 \uacc4\uc815\uc774 \uc788\uc73c\uc2e0\uac00\uc694? \ub85c\uadf8\uc778',feedbackTitle:'\ub354 \ub098\uc740 \ub2f5\ubcc0\uc744 \uc704\ud55c \ud53c\ub4dc\ubc31',feedbackDescription:'\ud53c\ub4dc\ubc31\uc740 \uc989\uc2dc \ud559\uc2b5\ub418\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \ub3d9\uc758\ud55c \ub0b4\uc6a9\ub9cc \uc6b4\uc601\uc790\uc758 \uac80\ud1a0 \ub300\uae30\uc5f4\uc5d0 \ubcf4\ub0b4\uba70, \uc758\ud559\u00b7\uac1c\uc778\uc815\ubcf4 \uac80\ud1a0 \ud6c4 \uc218\ub3d9\uc73c\ub85c \ubc18\uc601\ud569\ub2c8\ub2e4. \uc544\ub798 \ub0b4\uc6a9\uc5d0\uc11c \uac1c\uc778\uc815\ubcf4\ub97c \uc0ad\uc81c\ud558\uc138\uc694.',feedbackQuestion:'\uac80\ud1a0\uc6a9 \uc9c8\ubb38 (\uc218\uc815 \uac00\ub2a5)',feedbackAnswer:'\uac80\ud1a0\uc6a9 \ub2f5\ubcc0 (\uc218\uc815 \uac00\ub2a5)',correction:'\uc218\uc815 \uc758\uacac\u00b7\ucc38\uace0 \uadfc\uac70',rating:'\ud3c9\uac00',needsReview:'\uac80\ud1a0\uac00 \ud544\uc694\ud574\uc694',helpful:'\ub3c4\uc6c0\uc774 \ub410\uc5b4\uc694',feedbackConsent:'\uc704 \ud53c\ub4dc\ubc31\uc744 \uc6b4\uc601\uc790\uac00 \uc77d\uace0 \uc11c\ube44\uc2a4 \uac1c\uc120\uc5d0 \uac80\ud1a0\ud558\ub294 \ub370 \ubcc4\ub3c4\ub85c \ub3d9\uc758\ud569\ub2c8\ub2e4.',deidentified:'\uc9c8\ubb38\u00b7\ub2f5\ubcc0\u00b7\uc218\uc815 \uc758\uacac\uc5d0\uc11c \uc2dd\ubcc4 \uac00\ub2a5\ud55c \uac1c\uc778\uc815\ubcf4\ub97c \uc81c\uac70\ud588\uc2b5\ub2c8\ub2e4.',feedbackSend:'\uac80\ud1a0 \ub300\uae30\uc5f4\uc5d0 \ubcf4\ub0b4\uae30',promptKnowledge:'\uace0\ud608\uc555\uacfc \ub2f9\ub1e8\ubcd1\uc740 \uc5b4\ub5a4 \uad00\uacc4\uac00 \uc788\ub098\uc694? \uc5c5\ub85c\ub4dc\ub41c \uc790\ub8cc\ub97c \ucc38\uace0\ud574 \uc124\uba85\ud574 \uc8fc\uc138\uc694.',promptStudy:'\ucc9c\uc2dd\uc758 \uc8fc\uc694 \uc99d\uc0c1\uacfc \ubcd1\ud0dc\uc0dd\ub9ac\ub97c \uc758\ud559 \ud559\uc2b5\uc6a9\uc73c\ub85c \uc124\uba85\ud574 \uc8fc\uc138\uc694.',promptImage:'현재 무료 버전에서 이 이미지로 무엇을 할 수 있는지 알려주세요.',emptyHistory:'\uc800\uc7a5\ud55c \ub300\ud654\uac00 \uc5ec\uae30\uc5d0 \ud45c\uc2dc\ub429\ub2c8\ub2e4.',demo:'의료자료 검색',connected:'무료 기기 AI',demoNotice:'무료 기기 AI는 지원되는 브라우저에서 실행됩니다.',rightsNotice:'\uc790\ub8cc \uc774\uc6a9\uad8c\ud55c\uc744 \uc6b4\uc601\uc790\uac00 \ud655\uc778\ud558\uae30 \uc804\uae4c\uc9c0 \uc678\ubd80 \uc11c\ube44\uc2a4\uc5d0\uc11c\ub294 \uc790\ub8cc \uac80\uc0c9\uc774 \ube44\ud65c\uc131\ud654\ub429\ub2c8\ub2e4.',noAccounts:'\ub85c\uceec \uccb4\ud5d8\uc5d0\uc11c\ub294 \uacc4\uc815 \uc800\uc7a5\uc744 \uc0ac\uc6a9\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. Supabase\ub97c \uc5f0\uacb0\ud558\uba74 \ud68c\uc6d0 \uae30\ub2a5\uc744 \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',loginNeeded:'\ub300\ud654 \uc800\uc7a5 \uae30\ub2a5\uc740 \ub85c\uadf8\uc778 \ud6c4 \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',copy:'\ubcf5\uc0ac',copied:'\ub2f5\ubcc0\uc744 \ubcf5\uc0ac\ud588\uc2b5\ub2c8\ub2e4.',feedback:'\ud53c\ub4dc\ubc31',references:'\ucc38\uace0\ud55c \uc5c5\ub85c\ub4dc \uc790\ub8cc',referenceWarning:'\ucd9c\ucc98\uba85\u00b7\uc5f0\ub3c4\ub294 \ub370\uc774\ud130\uc14b \ud45c\uae30\uc785\ub2c8\ub2e4. \uc6d0\ubb38\u00b7\ucd5c\uc2e0\uc131\u00b7\uc758\ud559\uc801 \uc815\ud655\uc131\uc740 \ubcc4\ub3c4 \uac80\ud1a0\uac00 \ud544\uc694\ud569\ub2c8\ub2e4.',observations:'\uc774\ubbf8\uc9c0\uc5d0\uc11c \ud655\uc778\ud55c \ubb38\uad6c\u00b7\ud45c\uba74 \ud2b9\uc9d5',notSaved:'\uc800\uc7a5\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4. \uc774 \ub300\ud654\ub97c \ub0b4\ubcf4\ub0b8 \ub4a4 \uc774\ub3d9\ud574 \uc8fc\uc138\uc694.',imageLimit:'\uc774\ubbf8\uc9c0\ub294 \ud55c \ubc88\uc5d0 2\uc7a5, \uac01 5MB\uae4c\uc9c0\uc785\ub2c8\ub2e4.',imageType:'JPG, PNG, WebP \uc774\ubbf8\uc9c0\ub9cc \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',report:'\uac80\uc0ac\uc9c0\u00b7\ud310\ub3c5\ubb38',photo:'\ud53c\ubd80 \ub4f1 \uc678\ubd80 \uc0ac\uc9c4',radiology:'X-ray·CT·MRI (현재 판독 미지원)',delete:'\uc0ad\uc81c',logout:'\ub85c\uadf8\uc544\uc6c3',deleteAccount:'\uacc4\uc815\uacfc \uc800\uc7a5 \ub0b4\uc6a9 \uc0ad\uc81c',deleteConfirm:'\uc774 \ub300\ud654\ub97c \uc0ad\uc81c\ud560\uae4c\uc694? \ubcf5\uad6c\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.',accountConfirm:'\uacc4\uc815\u00b7\ub300\ud654\u00b7\ubcf4\uad00 \uc911\uc778 \ud53c\ub4dc\ubc31\uc744 \uc0ad\uc81c\ud569\ub2c8\ub2e4. \uacc4\uc18d\ud558\ub824\uba74 DELETE MY ACCOUNT\ub97c \uc785\ub825\ud558\uc138\uc694.',stopped:'처리를 중단했습니다.',unsavedConfirm:'\uc800\uc7a5\ub418\uc9c0 \uc54a\uc740 \ub300\ud654\uac00 \uc788\uc2b5\ub2c8\ub2e4. \ub0b4\ubcf4\ub0b4\uae30 \uc5c6\uc774 \uc774\ub3d9\ud560\uae4c\uc694?',checkEmail:'\uc778\uc99d \uba54\uc77c\uc744 \ud655\uc778\ud55c \ub4a4 \ub2e4\uc2dc \ub85c\uadf8\uc778\ud574 \uc8fc\uc138\uc694.',feedbackSuccess:'\uac80\ud1a0 \ub300\uae30\uc5f4\uc5d0 \uc800\uc7a5\ud588\uc2b5\ub2c8\ub2e4. \uc790\ub3d9\uc73c\ub85c \ud559\uc2b5\ub418\uc9c0\ub294 \uc54a\uc2b5\ub2c8\ub2e4.',feedbackLocal:'\ub85c\uceec \uac80\ud1a0 \ud6c4\ubcf4 \ud30c\uc77c\uc744 \ub9cc\ub4e4\uc5c8\uc2b5\ub2c8\ub2e4. \uc11c\ubc84\uc5d0\ub294 \ubcf4\ub0b4\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.',saved:'\uacc4\uc815\uc5d0 \uc800\uc7a5\ub428',temporaryChat:'\uc784\uc2dc \ub300\ud654',emptyExport:'\ub0b4\ubcf4\ub0bc \ub300\ud654\uac00 \uc544\uc9c1 \uc5c6\uc2b5\ub2c8\ub2e4.'
};
const ERR={login_required:T.loginNeeded,invalid_invite:'\ucd08\ub300\ucf54\ub4dc\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.',membership_required:'\ucc98\uc74c \ub85c\uadf8\uc778\ud560 \ub54c \uc720\ud6a8\ud55c \ucd08\ub300\ucf54\ub4dc\ub97c \uc785\ub825\ud574 \uc8fc\uc138\uc694.',rate_limited:'\uc694\uccad\uc774 \ub9ce\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.',daily_limit:'\uc624\ub298\uc758 \uc5f0\uad6c\uc6a9 AI \uc0ac\uc6a9 \ud55c\ub3c4\uc5d0 \ub3c4\ub2ec\ud588\uc2b5\ub2c8\ub2e4.',storage_limit:'\uc800\uc7a5 \ud55c\ub3c4\uc5d0 \ub3c4\ub2ec\ud588\uc2b5\ub2c8\ub2e4. \ubd88\ud544\uc694\ud55c \ub300\ud654\ub97c \uc0ad\uc81c\ud574 \uc8fc\uc138\uc694.',server_busy:'\uc11c\ubc84\uac00 \ub2e4\ub978 \uc694\uccad\uc744 \ucc98\ub9ac \uc911\uc785\ub2c8\ub2e4. \uc790\ub3d9 \uc7ac\uc804\uc1a1\ud558\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.',auth_failed_check_email_and_password:'\uc774\uba54\uc77c\u00b7\ube44\ubc00\ubc88\ud638\u00b7\uc774\uba54\uc77c \uc778\uc99d \uc5ec\ubd80\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.',cloud_unavailable:'\uacc4\uc815 \uc800\uc7a5\uc18c\uc5d0 \uc5f0\uacb0\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.',cloud_request_failed:'\uc800\uc7a5\uc18c \uc124\uc815\uc744 \uc6b4\uc601\uc790\uac00 \ud655\uc778\ud574\uc57c \ud569\ub2c8\ub2e4.',identifiers_detected:'\ud53c\ub4dc\ubc31\uc5d0 \uc5f0\ub77d\ucc98 \ub4f1 \uac1c\uc778\uc815\ubcf4\ub85c \ubcf4\uc774\ub294 \ubb38\uad6c\uac00 \uc788\uc2b5\ub2c8\ub2e4. \uc81c\uac70\ud574 \uc8fc\uc138\uc694.',invalid_image:'\uc774\ubbf8\uc9c0 \ud615\uc2dd\u00b7\ud06c\uae30\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694. 5MB, 1,200\ub9cc \ud654\uc18c \uc774\ud558\uc785\ub2c8\ub2e4.',conversation_full:'\uc774 \ub300\ud654\uac00 \uae38\uc5b4\uc838 \uc0c8 \ub300\ud654\ub97c \uc2dc\uc791\ud574\uc57c \ud569\ub2c8\ub2e4.',invalid_request:'\uc785\ub825 \ud56d\ubaa9\uc758 \ud615\uc2dd\uacfc \uae38\uc774\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.',request_in_progress:'\ub3d9\uc77c\ud55c \uc694\uccad\uc744 \uc774\ubbf8 \ucc98\ub9ac \uc911\uc785\ub2c8\ub2e4.',terms_required:'\uc5f0\uad6c\uc6a9 \uc774\uc6a9 \uc548\ub0b4\uc5d0 \ub3d9\uc758\ud574 \uc8fc\uc138\uc694.'};
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
function updateLocalAIStatus(){const ai=window.MEDILocalAI?.status?.();if($('localAiStatus'))$('localAiStatus').textContent=ai?.message||(window.MEDILocalAI?.supported?.()?'무료 기기 AI를 사용할 수 있습니다.':'이 기기에서는 의료자료 검색 모드로 사용합니다.');if($('localAiPrepare'))$('localAiPrepare').disabled=!(window.MEDILocalAI?.supported?.());}
function applyAppearance(){const dark=appearance.theme==='dark'||(appearance.theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.style.setProperty('--font-scale',appearance.font);}
applyAppearance();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(appearance.theme==='system')applyAppearance();});
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,6000);}
function failure(e){return e.name==='AbortError'?T.stopped:(ERR[e.code]||e.detail||'\uc694\uccad\uc744 \ucc98\ub9ac\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4. \uc5f0\uacb0 \uc0c1\ud0dc\uc640 \uc11c\ubc84 \uc124\uc815\uc744 \ud655\uc778\ud574 \uc8fc\uc138\uc694.');}
async function api(path,options={},retry=true){
 const method=options.method||'GET';const headers={'X-Medi-Client':'web',...(method!=='GET'?{'Content-Type':'application/json'}:{}),...options.headers};
 const r=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,headers});
 if(r.status===401&&retry&&!path.startsWith('/api/auth/')){
  if(!state.refresh)state.refresh=api('/api/auth/refresh',{method:'POST',body:'{}'},false).finally(()=>state.refresh=null);
  await state.refresh;return api(path,options,false);
 }
 let data;try{data=await r.json();}catch{throw Object.assign(new Error('Invalid server response'),{code:'network'});}
 if(!r.ok)throw Object.assign(new Error(data.error||'network'),{code:data.error,detail:data.detail,status:r.status});return data;
}
function closeMenu(){$('sidebar').classList.remove('open');$('shade').hidden=true;}
$('menuButton').onclick=()=>{$('sidebar').classList.toggle('open');$('shade').hidden=!$('sidebar').classList.contains('open');};$('shade').onclick=closeMenu;
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();
for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
function showInfo(title,fill){$('infoTitle').textContent=title;$('infoBody').replaceChildren();fill($('infoBody'));$('infoDialog').showModal();}
function para(root,text,cls=''){root.append(el('p',cls,text));}
function stat(root,label,value){const row=el('div','stat-row');row.append(el('span','',label),el('span','',value));root.append(row);}
function statusUI(){
 const c=state.config;if(!c)return;
 const ai=window.MEDILocalAI?.status?.();
 if(window.MEDILocalAI?.supported?.())$('connection').textContent=ai?.ready?'무료 기기 AI 준비됨':'무료 기기 AI';
 else $('connection').textContent='의료자료 검색';
 $('docCount').textContent=(c.knowledge.documents||0).toLocaleString()+'건';$('chunkCount').textContent=(c.knowledge.chunks||0).toLocaleString()+'개 검색 조각';
 const notes=[];if(!c.knowledge_enabled)notes.push(T.rightsNotice);$('systemNotice').textContent=notes.join(' ');$('systemNotice').hidden=!notes.length;
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
for(const b of document.querySelectorAll('[data-prompt]'))b.onclick=()=>{if(state.busy)return;$('question').value=T[b.dataset.prompt];if(b.dataset.mode)$('mode').value=b.dataset.mode;updateInput();$('question').focus();};
$('welcomeImage').onclick=()=>{$('question').value=T.promptImage;updateInput();$('fileInput').click();};$('attachButton').onclick=()=>$('fileInput').click();
$('fileInput').onchange=async e=>{for(const f of e.target.files){if(state.images.length>=2||f.size>5*1024*1024){toast(T.imageLimit);break;}if(!['image/jpeg','image/png','image/webp'].includes(f.type)){toast(T.imageType);continue;}try{const url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f);});state.images.push({name:f.name.slice(0,160),data_url:url,kind:'report'});}catch{toast(T.imageType);}}renderAttachments();e.target.value='';};
function renderAttachments(){$('attachments').replaceChildren();state.images.forEach((im,i)=>{const card=el('div','attachment'),img=el('img');img.src=im.data_url;img.alt=T.image;const inf=el('div','attachment-info');inf.append(el('span','attachment-name',im.name));const sel=el('select');sel.setAttribute('aria-label',T.image+' '+(i+1)+' \uc885\ub958');for(const value of ['report','photo','radiology']){const o=el('option','',T[value]);o.value=value;sel.append(o);}sel.value=im.kind;sel.onchange=()=>im.kind=sel.value;inf.append(sel);const del=el('button','','\u00d7');del.type='button';del.setAttribute('aria-label',T.delete+' '+im.name);del.onclick=()=>{state.images.splice(i,1);renderAttachments();};card.append(img,inf,del);$('attachments').append(card);});}
function setBusy(b){state.busy=b;$('pending').hidden=!b;$('sendButton').hidden=b;$('stopButton').hidden=!b;for(const id of ['question','mode','attachButton','newChat','welcomeImage'])$(id).disabled=b;statusUI();}
function scrollBottom(){requestAnimationFrame(()=>$('scrollArea').scrollTo({top:$('scrollArea').scrollHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));}
function answerText(a){return a.paragraphs.map(p=>(p.heading?p.heading+'\n':'')+p.text).join('\n\n')+(a.image_observations.length?'\n\n'+a.image_observations.join('\n'):'')+'\n\n'+a.limitations;}
function renderTurn(t){
 const turn=el('article','turn');turn.dataset.id=t.id;turn.append(el('div','user-message',t.question));if(t.previewImages?.length){const imgs=el('div','user-images');for(const src of t.previewImages){const img=el('img');img.src=src;img.alt=T.image;imgs.append(img);}turn.append(imgs);}if(t.had_images&&!t.previewImages?.length)turn.append(el('p','source-meta','\uc774\ubbf8\uc9c0 \ucca8\ubd80 \uc774\ub825\uc774 \uc788\uc2b5\ub2c8\ub2e4. \uc6d0\ubcf8\uc740 \uc800\uc7a5\ud558\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.'));
 if(t.response){const r=t.response,a=r.answer,assistant=el('div','assistant-message'),label=el('div','assistant-label'),mark=el('img');mark.src='/static/mark.svg';mark.alt='';label.append(mark,el('span','','MEDI'));
 const badges={supported:'\ucc38\uace0 \uadfc\uac70 \ud3ec\ud568',partial:'\ubd80\ubd84 \uadfc\uac70',insufficient:'\uadfc\uac70 \ubd88\ucda9\ubd84',not_applicable:'\uc774\uc6a9 \uc548\ub0b4'};
 label.append(el('span','evidence-badge'+(a.urgency==='emergency'?' emergency':''),a.urgency==='emergency'?'즉시 도움 안내':(r.provider==='browser_local'?'무료 기기 AI':(r.provider==='retrieval_only'?'의료자료 검색':badges[a.evidence_status]))));assistant.append(label);
 for(const p of a.paragraphs){const block=el('div','answer-paragraph');if(p.heading)block.append(el('h3','',p.heading));block.append(el('p','',p.text));for(const sid of p.source_ids){const b=el('button','source-cite',sid);b.onclick=()=>{const target=turn.querySelector('[data-source="'+sid+'"]');if(target){target.parentElement.open=true;target.open=true;target.scrollIntoView({block:'nearest',behavior:'smooth'});}};block.append(b);}assistant.append(block);}
 if(a.image_observations.length){const obs=el('div','answer-paragraph');obs.append(el('h3','',T.observations),el('p','',a.image_observations.join('\n')));assistant.append(obs);}
 if(r.sources.length){const sources=el('details','source-list');sources.append(el('summary','',T.references+' '+r.sources.length+'\uac1c'));for(const s of r.sources){const item=el('details','source-item');item.dataset.source=s.id;item.append(el('summary','',s.id+'  '+s.title),el('p','source-meta',(s.source_label||'\uc5c5\ub85c\ub4dc \uc790\ub8cc')+' \u00b7 '+(s.year||'\uc5f0\ub3c4 \ubbf8\uc0c1')+' \u00b7 '+(s.source_type==='qa'?'\ud559\uc2b5 \ubb38\ud56d':'\ucc38\uace0 \ubb38\uc11c')),el('p','excerpt',s.excerpt));sources.append(item);}sources.append(el('p','source-warning',T.referenceWarning));assistant.append(sources);}
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
$('localAiPrepare').onclick=async()=>{if(!window.MEDILocalAI?.supported?.()){toast('이 기기/브라우저에서는 WebGPU를 사용할 수 없습니다.');return;}try{$('localAiPrepare').disabled=true;await window.MEDILocalAI.prepare();}finally{updateLocalAIStatus();$('localAiPrepare').disabled=!(window.MEDILocalAI?.supported?.());statusUI();}};
window.MEDILocalAI?.setProgressHandler?.(info=>{if($('localAiStatus'))$('localAiStatus').textContent=info.message;if(state.busy)setPendingText(info.message);if(info.status==='ready'||info.status==='unsupported'||info.status==='error')statusUI();});
$('saveChat').onchange=()=>{if($('saveChat').checked&&!state.user){$('saveChat').checked=false;openAuth();}};
$('chatForm').onsubmit=async e=>{
 e.preventDefault();if(state.busy||!state.config)return;const question=$('question').value.trim();if(!question){$('question').focus();return;}if(!state.consent){askConsent(true);return;}
 const id=requestId(),images=state.images.map(i=>({...i}));const t={id,question,had_images:!!images.length,mode:$('mode').value,previewImages:images.map(i=>i.data_url)};let mounted=false;setBusy(true);state.controller=new AbortController();
 const timer=setTimeout(()=>state.controller?.abort(),100000);
 try{
  if($('saveChat').checked&&!state.cid){const c=await api('/api/conversations',{method:'POST',body:JSON.stringify({title:question.slice(0,70)})});state.cid=c.id;}
  const history=state.turns.filter(x=>x.response).slice(-4).flatMap(x=>[{role:'user',content:x.question.slice(0,1600)},{role:'assistant',content:answerText(x.response.answer).slice(0,2200)}]);
  state.turns.push(t);mounted=true;$('welcome').hidden=true;renderTurn(t);scrollBottom();setPendingText('관련 의료자료를 찾고 있습니다…');
  const r=await api('/api/chat',{method:'POST',body:JSON.stringify({request_id:id,conversation_id:state.cid,message:question,history:state.cid?[]:history,images,mode:t.mode,consent:true}),signal:state.controller.signal});
  clearTimeout(timer);state.controller=null;
  if(r.provider==='browser_local'){
   if(window.MEDILocalAI?.supported?.()){
    try{setPendingText('무료 기기 AI를 준비하고 있습니다…');const generated=await window.MEDILocalAI.generate({question,mode:t.mode,sources:r.sources||[],history,hadImages:!!images.length});r.answer=generated.answer;r.model=generated.model;r.local_generated=true;}
    catch(err){r.provider='retrieval_only';r.local_ai_error=true;toast('무료 기기 AI를 실행하지 못해 의료자료 검색 결과만 표시합니다.');}
   }else r.provider='retrieval_only';
  }
  if(state.cid&&state.user){
   try{await api('/api/conversations/'+state.cid+'/turns/local',{method:'POST',body:JSON.stringify({request_id:id,question,mode:t.mode,had_images:!!images.length,response:r})});r.saved=true;}
   catch(saveErr){r.saved=false;r.save_warning='answer_not_saved_export_before_leaving';}
  }
  t.response=r;renderTurn(t);$('question').value='';clearImages();updateInput();scrollBottom();if(state.cid)historyList();
 }catch(err){if(mounted){t.error=failure(err);renderTurn(t);}toast(failure(err));if(err.code==='login_required'){state.user=null;openAuth();}}
 finally{clearTimeout(timer);state.controller=null;setBusy(false);setPendingText(T.pending);}
};
$('stopButton').onclick=()=>{if(state.controller)state.controller.abort();else toast('기기 AI 답변 생성 중에는 잠시 기다려 주세요.');};
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
$('dataInfo').onclick=()=>showInfo(T.knowledgeLabel,b=>{stat(b,'\uac80\uc0c9\uc5d0 \uc5f0\uacb0\ub41c \ubb38\uc11c\u00b7\ubb38\ud56d',(state.config?.knowledge.documents||0).toLocaleString());stat(b,'\uac80\uc0c9 \uc870\uac01',(state.config?.knowledge.chunks||0).toLocaleString());stat(b,'\ub370\uc774\ud130\uc14b \uc784\ud3ec\ud2b8',(state.config?.knowledge.datasets||0).toString());para(b,'\uc77c\ubc18 \uac74\uac15\uc9c0\uc2dd \ubaa8\ub4dc\uc5d0\uc11c\ub294 \ud559\uc2b5 \uc2dc\ud5d8\ubb38\ud56d\uc744 \uc81c\uc678\ud558\uace0 \ucc38\uace0 \ubb38\uc11c\ub97c \uac80\uc0c9\ud569\ub2c8\ub2e4. \uac80\uc99d\u00b7\ud14c\uc2a4\ud2b8 \uc138\ud2b8\ub294 \ub300\ud654 \uac80\uc0c9\uc5d0 \uc0ac\uc6a9\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.');para(b,T.referenceWarning,'notice-box');para(b,'\uace8\uc808 \uc601\uc0c1 \uc790\ub8cc 1,539\uc7a5\uc758 \uad6c\uc870\uc640 \ub77c\ubca8\uc744 \uc810\uac80\ud588\uc9c0\ub9cc, \uc601\uc0c1 \ubaa8\ub378\uc744 \ud559\uc2b5\ud55c \uac83\uc740 \uc544\ub2d9\ub2c8\ub2e4. \uc601\uc0c1 \ud310\ub3c5\uc740 \ube44\ud65c\uc131\ud654\ub418\uc5b4 \uc788\uc2b5\ub2c8\ub2e4.');});
$('privacyButton').onclick=()=>showInfo(T.privacy,b=>{para(b,T.consentBody);para(b,T.consentPrivacy,'notice-box');b.append(el('h3','','저장과 학습은 다릅니다'));para(b,'비로그인 대화는 현재 브라우저 화면에서만 사용합니다. 로그인 후 저장을 선택한 문자 대화만 Supabase에 암호화된 형태로 보관됩니다.');para(b,'무료 기기 AI는 모델 파일을 인터넷에서 내려받지만, 질문 내용 자체를 OpenAI 같은 유료 AI API로 보내지 않습니다. 첨부 이미지도 현재 기기 AI 모델에는 전달하지 않습니다.');para(b,T.feedbackDescription);para(b,'사용자 피드백은 자동으로 모델을 재학습시키지 않으며, 검토 후 별도로 반영해야 합니다.');if(state.config?.operator_contact)para(b,'운영자 문의: '+state.config.operator_contact);});
function openFeedback(t){state.feedbackTurn=t;$('feedbackQuestion').value=t.question;$('feedbackAnswer').value=answerText(t.response.answer);$('correction').value='';$('feedbackConsent').checked=false;$('deidentified').checked=false;$('feedbackError').textContent='';$('feedbackSubmit').textContent=(state.config.accounts&&state.user)?T.feedbackSend:'\ub85c\uceec \uac80\ud1a0 \ud30c\uc77c \ub9cc\ub4e4\uae30';$('feedbackDialog').showModal();}
$('feedbackForm').onsubmit=async e=>{e.preventDefault();const t=state.feedbackTurn;if(!t)return;const p={turn_id:t.id,question:$('feedbackQuestion').value,answer:$('feedbackAnswer').value,correction:$('correction').value,rating:$('rating').value,consent:$('feedbackConsent').checked,deidentified_ack:$('deidentified').checked};$('feedbackSubmit').disabled=true;try{if(state.config.accounts&&state.user){await api('/api/feedback',{method:'POST',body:JSON.stringify(p)});toast(T.feedbackSuccess);}else{download('MEDI-feedback-candidate.json',{...p,status:'pending_human_review',automatically_trained:false});toast(T.feedbackLocal);}$('feedbackDialog').close();}catch(e){$('feedbackError').textContent=failure(e);}finally{$('feedbackSubmit').disabled=false;}};
window.addEventListener('beforeunload',e=>{if(state.busy||hasUnsaved()){e.preventDefault();e.returnValue='';}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
(async()=>{try{state.config=await api('/api/config');if(state.config.accounts){state.user=(await api('/api/auth/session',{},false)).user;}statusUI();updateSafetySettings();updateLocalAIStatus();authMode(false);await historyList();}catch(e){$('connection').textContent='연결 실패';toast(failure(e));}})();

````

## `static/app.css`

````css
:root{--font-scale:1;--ink:#263a42;--muted:#74838b;--green:#247d73;--green-soft:#e9f3ef;--border:#e3e9e8;--paper:#fbfcfc;--shadow:0 12px 45px #1a3c4410;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR","Malgun Gothic",sans-serif;color:var(--ink);font-synthesis:none}*{box-sizing:border-box}html,body{margin:0;height:100%;background:var(--paper)}button,input,select,textarea{font:inherit}button{cursor:pointer;touch-action:manipulation}button,a,input,textarea,select{outline-offset:4px}button:focus-visible,a:focus-visible{outline:2px solid var(--green)}button:disabled{cursor:not-allowed;opacity:.5}button{color:inherit}button,a{ -webkit-tap-highlight-color:transparent}button{border:0}button[hidden],[hidden]{display:none!important}a{color:var(--green)}.layout{height:100dvh;display:flex;overflow:hidden}.sidebar{width:252px;flex-shrink:0;display:flex;flex-direction:column;background:#f0f4f3;border-right:1px solid var(--border);padding:30px 18px 18px;gap:20px}.brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:var(--ink);padding:0 10px}.brand>span{font-weight:750;font-size:calc(26px * var(--font-scale));letter-spacing:1px;line-height:1.2}.brand small{display:block;font-size:calc(8px * var(--font-scale));font-weight:650;letter-spacing:1.6px;color:#7d928f;margin-top:4px}.new-chat{display:flex;align-items:center;gap:9px;text-align:left;background:var(--green);color:white;padding:13px 15px;border-radius:10px;margin-top:6px;font-weight:600;font-size:calc(14px * var(--font-scale))}.plus{font-size:calc(23px * var(--font-scale));line-height:1;font-weight:400}.new-chat kbd{margin-left:auto;font-size:calc(10px * var(--font-scale));border:1px solid #ffffff55;padding:2px 5px;border-radius:4px}.nav-caption{font-size:calc(11px * var(--font-scale));letter-spacing:1.1px;color:#82938f;padding:2px 12px 0;font-weight:600}.conversation-list{flex:1;min-height:50px;overflow:auto;margin-top:-10px}.conversation-empty{font-size:calc(12px * var(--font-scale));color:#8d9a97;line-height:1.7;padding:12px}.conversation-row{display:flex;align-items:center;gap:2px;border-radius:8px;margin-bottom:4px}.conversation-row.active{background:#e0ece7}.conversation-row .conversation-open{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:none;font-size:calc(12px * var(--font-scale));text-align:left;padding:11px}.conversation-delete{background:transparent;opacity:.6;width:32px;height:34px;border-radius:6px}.conversation-delete:hover{background:#dae5e1;color:#93443a}.sidebar-bottom{display:flex;flex-direction:column;gap:14px}.data-card{display:flex;flex-direction:column;gap:8px;text-align:left;border:1px solid #dfe8e3;background:#f9fbfa;border-radius:12px;padding:15px;color:var(--ink)}.data-top{display:flex;gap:7px;align-items:center;font-size:calc(10px * var(--font-scale));color:#59756b;font-weight:600}.status-dot{height:6px;width:6px;border-radius:50%;background:#6a9e89;display:inline-block;flex-shrink:0}.arrow{margin-left:auto;font-size:calc(16px * var(--font-scale))}.data-card strong{font-size:calc(23px * var(--font-scale));letter-spacing:-.5px;font-weight:650}.data-card small{font-size:calc(10px * var(--font-scale));line-height:1.6;color:#7c8c85}.data-line{height:1px;background:#e3eae6;display:block;width:100%;margin:2px 0}.side-link{display:flex;gap:9px;background:none;padding:0 10px;font-size:calc(12px * var(--font-scale));color:#758781;text-align:left}.account-button{display:flex;align-items:center;gap:10px;text-align:left;padding:14px 6px 2px;background:none;border-top:1px solid #dfe7e3}.account-button b{display:block;max-width:135px;overflow:hidden;text-overflow:ellipsis;font-size:calc(12px * var(--font-scale));font-weight:600}.account-button small{display:block;color:#83918c;font-size:calc(10px * var(--font-scale));margin-top:4px}.avatar{display:inline-grid;place-items:center;background:#dfeae4;color:#4d7365;border-radius:50%;width:31px;height:31px;font-size:calc(12px * var(--font-scale));font-weight:600}.workspace{min-width:0;flex:1;display:flex;flex-direction:column;position:relative}.topbar{height:74px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 35px;border-bottom:1px solid #edf0ef;gap:10px;background:#fbfcfce8}.top-left,.top-right{display:flex;gap:12px;align-items:center;min-width:0}.top-left>b{font-size:calc(15px * var(--font-scale));letter-spacing:.7px}.version-tag{font-size:calc(9px * var(--font-scale));letter-spacing:1.1px;background:#f1f3f1;color:#8b9790;border:1px solid #e5e9e5;border-radius:4px;padding:4px 6px}.connection{font-size:calc(11px * var(--font-scale));color:#7d8b87}.quiet-button{background:none;border:1px solid var(--border);border-radius:7px;padding:7px 11px;font-size:calc(11px * var(--font-scale))}.icon-button{background:transparent;width:32px;height:32px;border-radius:7px;font-size:calc(22px * var(--font-scale))}.menu-button{display:none}.system-notice{margin:14px auto 0;max-width:830px;width:calc(100% - 64px);border:1px solid #e9e1c7;border-radius:8px;background:#fcf9ef;font-size:calc(12px * var(--font-scale));line-height:1.6;color:#8b7348;padding:9px 14px}.scroll-area{min-height:0;flex:1;overflow:auto;overscroll-behavior:contain;scroll-behavior:smooth}.welcome{max-width:880px;margin:0 auto;padding:76px 42px 35px;text-align:center}.welcome-symbol{margin-bottom:22px}.eyebrow{font-size:calc(9px * var(--font-scale));letter-spacing:2.3px;font-weight:600;color:#8a9d95;margin:0 0 16px}.welcome h1{font-size:calc(36px * var(--font-scale));font-weight:650;letter-spacing:-1.5px;line-height:1.5;white-space:pre-line;margin:0}.welcome-description{font-size:calc(13px * var(--font-scale));color:#809087;line-height:1.9;margin:15px auto 0;max-width:500px;word-break:keep-all;white-space:pre-line}.suggestions{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:39px;text-align:left}.suggestion{padding:21px 18px 18px;text-align:left;background:white;border:1px solid #e0e8e4;border-radius:12px;position:relative;min-height:151px;transition:transform .15s,box-shadow .15s}.suggestion:hover{transform:translateY(-3px);box-shadow:var(--shadow);border-color:#aecfc0}.card-icon{display:block;color:#538272;font-size:calc(21px * var(--font-scale));margin-bottom:14px}.suggestion b{font-size:calc(13px * var(--font-scale));font-weight:650}.suggestion p{font-size:calc(11px * var(--font-scale));color:#84928c;line-height:1.8;margin:9px 8px 0 0;word-break:keep-all}.card-arrow{position:absolute;top:22px;right:18px;color:#a1b1a8;font-size:calc(16px * var(--font-scale))}.welcome-note{display:flex;justify-content:center;align-items:center;gap:7px;color:#8b9892;font-size:calc(10px * var(--font-scale));margin:22px 0 0}.composer-area{padding:14px 36px 15px;background:linear-gradient(#fbfcfc00,#fbfcfc 13%);flex-shrink:0;max-height:53dvh;overflow:auto}.composer{max-width:800px;margin:0 auto;background:white;border:1px solid #d8e3dd;border-radius:15px;box-shadow:0 5px 25px #27473707;padding:13px 16px 10px}.composer:focus-within{border-color:#8cb5a5;box-shadow:0 0 0 3px #e9f3ed80}textarea{resize:vertical}.composer textarea{width:100%;border:0;outline:none;background:transparent;resize:none;font-size:calc(14px * var(--font-scale));color:var(--ink);line-height:1.7;min-height:52px;max-height:120px;display:block;padding:2px}.composer textarea::placeholder{color:#a0aca6}.composer-tools{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:6px}.tool-group{display:flex;gap:9px;align-items:center}.attach-button{display:flex;align-items:center;gap:5px;background:none;font-size:calc(11px * var(--font-scale));color:#647e71;padding:4px}.tool-divider{height:15px;width:1px;background:#e1e7e3}.composer select{border:0;background:#f0f5f2;font-size:calc(11px * var(--font-scale));padding:6px 8px;border-radius:6px;color:#6e8579;max-width:115px}.send-button{width:33px;height:33px;display:grid;place-items:center;border-radius:9px;background:var(--green);color:white;font-size:calc(23px * var(--font-scale))}.stop-button{border-radius:7px;background:#edf0ef;color:#47645a;font-size:calc(11px * var(--font-scale));padding:8px}.char-count{font-size:calc(9px * var(--font-scale));color:#99a79f}.composer-options{max-width:800px;display:flex;align-items:center;justify-content:space-between;margin:9px auto 0;gap:10px}.save-option{font-size:calc(10px * var(--font-scale));color:#82918a;display:flex;gap:5px;align-items:center}.save-option input{accent-color:var(--green);margin:0;width:12px;height:12px}.text-button{background:none;color:#658475;font-size:calc(11px * var(--font-scale));padding:4px}.disclaimer{text-align:center;color:#9aa69e;font-size:calc(9px * var(--font-scale));line-height:1.7;margin:7px 0 0}.messages{max-width:840px;margin:0 auto;padding:22px 30px 6px}.turn{margin:18px 0 35px}.user-message{margin-left:auto;max-width:87%;width:fit-content;padding:14px 19px;background:#ecf3ef;border-radius:17px 17px 4px 17px;line-height:1.8;font-size:calc(14px * var(--font-scale));white-space:pre-wrap;overflow-wrap:anywhere}.user-images{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}.user-images img{width:80px;height:70px;object-fit:contain;border-radius:8px;border:1px solid var(--border)}.assistant-message{padding-top:25px}.assistant-label{display:flex;align-items:center;gap:9px;font-size:calc(12px * var(--font-scale));font-weight:650;margin-bottom:15px}.assistant-label img{height:24px;width:24px}.evidence-badge{font-size:calc(9px * var(--font-scale));font-weight:500;border-radius:5px;padding:3px 7px;background:#f0f2ef;color:#819083;margin-left:auto}.evidence-badge.emergency{color:#9b5541;background:#fff0e7}.answer-paragraph{margin:0 0 16px;font-size:calc(14px * var(--font-scale));line-height:1.95;overflow-wrap:anywhere}.answer-paragraph h3{font-size:calc(14px * var(--font-scale));font-weight:650;margin:0 0 6px}.answer-paragraph p{white-space:pre-wrap;margin:0}.source-cite{display:inline-block;background:#e7f0eb;color:#527961;font-size:calc(10px * var(--font-scale));padding:2px 6px;border-radius:4px;margin:6px 5px 0 0}.source-list{margin-top:17px;border:1px solid var(--border);border-radius:10px;padding:12px 14px;background:#fff}.source-list>summary{font-size:calc(12px * var(--font-scale));cursor:pointer;color:#617a69;list-style:none}.source-item{border-top:1px solid var(--border);padding:12px 0 1px;margin-top:11px}.source-item summary{cursor:pointer;overflow-wrap:anywhere;font-size:calc(12px * var(--font-scale));line-height:1.6}.source-meta{font-size:calc(10px * var(--font-scale));color:#8b968c;line-height:1.6;margin:5px 0}.excerpt{white-space:pre-wrap;overflow-wrap:anywhere;font-size:calc(12px * var(--font-scale));line-height:1.85;margin:8px 0;color:#69796e;max-height:310px;overflow:auto}.source-warning{font-size:calc(10px * var(--font-scale));color:#988872;line-height:1.6;margin:9px 0 0}.answer-limits{font-size:calc(10px * var(--font-scale));line-height:1.8;color:#8f9b94;border-left:2px solid #dce6df;padding-left:10px;margin-top:15px}.followups{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px}.followup{font-size:calc(11px * var(--font-scale));text-align:left;padding:7px 10px;border-radius:7px;background:#f0f5f1;color:#587b63;border:1px solid #e2ebe3}.turn-actions{display:flex;gap:10px;margin-top:12px}.turn-action{font-size:calc(10px * var(--font-scale));background:none;padding:4px 2px;color:#8a9890}.pending{max-width:780px;margin:15px auto 25px;padding:15px;font-size:calc(12px * var(--font-scale));color:#769183;display:flex;align-items:center;gap:10px}.pulse{height:8px;width:8px;background:#8daf9c;border-radius:50%;animation:pulse 1.1s ease-in-out infinite}.attachments{display:flex;gap:10px;overflow:auto}.attachment{display:flex;gap:8px;align-items:center;border:1px solid var(--border);border-radius:8px;padding:7px;margin-bottom:9px;max-width:290px;flex-shrink:0}.attachment img{width:44px;height:48px;object-fit:contain;background:#f5f7f5;border-radius:5px}.attachment-info{min-width:0}.attachment-name{display:block;max-width:140px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;font-size:calc(10px * var(--font-scale));color:#748278}.attachment select{max-width:170px;font-size:calc(10px * var(--font-scale));margin-top:5px}.attachment button{font-size:calc(16px * var(--font-scale));background:none;color:#8a9790;padding:2px}.toast{position:fixed;bottom:25px;left:50%;transform:translateX(-50%);z-index:100;max-width:min(550px,90vw);background:#294b3f;color:#fff;box-shadow:var(--shadow);border-radius:9px;padding:13px 20px;font-size:calc(12px * var(--font-scale));line-height:1.7}.dialog-heading{display:flex;justify-content:space-between;align-items:center;gap:15px;padding:20px 23px;border-bottom:1px solid var(--border)}.dialog-heading h2{font-size:calc(18px * var(--font-scale));margin:0;font-weight:650;line-height:1.5}.dialog-body{padding:19px 24px 23px;font-size:calc(13px * var(--font-scale));line-height:1.9;overflow-wrap:anywhere}.dialog-body p{margin:0 0 16px}.dialog-body h3{font-size:calc(14px * var(--font-scale));margin:18px 0 7px}.dialog-body .field{display:flex;flex-direction:column;gap:5px;font-size:calc(12px * var(--font-scale));margin-bottom:14px}.field input,.field textarea,.field select{width:100%;border:1px solid #dbe4dd;border-radius:7px;padding:10px 11px;background:#fcfdfc;color:var(--ink);font-size:calc(13px * var(--font-scale))}.dialog-body textarea{min-height:65px}.dialog-body .subtle{color:#8b9990;font-size:calc(12px * var(--font-scale))}.notice-box{background:#f3f7f3;border:1px solid #e2e9e0;border-radius:8px;padding:13px 14px;font-size:calc(12px * var(--font-scale));color:#708271}.check-line{display:flex;align-items:flex-start;gap:8px;font-size:calc(12px * var(--font-scale));line-height:1.7;margin:14px 0}.check-line input{flex-shrink:0;margin-top:4px;accent-color:var(--green)}dialog{max-width:560px;width:calc(100% - 32px);border:1px solid var(--border);padding:0;border-radius:15px;color:var(--ink);max-height:88dvh;overflow:auto;box-shadow:0 24px 90px #162e3530}dialog::backdrop{background:#18342e55;backdrop-filter:blur(3px)}.dialog-actions{padding:0 24px 21px;display:flex;justify-content:flex-end;gap:9px}.primary-button{background:var(--green);color:white;padding:10px 16px;border-radius:8px;font-size:calc(13px * var(--font-scale))}.full{width:100%;margin-top:9px}.inline-error{font-size:calc(12px * var(--font-scale));color:#a55c47;line-height:1.7}.danger{color:#a35945}.stat-row{display:flex;justify-content:space-between;padding:10px 0;gap:14px;border-bottom:1px solid var(--border);font-size:calc(12px * var(--font-scale))}.stat-row span:last-child{text-align:right}.feedback-row{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:calc(11px * var(--font-scale))}.skip{position:fixed;top:-80px;z-index:200;background:white;padding:12px}.skip:focus{top:8px}.sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.shade{display:none}@keyframes pulse{50%{opacity:.25}}@media(min-width:1600px){.welcome{padding-top:110px}.welcome h1{font-size:calc(42px * var(--font-scale))}.welcome-description{font-size:calc(15px * var(--font-scale))}.suggestion b{font-size:calc(15px * var(--font-scale))}.suggestion p{font-size:calc(12px * var(--font-scale))}.sidebar{width:270px}.composer-area{padding-bottom:25px}}@media(max-height:780px) and (min-width:861px){.welcome{padding-top:25px}.welcome-symbol{margin-bottom:12px}.welcome h1{font-size:calc(31px * var(--font-scale))}.suggestions{margin-top:22px}.suggestion{min-height:130px;padding:16px}.welcome-note{margin-top:12px}}@media(max-width:1100px){.sidebar{width:222px;padding:25px 14px 15px}.topbar{padding:0 24px}.welcome{padding-left:28px;padding-right:28px}.welcome h1{font-size:calc(32px * var(--font-scale))}.suggestion{padding:18px 13px}.composer-area{padding-left:26px;padding-right:26px}.connection{font-size:calc(10px * var(--font-scale))}.data-top{font-size:calc(9px * var(--font-scale))}}@media(max-width:860px){.sidebar{position:fixed;inset:0 auto 0 0;width:265px;z-index:31;transform:translateX(-100%);transition:transform .18s;box-shadow:20px 0 70px #263e3522}.sidebar.open{transform:translateX(0)}.shade{display:block;position:fixed;inset:0;background:#112e3440;z-index:30}.menu-button{display:block}.topbar{height:63px;padding:0 18px}.welcome{padding-top:50px}.composer-area{padding-left:20px;padding-right:20px}.system-notice{width:calc(100% - 40px)}.top-right{gap:7px}}@media(max-width:540px){.version-tag{font-size:calc(7px * var(--font-scale));padding:3px 4px;letter-spacing:.5px}.top-left,.top-right{gap:6px}.top-left>b{font-size:calc(13px * var(--font-scale))}.topbar{padding:0 11px}.top-right .quiet-button{font-size:calc(9px * var(--font-scale));padding:6px}.connection{font-size:calc(9px * var(--font-scale));max-width:87px;text-align:right;line-height:1.5}.welcome{padding:36px 22px 15px}.welcome-symbol{margin-bottom:16px}.welcome h1{font-size:calc(28px * var(--font-scale));letter-spacing:-1px}.eyebrow{font-size:calc(8px * var(--font-scale));letter-spacing:1.5px}.welcome-description{font-size:calc(12px * var(--font-scale));line-height:1.85}.suggestions{grid-template-columns:1fr;gap:9px;margin-top:25px}.suggestion{min-height:79px;padding:15px 35px 14px 55px}.card-icon{position:absolute;left:19px;top:18px;font-size:calc(23px * var(--font-scale));margin:0}.suggestion b{font-size:calc(12px * var(--font-scale))}.suggestion p{font-size:calc(10px * var(--font-scale));margin:5px 0 0;line-height:1.6}.card-arrow{right:17px;top:20px}.welcome-note{font-size:calc(9px * var(--font-scale));line-height:1.7;margin-top:17px}.composer-area{padding:9px 12px 10px}.composer{padding:10px 12px 9px;border-radius:12px}.composer textarea{font-size:calc(13px * var(--font-scale));min-height:48px}.composer-options{margin-top:8px}.save-option{font-size:calc(9px * var(--font-scale))}.text-button{font-size:calc(10px * var(--font-scale))}.disclaimer{font-size:calc(8px * var(--font-scale));margin-top:5px;line-height:1.65;padding:0 2px}.messages{padding:10px 19px}.user-message{font-size:calc(13px * var(--font-scale));max-width:94%;padding:11px 15px}.answer-paragraph{font-size:calc(13px * var(--font-scale));line-height:1.95}.answer-paragraph h3{font-size:calc(13px * var(--font-scale))}.assistant-message{padding-top:21px}.system-notice{font-size:calc(10px * var(--font-scale));padding:8px 11px;width:calc(100% - 26px);margin-top:10px}.dialog-body{padding:17px 18px}.dialog-heading{padding:17px 18px}.dialog-heading h2{font-size:calc(16px * var(--font-scale))}.char-count{display:none}.attachments{gap:7px}.attachment{max-width:245px}.attachment-name{max-width:110px}.attachment select{max-width:145px}.pending{font-size:calc(11px * var(--font-scale));margin:12px 12px 18px}.welcome-description{white-space:normal}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
@media(max-width:540px){.composer textarea{font-size:calc(16px * var(--font-scale))}.answer-paragraph{font-size:calc(15px * var(--font-scale))}.answer-paragraph h3{font-size:calc(15px * var(--font-scale))}.user-message{font-size:calc(15px * var(--font-scale))}.field input,.field textarea,.field select{font-size:calc(16px * var(--font-scale))}.composer-area{padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}.suggestion b{font-size:calc(13px * var(--font-scale))}.suggestion p{font-size:calc(11px * var(--font-scale))}}

/* v0.2 accessibility appearance */
.settings-grid{display:grid;gap:8px;min-width:min(420px,80vw)}
html[data-theme="dark"]{color-scheme:dark;--ink:#e7f0ee;--muted:#a8b9b6;--green:#65b6a8;--green-soft:#17312d;--border:#2b3b39;--paper:#101817;--shadow:0 12px 45px #0006}
html[data-theme="dark"] body,html[data-theme="dark"] .workspace,html[data-theme="dark"] .scroll-area{background:#101817;color:var(--ink)}
html[data-theme="dark"] .sidebar{background:#14201e;border-color:#2a3a37}
html[data-theme="dark"] .topbar{background:#101817eb;border-color:#263432}
html[data-theme="dark"] .composer-area{background:linear-gradient(180deg,#10181700,#101817 22%)}
html[data-theme="dark"] .composer,html[data-theme="dark"] dialog,html[data-theme="dark"] .suggestion,html[data-theme="dark"] .data-card,html[data-theme="dark"] .message.assistant,html[data-theme="dark"] .reference-card,html[data-theme="dark"] .attachment{background:#182421;color:var(--ink);border-color:#31413e}
html[data-theme="dark"] input,html[data-theme="dark"] textarea,html[data-theme="dark"] select{background:#111b19;color:var(--ink);border-color:#344541}
html[data-theme="dark"] .system-notice,html[data-theme="dark"] .notice-box{background:#2c291d;color:#e8d69c;border-color:#5f5534}
html[data-theme="dark"] .quiet-button,html[data-theme="dark"] .icon-button,html[data-theme="dark"] .text-button,html[data-theme="dark"] .side-link,html[data-theme="dark"] .account-button{color:var(--ink)}
html[data-theme="dark"] .conversation-row.active{background:#203632}
html[data-theme="dark"] .conversation-delete:hover{background:#3a2b2a}
html[data-theme="dark"] .dialog-heading{border-color:#2b3b39}
html[data-theme="dark"] .subtle,html[data-theme="dark"] .disclaimer,html[data-theme="dark"] .char-count,html[data-theme="dark"] .conversation-empty{color:#9eafab}

/* v0.4 free local AI + safety dialog */
.user-message{background:#dcefe8!important;color:#173a35!important;border:1px solid #c4ddd4!important;font-weight:500}
.user-message *{color:inherit!important}
html[data-theme="dark"] .user-message{background:#245f56!important;color:#f5fffc!important;border-color:#34796e!important}
html[data-theme="dark"] .user-message *{color:#f5fffc!important}
.settings-card{display:grid;grid-template-columns:1fr auto;gap:10px 14px;align-items:center;border:1px solid var(--border);border-radius:11px;padding:14px 15px;background:color-mix(in srgb,var(--paper) 86%,var(--green-soft) 14%)}
.settings-card strong{font-size:calc(13px * var(--font-scale))}
.settings-card .subtle{margin:4px 0 0!important;line-height:1.6!important}
.settings-card .full{grid-column:1/-1;margin-top:2px}
.switch{position:relative;width:46px;height:26px;display:inline-block;flex:0 0 auto}.switch input{position:absolute;opacity:0;width:1px;height:1px}.switch span{position:absolute;inset:0;border-radius:999px;background:#aab8b3;transition:.18s}.switch span:before{content:"";position:absolute;width:20px;height:20px;left:3px;top:3px;background:#fff;border-radius:50%;box-shadow:0 1px 4px #0003;transition:.18s}.switch input:checked+span{background:var(--green)}.switch input:checked+span:before{transform:translateX(20px)}
.safety-dialog .notice-box{line-height:1.8}.safety-actions{flex-wrap:wrap}.local-ai-progress{font-variant-numeric:tabular-nums}
html[data-theme="dark"] .settings-card{background:#15211f;border-color:#31413e}
html[data-theme="dark"] .safety-dialog{background:#182421;color:var(--ink)}
@media(max-width:540px){.settings-card{grid-template-columns:1fr auto;padding:13px}.settings-card #localAiPrepare{grid-column:1/-1;width:100%}.safety-actions{display:grid;grid-template-columns:1fr}.safety-actions button{width:100%}}

````

## `static/local_ai.js`

````javascript
'use strict';

(() => {
  const CDN = 'https://esm.run/@mlc-ai/web-llm@0.2.85';
  const PREFERRED_MODELS = [
    'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    'Qwen2.5-0.5B-Instruct-q4f32_1-MLC',
    'SmolLM2-360M-Instruct-q4f32_1-MLC'
  ];

  let modulePromise = null;
  let engine = null;
  let modelId = null;
  let preparing = null;
  let progressHandler = null;
  let lastStatus = 'idle';
  let lastMessage = '무료 기기 AI 준비 안 됨';

  const setStatus = (status, message, progress = null) => {
    lastStatus = status;
    lastMessage = message;
    if (typeof progressHandler === 'function') {
      progressHandler({ status, message, progress, modelId });
    }
  };

  const supported = () => {
    return Boolean(window.isSecureContext && navigator.gpu);
  };

  const loadModule = async () => {
    if (!modulePromise) modulePromise = import(CDN);
    return modulePromise;
  };

  const chooseModel = (webllm) => {
    const listed = new Set((webllm.prebuiltAppConfig?.model_list || []).map(x => x.model_id));
    return PREFERRED_MODELS.find(id => listed.has(id)) || PREFERRED_MODELS[0];
  };

  const prepare = async () => {
    if (engine) return { ok: true, modelId };
    if (preparing) return preparing;
    if (!supported()) {
      setStatus('unsupported', '이 기기/브라우저는 WebGPU를 지원하지 않아 의료자료 검색 모드로 사용합니다.');
      return { ok: false, reason: 'webgpu_unavailable' };
    }

    preparing = (async () => {
      try {
        setStatus('loading', '무료 AI 모듈을 불러오는 중입니다…', 0);
        const webllm = await loadModule();
        const listed = new Set((webllm.prebuiltAppConfig?.model_list || []).map(x => x.model_id));
        const candidates = PREFERRED_MODELS.filter(id => listed.size === 0 || listed.has(id));
        if (!candidates.length) candidates.push(chooseModel(webllm));

        let lastError = null;
        for (const candidate of candidates) {
          modelId = candidate;
          const initProgressCallback = (report) => {
            const p = typeof report?.progress === 'number' ? report.progress : null;
            let text = String(report?.text || '모델을 준비하는 중입니다…');
            if (p !== null) text = `무료 AI 모델 준비 중 ${Math.round(p * 100)}%`;
            setStatus('loading', text, p);
          };
          try {
            engine = await webllm.CreateMLCEngine(modelId, {
              initProgressCallback,
              logLevel: 'WARN'
            });
            lastError = null;
            break;
          } catch (error) {
            engine = null;
            lastError = error;
          }
        }
        if (!engine) throw lastError || new Error('no_compatible_model');

        setStatus('ready', `무료 기기 AI 준비 완료 · ${modelId}` , 1);
        return { ok: true, modelId };
      } catch (error) {
        engine = null;
        setStatus('error', '무료 기기 AI 준비에 실패해 의료자료 검색 모드로 전환합니다.');
        return { ok: false, reason: String(error?.message || error) };
      } finally {
        preparing = null;
      }
    })();

    return preparing;
  };

  const clip = (value, max) => String(value || '').slice(0, max);

  const buildMessages = ({ question, mode, sources, history }) => {
    const refs = (sources || []).slice(0, 4).map((s, i) => ({
      id: s.id || `S${i + 1}`,
      title: clip(s.title || '업로드 자료', 120),
      year: clip(s.year || '', 20),
      excerpt: clip(s.excerpt || '', 1200)
    }));

    const referenceText = refs.length
      ? refs.map(r => `[${r.id}] ${r.title}${r.year ? ` (${r.year})` : ''}\n${r.excerpt}`).join('\n\n')
      : '검색된 참고자료가 없습니다.';

    const system = [
      '너는 MEDI라는 한국어 의료정보 학습 보조 AI다.',
      '이 서비스는 개인 연구·학습용이며 의료진이 아니다.',
      '진단을 확정하거나 질환을 배제하지 말고, 처방약의 시작·중단·용량 변경을 지시하지 마라.',
      '사용자 개인의 증상에는 가능한 원인을 단정하지 말고 일반적인 정보, 확인할 점, 진료가 필요한 상황을 설명하라.',
      '심한 흉통, 호흡곤란, 의식저하, 마비, 멈추지 않는 출혈 등 응급 상황은 119 또는 응급의료기관 이용을 우선 안내하라.',
      '아래 참고자료는 검증 전 데이터셋일 수 있다. 참고자료가 충분하지 않으면 부족하다고 말하고 지어내지 마라.',
      '답변은 한국어로 짧고 자연스럽게 2~5문단으로 작성하라. JSON이나 코드블록은 사용하지 마라.',
      mode === 'study' ? '현재는 의학 학습 모드다. 개념 설명 중심으로 답하라.' : '현재는 건강정보 모드다. 개인 진단 대신 일반 정보 중심으로 답하라.'
    ].join('\n');

    const messages = [{ role: 'system', content: system }];
    for (const item of (history || []).slice(-4)) {
      if (!item?.role || !item?.content) continue;
      messages.push({ role: item.role, content: clip(item.content, 1500) });
    }
    messages.push({
      role: 'user',
      content: `참고자료:\n${referenceText}\n\n사용자 질문:\n${clip(question, 4000)}\n\n참고자료를 우선 사용해 답하고, 불충분하면 그 한계를 분명히 밝혀라.`
    });
    return messages;
  };

  const normalizeText = (text) => {
    return String(text || '')
      .replace(/^```(?:json|markdown|text)?/i, '')
      .replace(/```$/i, '')
      .trim();
  };

  const textToAnswer = (text, hasSources, mode, hadImages) => {
    const cleaned = normalizeText(text);
    const parts = cleaned.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean).slice(0, 5);
    const paragraphs = (parts.length ? parts : [cleaned || '답변을 생성하지 못했습니다.']).map((p, i) => ({
      heading: i === 0 ? '' : '',
      text: p,
      source_ids: []
    }));
    return {
      in_scope: true,
      urgency: mode === 'study' ? 'general_information' : 'unknown',
      evidence_status: hasSources ? 'partial' : 'insufficient',
      paragraphs,
      follow_up_questions: [],
      image_observations: hadImages ? ['첨부 이미지는 현재 무료 기기 AI가 분석하지 않습니다. 이미지 진단·판독은 아직 연결되지 않았습니다.'] : [],
      limitations: 'MEDI는 연구·학습용 정보 도구이며 진단·처방이나 의료진의 진료를 대신하지 않습니다. 무료 기기 AI의 답변은 오류가 있을 수 있으므로 중요한 의학적 결정에는 사용하지 마세요.'
    };
  };

  const generate = async ({ question, mode = 'health', sources = [], history = [], hadImages = false }) => {
    const ready = await prepare();
    if (!ready.ok || !engine) throw new Error(ready.reason || 'local_ai_unavailable');

    setStatus('generating', '무료 기기 AI가 의료자료를 바탕으로 답변을 작성하고 있습니다…');
    try {
      const reply = await engine.chat.completions.create({
        messages: buildMessages({ question, mode, sources, history }),
        temperature: 0.25,
        top_p: 0.9,
        max_tokens: 700
      });
      const text = reply?.choices?.[0]?.message?.content || '';
      const answer = textToAnswer(text, Boolean(sources?.length), mode, hadImages);
      setStatus('ready', `무료 기기 AI 준비 완료 · ${modelId}`);
      return { answer, model: modelId };
    } catch (error) {
      setStatus('error', '무료 기기 AI 답변 생성에 실패했습니다. 의료자료 검색 결과만 표시합니다.');
      throw error;
    }
  };

  window.MEDILocalAI = {
    supported,
    prepare,
    generate,
    setProgressHandler(handler) {
      progressHandler = handler;
      if (typeof handler === 'function') handler({ status: lastStatus, message: lastMessage, modelId });
    },
    status() {
      return { status: lastStatus, message: lastMessage, modelId, supported: supported(), ready: Boolean(engine) };
    }
  };
})();

````

## `app/main.py`

````python
"""MEDI research-chat server. Run one worker; see docs before public deployment."""
import asyncio
from contextlib import asynccontextmanager, suppress
from collections import OrderedDict
import hashlib
import hmac
import json
import re
import secrets
import time
from uuid import uuid4, UUID
from pathlib import Path
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware
from app.config import Settings, settings as default_settings, ROOT
from app.cloud import CloudStore, CloudError
from app.images import sanitize_image, ImageValidationError
from app.policy import is_medical, emergency_signal, fixed_answer, DISCLAIMER
from app.retrieval import KnowledgeStore
from app.schemas import (ChatRequest, Credentials, NewConversation, FeedbackRequest, DeleteAccount,
                         HistoryMessage, MedicalAnswer, Paragraph, LocalTurnSave)
from app.security import BodyAndOriginGuard, Limiter


def answer_text(answer):
    return '\n\n'.join((p.get('heading','')+'\n'+p['text']).strip() for p in answer['paragraphs'])


def create_app(cfg: Settings=default_settings, cloud_factory=CloudStore, generator=None):
    @asynccontextmanager
    async def lifespan(app):
        cfg.validate()
        app.state.cloud=cloud_factory(cfg) if cfg.has_accounts else None
        app.state.stats=KnowledgeStore(cfg.database).stats()
        async def prune_transient_cache():
            while True:
                await asyncio.sleep(30)
                cutoff=time.monotonic()-300
                while results and next(iter(results.values()))[0]<cutoff:
                    results.popitem(last=False)
        reaper=asyncio.create_task(prune_transient_cache())
        try:
            yield
        finally:
            reaper.cancel()
            with suppress(asyncio.CancelledError): await reaper
            results.clear()
            if app.state.cloud: await app.state.cloud.close()
    app=FastAPI(title='MEDI research chat',version='0.1.0',lifespan=lifespan,
                docs_url=None if cfg.public else '/docs',redoc_url=None)
    app.add_middleware(BodyAndOriginGuard,max_bytes=cfg.max_body_bytes)
    app.add_middleware(TrustedHostMiddleware,allowed_hosts=list(cfg.allowed_hosts))
    limiter=Limiter(); knowledge=KnowledgeStore(cfg.database)
    results=OrderedDict(); active=set(); active_users=set()

    @app.middleware('http')
    async def headers(request,call_next):
        response=await call_next(request)
        response.headers['X-Content-Type-Options']='nosniff'
        response.headers['Referrer-Policy']='no-referrer'
        response.headers['X-Frame-Options']='DENY'
        response.headers['Permissions-Policy']='camera=(), microphone=(), geolocation=()'
        response.headers['Content-Security-Policy']="default-src 'self'; script-src 'self' https://esm.run 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://esm.run https://huggingface.co https://*.huggingface.co https://hf.co https://*.hf.co https://cdn.jsdelivr.net https://raw.githubusercontent.com https://github.com https://objects.githubusercontent.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'"
        if request.url.path.startswith('/api'): response.headers['Cache-Control']='no-store'
        if cfg.public: response.headers['Strict-Transport-Security']='max-age=31536000'
        return response

    @app.exception_handler(RequestValidationError)
    async def bad_request(request,error): return JSONResponse({'error':'invalid_request'},422)
    @app.exception_handler(CloudError)
    async def cloud_error(request,error): return JSONResponse({'error':error.code},error.status)
    @app.exception_handler(HTTPException)
    async def http_error(request,error): return JSONResponse({'error':str(error.detail)},error.status_code)
    @app.exception_handler(ImageValidationError)
    async def image_error(request,error): return JSONResponse({'error':'invalid_image','detail':str(error)},400)

    def cloud():
        if not app.state.cloud: raise HTTPException(409,'accounts_not_configured')
        return app.state.cloud
    async def identity(request):
        token=request.cookies.get('medi_access','')
        if not cfg.has_accounts and not cfg.public: return {'id':'local','email':''},''
        if not token: raise HTTPException(401,'login_required')
        user=await cloud().user(token)
        if not await cloud().membership(token): raise HTTPException(403,'membership_required')
        return user,token
    async def chat_identity(request, response):
        token=request.cookies.get('medi_access','')
        if token and cfg.has_accounts:
            try:
                user=await cloud().user(token)
                if await cloud().membership(token): return user,token,False
            except CloudError:
                pass
        if not cfg.has_accounts and not cfg.public:
            return {'id':'local','email':''},'',True
        guest=request.cookies.get('medi_guest','')
        if not re.fullmatch(r'[0-9a-f]{32}',guest):
            guest=secrets.token_hex(16)
            response.set_cookie('medi_guest',guest,max_age=30*86400,httponly=True,secure=cfg.public,samesite='strict',path='/api')
        return {'id':'guest:'+guest,'email':''},'',True
    def cookies(response,session):
        response.set_cookie('medi_access',session['access_token'],max_age=min(int(session.get('expires_in',3600)),3600),
            httponly=True,secure=cfg.public,samesite='strict',path='/api')
        response.set_cookie('medi_refresh',session['refresh_token'],max_age=7*86400,
            httponly=True,secure=cfg.public,samesite='strict',path='/api/auth')
    def clear_cookies(response):
        response.delete_cookie('medi_access',path='/api')
        response.delete_cookie('medi_refresh',path='/api/auth')
    def auth_limit(request,email=''):
        host=request.client.host if request.client else 'unknown'
        if not limiter.allow('auth-ip:'+host,18) or not limiter.allow('auth-email:'+hashlib.sha256(email.lower().encode()).hexdigest(),8):
            raise HTTPException(429,'rate_limited')

    @app.get('/api/health')
    async def health(): return {'status':'ok','service':'medi-research-chat'}
    @app.get('/api/config')
    async def config():
        return {'app':'MEDI','version':'0.4.0','public':cfg.public,'accounts':cfg.has_accounts,
                'ai_mode':'browser_local','ai_connected':False,
                'local_model':'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
                'knowledge':app.state.stats,'knowledge_enabled':not cfg.public or cfg.dataset_rights_confirmed,
                'invite_required':False,'guest_chat':True,'max_image_mb':5,'max_images':2,
                'learning':'consented_feedback_then_human_review','radiology_enabled':False,
                'operator_contact':cfg.operator_contact}
    @app.post('/api/auth/signup')
    async def signup(data: Credentials,request: Request):
        auth_limit(request,data.email)
        if not data.terms_accepted: raise HTTPException(400,'terms_required')
        if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',data.email): raise HTTPException(400,'invalid_email')
        session=await cloud().signup(data.email,data.password)
        response=JSONResponse({'ok':True,'email_confirmation_required':not bool(session.get('access_token'))})
        if session.get('access_token'):
            await cloud().join(session['access_token'],'')
            cookies(response,session)
        return response
    @app.post('/api/auth/login')
    async def login(data: Credentials,request: Request):
        auth_limit(request,data.email)
        session=await cloud().login(data.email,data.password)
        if not await cloud().membership(session['access_token']):
            await cloud().join(session['access_token'],'')
        response=JSONResponse({'ok':True});cookies(response,session);return response
    @app.post('/api/auth/refresh')
    async def refresh(request: Request):
        host=request.client.host if request.client else 'unknown'
        if not limiter.allow('refresh:'+host,30):raise HTTPException(429,'rate_limited')
        token=request.cookies.get('medi_refresh','')
        if not token:raise HTTPException(401,'login_required')
        session=await cloud().refresh(token)
        response=JSONResponse({'ok':True});cookies(response,session);return response
    @app.post('/api/auth/logout')
    async def logout(request: Request):
        token=request.cookies.get('medi_access','')
        try:
            if token and cfg.has_accounts:await cloud().logout(token)
        except CloudError:pass
        results.clear()
        response=JSONResponse({'ok':True});clear_cookies(response);return response
    @app.get('/api/auth/session')
    async def auth_session(request: Request):
        if not cfg.has_accounts:
            return {'user':None}
        token=request.cookies.get('medi_access','')
        if token:
            try:
                user=await cloud().user(token)
                if await cloud().membership(token): return {'user':user}
            except CloudError:
                pass
        refresh_token=request.cookies.get('medi_refresh','')
        if refresh_token:
            try:
                session=await cloud().refresh(refresh_token)
                user=await cloud().user(session['access_token'])
                if not await cloud().membership(session['access_token']):
                    response=JSONResponse({'user':None});clear_cookies(response);return response
                response=JSONResponse({'user':user});cookies(response,session);return response
            except CloudError:
                response=JSONResponse({'user':None});clear_cookies(response);return response
        return {'user':None}

    @app.get('/api/auth/me')
    async def me(request: Request):
        user,_=await identity(request)
        return {'user':user}

    @app.get('/api/conversations')
    async def conversations(request:Request):
        _,token=await identity(request)
        return {'conversations':await cloud().conversations(token)}
    @app.post('/api/conversations')
    async def new_conversation(data:NewConversation,request:Request):
        user,token=await identity(request)
        cid=str(uuid4());await cloud().new_conversation(token,user['id'],cid,data.title)
        return {'id':cid}
    @app.get('/api/conversations/{cid}')
    async def read_conversation(cid:UUID,request:Request):
        _,token=await identity(request)
        return {'id':str(cid),'turns':await cloud().turns(token,str(cid))}
    @app.delete('/api/conversations/{cid}')
    async def delete_conversation(cid:UUID,request:Request):
        _,token=await identity(request)
        await cloud().delete_conversation(token,str(cid))
        results.clear()  # bounded transient cache; persisted records remain owner-scoped
        return {'ok':True}

    @app.post('/api/chat')
    async def chat(data: ChatRequest,request:Request,response:Response):
        user,token,is_guest=await chat_identity(request,response)
        if not data.consent:raise HTTPException(400,'processing_consent_required')
        uid=user['id'];key=(uid,str(data.request_id))
        now=time.monotonic()
        while results and (next(iter(results.values()))[0]<now-300 or len(results)>100): results.popitem(last=False)
        digest=hashlib.sha256(data.model_dump_json().encode()).hexdigest()
        if key in results:
            if results[key][1]!=digest:raise HTTPException(409,'request_id_conflict')
            return results[key][2]
        if key in active:raise HTTPException(409,'request_in_progress')
        if not limiter.allow('chat:'+uid,cfg.requests_per_minute): raise HTTPException(429,'rate_limited')
        if uid in active_users:raise HTTPException(409,'request_in_progress')
        active.add(key);active_users.add(uid)
        try:
            # Saved history comes from owner-scoped DB, not forged client records.
            if data.conversation_id:
                if is_guest: raise HTTPException(401,'login_required_for_saving')
                saved=await cloud().turns(token,str(data.conversation_id),80)
                if len(saved)>=80:raise HTTPException(409,'conversation_full')
                for old in saved:
                    if old['id']==str(data.request_id):
                        if old['question']!=data.message:raise HTTPException(409,'request_id_conflict')
                        return old['response']
                hist=[]
                for t in saved[-4:]:
                    hist.extend([HistoryMessage(role='user',content=t['question'][:2000]),
                                 HistoryMessage(role='assistant',content=answer_text(t['response']['answer'])[:3000])])
                data=data.model_copy(update={'history':hist})

            sources=[];image_info=[];provider='guardrail'
            if emergency_signal(data.message):
                answer=fixed_answer('emergency')
            elif any(i.kind=='radiology' for i in data.images):
                answer=fixed_answer('radiology')
            elif not is_medical(data.message,data.history,bool(data.images)):
                answer=fixed_answer('out_of_scope')
            else:
                # Images are only validated/re-encoded on this server. They are NOT sent to an AI API.
                for image in data.images:
                    _,info=await asyncio.to_thread(sanitize_image,image.data_url,cfg.max_image_bytes)
                    image_info.append(info)
                query=data.message
                if len(query)<80 and data.history:
                    previous=next((h.content for h in reversed(data.history) if h.role=='user'),'')
                    query=previous[:250]+' '+query
                if not cfg.public or cfg.dataset_rights_confirmed:
                    sources=await asyncio.to_thread(knowledge.search,query,study=data.mode=='study',limit=5)
                provider='browser_local'
                if sources:
                    text='질문과 관련된 업로드 의료자료를 찾았습니다. 지원되는 기기에서는 무료 기기 AI가 아래 자료를 바탕으로 답변을 작성합니다. 기기 AI를 사용할 수 없으면 아래 참고자료를 직접 확인해 주세요.'
                    evidence='partial'
                else:
                    text='현재 질문과 직접 연결되는 업로드 의료자료를 찾지 못했습니다. 무료 기기 AI가 일반적인 설명을 만들 수는 있지만, 근거가 부족하므로 중요한 의료 판단에 사용하면 안 됩니다.'
                    evidence='insufficient'
                image_note=['첨부 이미지는 현재 무료 기기 AI가 분석하지 않습니다. 이미지 진단·판독 기능은 별도의 검증된 영상 모델이 준비된 뒤 연결해야 합니다.'] if data.images else []
                answer=MedicalAnswer(in_scope=True,urgency='general_information' if data.mode=='study' else 'unknown',
                    evidence_status=evidence,
                    paragraphs=[Paragraph(heading='관련 의료자료 검색',text=text,source_ids=[])],
                    follow_up_questions=[],image_observations=image_note,limitations=DISCLAIMER)

            result={'id':str(data.request_id),'answer':answer.model_dump(),'sources':sources,
                    'provider':provider,'model':None,'image_processing':image_info,
                    'image_bytes_stored':False,'quota':None,'saved':False,'learning_applied':False,
                    'local_ai_allowed':provider=='browser_local'}
            results[key]=(time.monotonic(),digest,result)
            return result
        finally:
            active.discard(key);active_users.discard(uid)

    @app.post('/api/conversations/{cid}/turns/local')
    async def save_local_turn(cid:UUID,data:LocalTurnSave,request:Request):
        user,token=await identity(request)
        if data.response.get('provider') not in {'browser_local','retrieval_only','guardrail'}:
            raise HTTPException(400,'invalid_request')
        try:
            MedicalAnswer.model_validate(data.response.get('answer'))
        except Exception:
            raise HTTPException(400,'invalid_request')
        await cloud().require_conversation(token,str(cid))
        response_payload=dict(data.response)
        response_payload['saved']=True
        payload={'question':data.question,'mode':data.mode,'had_images':data.had_images,'response':response_payload}
        await cloud().save_turn(token,user['id'],str(cid),str(data.request_id),payload)
        return {'ok':True,'saved':True}

    @app.post('/api/feedback')
    async def feedback(data: FeedbackRequest,request:Request):
        user,token=await identity(request)
        if not data.consent or not data.deidentified_ack: raise HTTPException(400,'feedback_consent_required')
        if not limiter.allow('feedback:'+user['id'],10):raise HTTPException(429,'rate_limited')
        try: UUID(data.turn_id)
        except ValueError:raise HTTPException(400,'invalid_request')
        # Not a complete de-identification system. Human review is mandatory.
        combined=data.question+' '+data.answer+' '+data.correction
        if re.search(r'\b\d{6}[- ]?[1-4]\d{6}\b|\b01[016789][- ]?\d{3,4}[- ]?\d{4}\b|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}',combined):
            raise HTTPException(400,'identifiers_detected')
        fid=str(uuid4())
        await cloud().feedback(token,user['id'],fid,data.model_dump())
        return {'ok':True,'id':fid,'status':'pending_human_review','automatically_trained':False}
    @app.get('/api/feedback')
    async def list_feedback(request:Request):
        _,token=await identity(request);return {'feedback':await cloud().list_feedback(token)}
    @app.delete('/api/feedback/{fid}')
    async def delete_feedback(fid:UUID,request:Request):
        _,token=await identity(request);await cloud().delete_feedback(token,str(fid));return {'ok':True}
    @app.delete('/api/account')
    async def delete_account(data:DeleteAccount,request:Request):
        _,token=await identity(request);await cloud().delete_account(token)
        results.clear()
        response=JSONResponse({'ok':True});clear_cookies(response);return response

    @app.get('/')
    async def index(): return FileResponse(ROOT/'static/index.html')
    @app.get('/robots.txt')
    async def robots():
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse('User-agent: *\nDisallow: /\n')
    app.mount('/static',StaticFiles(directory=ROOT/'static'),name='static')
    return app

app=create_app()

````

## `app/config.py`

````python
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

````

## `app/schemas.py`

````python
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
    password: str = Field(min_length=5, max_length=128)
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

class LocalTurnSave(Strict):
    request_id: UUID
    question: str = Field(min_length=1, max_length=4000)
    mode: Literal['health', 'study'] = 'health'
    had_images: bool = False
    response: dict

````

## `app/provider.py`

````python
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

````
