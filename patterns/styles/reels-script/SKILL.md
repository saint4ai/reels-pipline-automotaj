---
name: onai-reels-script
description: Write and revise natural Russian voiceover scripts for ONai Reels and Shorts from an approved topic or research reference. Include a concise editorial review and a plain recording text; use for organic expert, schematic and review shorts, not montage code or long articles.
---

# ONai Reels Script

This is the shared short-form writing skill for Codex and Claude Code. It works without another skill or a paid connector. The existing `onai-content-engine` remains the broader research/long-form workflow; for a short script this package is sufficient.

## Read only what this request needs

Read [references/voice-and-delivery.md](references/voice-and-delivery.md). On a research-based or reference-based task also read [references/research-digest.md](references/research-digest.md). When the user wants a meaning-preserving adaptation of a competitor script, additionally read [references/meaning-preserving-adaptation.md](references/meaning-preserving-adaptation.md). Reuse a brief already present in the conversation; do not re-fetch every competitor or reread seven marketing manuals for each script.

When working in `reels-montage-pipeline`, use `content-engine` for content artifacts and `reference/research` for detailed evidence. The user's latest approved wording and project decisions override these defaults. A missing file in another client is not permission to invent the research: use the bundled digest, state any material gap, and continue with supported claims.

## Write

1. Set one audience, one concrete situation, one central claim and one main viewer action. If the user selected a topic, develop that topic rather than replacing it with an unrelated viral idea.
2. Before rewriting a supplied reference, build a compact semantic spine: every promise, concept, causal link, example, practical instruction, expectation reset and CTA that performs a distinct job. Treat the user's approved meanings as required coverage. Change or remove one only for factual accuracy, explicit user direction or a clearer equivalent that performs the same job.
3. From a reference borrow the function of the opening, the reasoning sequence and the useful visual mechanism. Preserve pedagogical order when it makes the explanation work, while introducing ONai wording, examples, tests or decision rules. Do not replace the source with a different thesis merely to sound original. Synonym substitution and copying the competitor's distinctive sentences are not original adaptation.
4. Consider three short hooks internally, then pick one. The opening names a recognizable situation or useful outcome immediately. Intrigue may delay an explanation, but must not hide the subject or inflate the evidence.
5. Write one concrete sequence the viewer can follow: action → observation → why it happens → usable conclusion. A list of tools is appropriate only if the list itself answers the chosen question. When architecture is central, state what each layer does in ordinary language instead of merely naming technologies.
6. Deliver the promised useful point in the Reel. Use one relevant CTA. A keyword comment, substantive discussion and forwarding a useful explanation are different goals; do not demand all of them in one ending.
7. Read it as speech: replace stiff joins and inflated claims, vary sentence length, remove setup and lecture tone. Default to about 85–105 Russian words for 36–40 seconds, but treat timing as an estimate and shorten for Alexander's measured pace. A meaning-preserving adaptation may run longer when compression would delete a required idea. Do not force the recording to fit a word-count guess.
8. Compare the draft against the semantic spine. Restore any missing idea, relationship or usable instruction before polishing individual phrases. Originality is judged by the new expression and ONai contribution, not by changing the subject.

## Установка — всегда через Claude, никогда через терминал (Александр, 19.09.2026)

В сценариях, подписях и инструкциях к материалам по кодовому слову зритель **никогда не ставит ничего через терминал**: это сложно и отпугивает. Формулировка всегда одна: «отдай ссылки (или промпт) Claude — он сам всё установит и подключит». Руками зритель делает только то, что Claude сделать не может: регистрация в сервисе, оплата, получение ключа, выдача разрешений. Команды `npx`, `pip`, `git clone`, `uvx`, `claude mcp add` в тексте для зрителя не пишутся; если без них никак, они уходят внутрь промпта для Claude. То же правило — в задании агенту, который собирает автоматизацию и инструкцию под ролик: инструкция строится как «вот ссылки на репозитории → отдай их Claude Code → он установит».

## Compact review

Run these four lenses yourself in one pass by default. Independent agents are optional when the user explicitly requests them; do not label a self-review independent.

- Emotion: is the situation recognizable, and does the viewer gain a doable action rather than helpless fear?
- Hook: what exactly is promised, what pays it off, and what could be incorrectly inferred?
- Discussion: is there a real choice with defensible alternatives? Do not add an empty question solely to provoke comments.
- Sharing: who could send this to whom and in what shared situation? Is there standalone value without the bonus?

Revise the actual weak lines. Retention, trust, clarity and naturalness scores are subjective editorial grades, not measured retention or probabilities of 50K views. If the main claim is unsupported, remove or qualify it. Do not dilute an approved position with unrelated disclaimers.

## Deliver and stop

Give the final recording text in chat only. Alexander (18.09.2026): texts in the chat are enough — do not duplicate scripts, hooks or variants into Downloads or other files unless he asks for a file.

**When the task is based on a supplied reference, always show the reference's cleaned original transcript next to the variants.** Alexander sends Reels that already performed and judges how far each variant moved from what worked. In chat give: the original (ASR errors fixed, wording untouched), the variants, and a deviation map by semantic unit — for each unit mark kept, truth-corrected, reordered, new or removed per variant — plus word count and estimated duration for the original and every variant. Decided 13.09.2026. Recording text is speech only: no headings, timestamps, bullets, scores, source citations or shot directions.

Keep one compact internal review with angle, three hook options, chosen CTA, source pointers, changes, estimated duration and four-lens verdict. Add a separate short montage handoff only if production is in scope. Do not expand a short-script request into publishing, an article or another full research run.

Check: the opening is specific; a concrete example appears in the first half; the promise is fulfilled; no invented facts or results; the text can be said naturally; the ending has one action; a promised asset is actually available. If all pass, deliver instead of polishing indefinitely.
