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
