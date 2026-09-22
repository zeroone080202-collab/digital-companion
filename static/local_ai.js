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
  let lastMessage = '브라우저 보조 AI 준비 안 됨';

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
      setStatus('unsupported', '이 브라우저는 WebGPU 보조 AI를 지원하지 않습니다. 무료 서버 AI가 연결되어 있으면 정상 사용 가능합니다.');
      return { ok: false, reason: 'webgpu_unavailable' };
    }

    preparing = (async () => {
      try {
        setStatus('loading', '브라우저 보조 AI 모듈을 불러오는 중입니다…', 0);
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
            if (p !== null) text = `브라우저 보조 AI 준비 중 ${Math.round(p * 100)}%`;
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

        setStatus('ready', `브라우저 보조 AI 준비 완료 · ${modelId}` , 1);
        return { ok: true, modelId };
      } catch (error) {
        engine = null;
        setStatus('error', '브라우저 보조 AI 준비에 실패했습니다. 무료 서버 AI가 있으면 서버 AI를 사용합니다.');
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
      '너는 MEDI라는 한국어 의료 전문 AI다. 사용자는 의학 전문가가 아니라 일반인이다.',
      '제공된 MEDI 업로드 근거자료를 먼저 활용하되 본문에는 [S1] 같은 번호를 노출하지 마라.',
      '첫 문장에서 질문에 바로 답하고, 기본 답변은 전체 250~500자 정도로 최대 3개 짧은 문단만 작성하라.',
      '전문용어는 꼭 필요할 때만 쉬운 말 뒤 괄호로 한 번 설명하라.',
      '단순 개념 질문은 한마디로 무엇인지, 언제 쓰는지, 핵심 원리만 설명하라.',
      '증상 질문은 흔한 가능성 2~3개까지만 말하고, 꼭 필요한 확인 질문도 1~2개만 제시하라.',
      '진단을 확정하거나 질환을 배제하지 말고, 처방약의 시작·중단·용량 변경을 지시하지 마라.',
      '심한 흉통, 호흡곤란, 의식저하, 마비, 멈추지 않는 출혈 등 응급 상황은 119 또는 응급의료기관 이용을 우선 안내하라.',
      '참고자료가 충분하지 않으면 억지로 끼워 맞추지 말고 짧게 한계를 말하라.',
      '긴 목록, 논문 문체, 병태생리 단계 나열, 같은 말 반복을 피하라. JSON이나 코드블록은 사용하지 마라.'
    ].join('\n');

    const messages = [{ role: 'system', content: system }];
    for (const item of (history || []).slice(-4)) {
      if (!item?.role || !item?.content) continue;
      messages.push({ role: item.role, content: clip(item.content, 1500) });
    }
    messages.push({
      role: 'user',
      content: `참고자료:\n${referenceText}\n\n사용자 질문:\n${clip(question, 4000)}\n\n일반인이 바로 이해할 수 있게 짧고 쉽게 답해라.`
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
    const parts = cleaned.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean).slice(0, 3);
    const paragraphs = (parts.length ? parts : [cleaned || '답변을 생성하지 못했습니다.']).map((p, i) => ({
      heading: i === 0 ? '' : '',
      text: p.length > 430 ? p.slice(0, 427).replace(/[ ,;:]+$/,'') + '…' : p,
      source_ids: []
    }));
    return {
      in_scope: true,
      urgency: mode === 'study' ? 'general_information' : 'unknown',
      evidence_status: hasSources ? 'partial' : 'insufficient',
      paragraphs,
      follow_up_questions: [],
      image_observations: hadImages ? ['첨부 이미지는 현재 무료 기기 AI가 분석하지 않습니다. 이미지 진단·판독은 아직 연결되지 않았습니다.'] : [],
      limitations: '참고용 정보예요. 증상이 심하거나 계속되면 의료진에게 확인하세요.'
    };
  };

  const generate = async ({ question, mode = 'health', sources = [], history = [], hadImages = false }) => {
    const ready = await prepare();
    if (!ready.ok || !engine) throw new Error(ready.reason || 'local_ai_unavailable');

    setStatus('generating', '브라우저 보조 AI가 MEDI 의료자료를 바탕으로 답변을 작성하고 있습니다…');
    try {
      const reply = await engine.chat.completions.create({
        messages: buildMessages({ question, mode, sources, history }),
        temperature: 0.25,
        top_p: 0.9,
        max_tokens: 460
      });
      const text = reply?.choices?.[0]?.message?.content || '';
      const answer = textToAnswer(text, Boolean(sources?.length), mode, hadImages);
      setStatus('ready', `브라우저 보조 AI 준비 완료 · ${modelId}`);
      return { answer, model: modelId };
    } catch (error) {
      setStatus('error', '브라우저 보조 AI 답변 생성에 실패했습니다.');
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
