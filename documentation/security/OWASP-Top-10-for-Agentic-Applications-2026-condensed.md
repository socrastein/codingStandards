# OWASP Top 10 for Agentic Applications 2026 (condensed)

Condensed from OWASP Top 10 for Agentic Applications 2026 (version 2026, December 2025), OWASP Gen AI Security Project, genai.owasp.org. Licensed CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/legalcode). Changes: shortened and reorganised; wording paraphrased except where quoted. This condensed version is also CC BY-SA 4.0.

Full source: `OWASP-Top-10-for-Agentic-Applications-2026-12.6-1.pdf`, beside this file.

A map, not the authority: before acting on a rule, read the PDF at the page cited. Condensing was checked line by line against the source, but detail is lost by design.

## Key terms and principles

- **Least-Agency**: avoid unnecessary autonomy, since agentic behaviour where it is not needed widens the attack surface (p. 7).
- **Least-Privilege**: the existing principle that Least-Agency extends (p. 7).
- **Observability**: clear visibility into what agents do, why, and which tools they invoke (p. 7).
- **Agentic Threats and Mitigations (T1-T17)**: the taxonomy the Top 10 builds on (p. 6).
- **AIVSS**: the AI Vulnerability Scoring System used for scoring and prioritisation (p. 6).
- **Intent capsule**: a pattern binding goal, constraints and context to each execution cycle in a signed envelope (p. 10).
- **Intent Gate (PEP/PDP)**: a pre-execution Policy Enforcement Point that validates intent and arguments (p. 14).
- **Semantic firewalls**: validating the intended meaning of tool calls, not only their syntax (p. 14).
- **Agent identity**: the agent's persona plus the authentication material representing it (p. 15).
- **Attribution gap**: without its own governed identity, an agent cannot have true least privilege (p. 15).
- **Confused deputy**: a high-privilege agent executes a relayed instruction without re-checking the user's intent (p. 16).
- **TOCTOU**: permissions valid at check time that change or expire before the action runs (p. 16).
- **Zero-trust model in application design**: a design that assumes failure or exploitation of LLM or agentic components (pp. 20, 32).
- **Kill switch**: emergency revocation that disables tools, prompts or agent connections across all deployments (p. 20).
- **Cascading failure**: the spread and amplification of a fault, not the fault's origin (p. 30).
- **Bootstrap poisoning**: an agent re-ingesting its own outputs into trusted memory (p. 26).

## At a glance

| ID    | Name                                 | Description                                                                          |
| ----- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| ASI01 | Agent Goal Hijack                    | Attackers redirect an agent's objectives, task choices or decision paths.            |
| ASI02 | Tool Misuse and Exploitation         | An agent uses a legitimate tool in an unsafe or unintended way.                      |
| ASI03 | Identity and Privilege Abuse         | Delegation and inherited trust let attackers escalate access.                        |
| ASI04 | Agentic Supply Chain Vulnerabilities | Third-party or tampered agents, tools, models or artefacts enter the run-time chain. |
| ASI05 | Unexpected Code Execution (RCE)      | Generated or injected code runs on hosts, containers or sandboxes.                   |
| ASI06 | Memory and Context Poisoning         | Stored or retrieved context is corrupted, biasing later reasoning and actions.       |
| ASI07 | Insecure Inter-Agent Communication   | Messages between agents are intercepted, spoofed, replayed or manipulated.           |
| ASI08 | Cascading Failures                   | One fault spreads across agents, sessions or workflows into system-wide harm.        |
| ASI09 | Human-Agent Trust Exploitation       | People over-trust agents and approve harmful actions.                                |
| ASI10 | Rogue Agents                         | Agents deviate from their intended function or authorised scope.                     |

## ASI01: Agent Goal Hijack

**Description.** Agents cannot reliably tell instructions from related content, so attackers can alter goals or decision paths through prompts, deceptive tool outputs, malicious artefacts, forged agent messages or poisoned data (p. 9).

**Common examples**

- Hidden instructions in web pages or RAG documents redirect an agent to exfiltrate data (p. 9).
- Instructions arriving by email or calendar send unauthorised messages under a trusted identity (p. 9).
- A malicious prompt override makes a financial agent transfer money to an attacker (p. 9).

**Prevention and mitigation**

- Treat all natural-language inputs as untrusted and apply LLM01:2025 safeguards before they affect goals or tool calls (p. 10).
- Enforce least privilege for agent tools and require human approval for high-impact or goal-changing actions (p. 10).
- Define and lock system prompts; goal changes go through configuration management and human approval (p. 10).
- Validate user and agent intent before goal-changing actions; require confirmation (human approval, policy engine or platform guardrails) when an action deviates from the original task or scope; on deviation, pause or block, surface for review and record for audit (p. 10).
- Evaluate the "intent capsule" pattern to bind goal, constraints and context to each execution cycle (p. 10).
- Sanitise and validate every connected source, using CDR, prompt-carrier detection and content filtering (p. 10).
- Log and monitor against a behavioural baseline (goal state, tool-use patterns, invariants); track a stable goal identifier; alert on drift (pp. 10-11).
- Run periodic red-team tests that simulate goal override and verify rollback effectiveness (p. 11).
- Bring AI agents into the Insider Threat Program to monitor insider prompts and investigate outliers (p. 11).

## ASI02: Tool Misuse and Exploitation

**Description.** Agents misuse legitimate tools they are authorised to use, through prompt injection, misalignment, unsafe delegation or ambiguous instructions, causing exfiltration, output manipulation or workflow hijacking. Privilege escalation falls under ASI03 and arbitrary code execution under ASI05 (p. 12).

**Common examples**

- An email summariser can delete or send mail without confirmation (p. 12).
- A Salesforce tool reads any record when only Opportunity is needed (p. 12).
- Untrusted model output is passed to a shell or database tool, which then deletes data (p. 12).
- A planner loops over costly APIs, causing DoS or bill spikes (p. 12).

**Prevention and mitigation** (note: builds on the LLM06:2025 mitigations, extended to multi-step workflows and tool orchestration, p. 13)

- Least Agency and Least Privilege for Tools: per-tool profiles for scopes, rates and egress; where possible, express them as IAM or authorisation policy (p. 13).
- Action-Level Authentication and Approval: authenticate each invocation; confirm destructive actions; where possible, show a dry-run diff before approval (p. 14).
- Execution Sandboxes and Egress Controls: isolate tool and code execution; allowlist outbound traffic and deny the rest (p. 14).
- Policy Enforcement Middleware ("Intent Gate"): treat planner output as untrusted; a PEP/PDP validates intent, schemas and rate limits; it also issues short-lived credentials and revokes or audits on drift (p. 14).
- Adaptive Tool Budgeting: cost, rate or token ceilings with automatic revocation or throttling when exceeded (p. 14).
- Just-in-Time and Ephemeral Access: credentials that expire right after use and are bound to user sessions (p. 14).
- Semantic and Identity Validation ("Semantic Firewalls"): fully qualified names and version pins; validate intended semantics, not only syntax; fail closed on ambiguous resolution and prompt the user to disambiguate (p. 14).
- Logging, Monitoring and Drift Detection: immutable logs of every invocation; alert on anomalous rates and unusual chaining (p. 14).

## ASI03: Identity and Privilege Abuse

**Description.** Dynamic trust and delegation let attackers escalate access by manipulating delegation chains, inherited roles and cached context. Agents lack a governed identity of their own, an attribution gap that makes true least privilege impossible (p. 15).

**Common examples**

- A manager delegates its full access context and a narrow worker inherits excess rights (p. 15).
- Cached credentials are reused across tasks or users when memory is not segmented or cleared (pp. 15-16).
- A compromised low-privilege agent relays valid-looking instructions to a high-privilege agent (p. 16).
- Permissions checked at workflow start expire before execution (p. 16).

**Prevention and mitigation**

- Enforce task-scoped, time-bound permissions with per-agent identities and short-lived credentials such as mTLS certificates (p. 17).
- Isolate agent identities and contexts in per-session sandboxes, wiping state between tasks (p. 17).
- Mandate per-action authorisation through a centralised policy engine that re-verifies each privileged step (p. 17).
- Apply human-in-the-loop approval for high-privilege or irreversible actions (p. 17).
- Bind OAuth tokens to a signed intent (subject, audience, purpose, session) and reject mismatched use (p. 17).
- Evaluate agentic identity management platforms that treat agents as managed non-human identities (p. 17).
- Bind permissions to subject, resource, purpose and duration; re-authenticate on context switch; revoke on idle or anomaly; prevent privilege inheritance across agents unless the original intent is re-validated (p. 17).
- Detect delegated and transitive permissions, flagging agents that inherit higher-privilege scopes (p. 17).
- Detect abnormal cross-agent elevation and device-code style phishing from scope requests or token reuse outside signed intent (p. 17).

## ASI04: Agentic Supply Chain Vulnerabilities

**Description.** Agents, tools, models, plug-ins, other agents, MCP and A2A interfaces, registries and update channels can be malicious, compromised or tampered with. Agentic ecosystems load components at run time, creating a live supply chain that can cascade across agents (p. 18).

**Common examples**

- Poisoned prompt templates loaded remotely contain hidden instructions (p. 18).
- Hidden instructions in tool metadata or agent cards are trusted by the host agent (p. 18).
- Typosquatting and symbol attacks mimic legitimate tools or agents (pp. 18-19).
- A compromised MCP or registry server serves tampered components at scale (p. 19).

**Prevention and mitigation**

- Provenance and SBOMs/AIBOMs: sign and attest manifests, prompts and tool definitions; keep an AI component inventory; use curated registries and block untrusted sources (p. 20).
- Dependency gatekeeping: allowlist and pin; scan for typosquats; verify provenance; auto-reject unsigned or unverified components (p. 20).
- Containment and builds: sandboxed containers for sensitive agents, with strict network or syscall limits; reproducible builds (p. 20).
- Secure prompts and memory: version control with peer review; scan for anomalies (p. 20).
- Inter-agent security: mutual authentication via PKI and mTLS; no open registration; sign all messages (p. 20).
- Continuous validation: re-check signatures, hashes and SBOMs at run time; monitor privilege use and lineage (p. 20).
- Pinning: pin prompts, tools and configs by content hash and commit ID; staged rollout with differential tests and auto-rollback (p. 20).
- Supply chain kill switch: emergency revocation of tools, prompts or connections across all deployments (p. 20).
- Zero-trust model in application design: assume failure or exploitation of LLM or agentic components (p. 20).

## ASI05: Unexpected Code Execution (RCE)

**Description.** Agents, including vibe coding tools, generate and execute code. Attackers turn text, tool access or unsafe deserialisation into remote code execution, host compromise or sandbox escape, and real-time generated code can bypass ordinary controls (p. 21).

**Common examples**

- Prompt injection or reflected prompts lead to attacker-defined code or shell commands (p. 21).
- Code hallucination generates exploitable constructs (p. 21).
- Unsafe deserialisation or eval(), including in agent memory, runs untrusted content (p. 21).
- Unverified package installs run hostile code during installation or import (p. 21).

**Prevention and mitigation**

- Follow LLM05:2025 Improper Output Handling: validate input and encode output to sanitise generated code (p. 22).
- Prevent direct agent-to-production systems; put vibe coding systems behind pre-production checks: security evaluations, adversarial unit tests and detection of unsafe memory evaluators (p. 22).
- Ban eval in production agents; require safe interpreters and taint-tracking on generated code (p. 22).
- Never run as root; run code in sandboxed containers with strict limits, including network access; lint and block known-vulnerable packages; use framework sandboxes such as mcp-run-python; where possible, restrict filesystem access to a dedicated working directory and log file diffs for critical paths (pp. 22-23).
- Isolate per-session environments with permission boundaries; apply least privilege; fail secure; separate code generation from execution with validation gates (p. 23).
- Require human approval for elevated runs; keep an allowlist for auto-execution under version control; enforce role and action-based controls (p. 23).
- Run static scans before execution, runtime monitoring, and audit logs of all generation and runs; watch for prompt-injection patterns (p. 23).

## ASI06: Memory and Context Poisoning

**Description.** Agents rely on stored and retrievable context (memory, summaries, embeddings, RAG stores). Adversaries seed or corrupt that context so later reasoning, planning or tool use becomes biased, unsafe or exfiltrating, and the damage persists across sessions (p. 24).

**Common examples**

- Poisoned sources, uploads or pipelines put false data into a vector store (p. 24).
- Chats from one user inject data that influences later sessions (p. 24).
- Injected content is summarised into memory and contaminates decisions after the session ends (p. 25).
- Gradual exposure to tainted data shifts stored knowledge, or plants trigger-based backdoors (p. 25).

**Prevention and mitigation**

- Baseline protection: encryption in transit and at rest, with least-privilege access (p. 25).
- Content validation: scan all new memory writes and model outputs for malicious or sensitive content before commit (p. 25).
- Memory segmentation: isolate user sessions and domain contexts (p. 25).
- Access and retention: authenticated, curated sources only; context-aware access; minimise retention by sensitivity (p. 25).
- Provenance and anomalies: require source attribution; detect suspicious updates and update frequencies (p. 25).
- Prevent automatic re-ingestion of the agent's own outputs into trusted memory ("bootstrap poisoning") (p. 26).
- Resilience and verification: adversarial tests, snapshots and rollback, human review for high-risk actions; where you operate shared vector or memory stores, per-tenant namespaces, trust scores and quarantine (p. 26).
- Expire unverified memory to limit poison persistence (p. 26).
- Weight retrieval by trust and tenancy: require two factors (e.g. provenance score plus human-verified tag) for high-impact memory, and decay low-trust entries over time (p. 26).

## ASI07: Insecure Inter-Agent Communication

**Description.** Multi-agent systems exchange messages over APIs, message buses and shared memory, where perimeter defences do not help. Weak authentication, integrity, confidentiality or authorisation lets attackers intercept, spoof, manipulate or block messages across transport, routing, discovery and semantic layers (p. 27).

**Common examples**

- A man-in-the-middle on unencrypted channels injects hidden instructions (p. 27).
- Tampered or replayed delegation and trust messages cause stale or misdirected actions (p. 27).
- Protocol downgrade and descriptor forgery create authority confusion (p. 27).
- Forged discovery traffic and metadata analysis reveal or manipulate agent relationships (p. 28).

**Prevention and mitigation**

- Secure agent channels: end-to-end encryption, per-agent credentials, mutual authentication and PKI certificate pinning; forward secrecy and regular protocol reviews (p. 28).
- Message integrity and semantic protection: sign messages, hash payload and context, and check for hidden instructions with intent-diffing (p. 28).
- Agent-aware anti-replay: nonces, session identifiers and timestamps tied to task windows; short-term message fingerprints or state hashes to detect cross-context replays (p. 28).
- Protocol and capability security: disable legacy modes; require agent-specific trust negotiation; bind protocol authentication to agent identity; enforce version and capability policies at gateways or middleware (p. 29).
- Limit metadata-based inference: where feasible, use fixed-size or padded messages, smooth communication rates and avoid deterministic schedules (p. 29).
- Protocol pinning and version enforcement: reject downgrades and unrecognised schemas (p. 29).
- Discovery and routing protection: authenticate discovery messages cryptographically; monitor routing for anomalies; validate identity and intent end-to-end; secure directories with access controls and verified reputations (p. 29).
- Attested registry and agent verification: signed agent cards and continuous verification before accepting messages (p. 29).
- Typed contracts and schema validation: reject invalid messages and undeclared down-conversion; the source notes semantic divergence remains a challenge (p. 29).

## ASI08: Cascading Failures

**Description.** A single fault (hallucination, malicious input, corrupted tool or poisoned memory) can spread across autonomous agents and compound into system-wide harm, bypassing stepwise human checks. The entry covers spread, not origin: an origin defect belongs under ASI04, ASI06 or ASI07 unless it spreads across agents, sessions or workflows (p. 30).

**Common examples**

- A hallucinating or compromised planner emits unsafe steps the executor runs unvalidated (p. 31).
- Corrupted memory or a poisoned update keeps influencing peers and new plans (p. 31).
- A tainted release auto-deploys to every connected agent (p. 31).
- Bulk approvals, relaxed policies or feedback loops between agents magnify errors (p. 31).

**Prevention and mitigation**

- Zero-trust application design: fault tolerance that assumes failure of LLM, agentic and external components (p. 32).
- Isolation and trust boundaries: sandboxing, least privilege, network segmentation, scoped APIs and mutual authentication (p. 32).
- JIT, one-time tool access: short-lived task-scoped credentials; validate each high-impact call against policy-as-code (p. 32).
- Independent policy enforcement: separate planning from execution through an external policy engine (p. 32).
- Output validation and human gates before high-risk outputs propagate downstream (p. 32).
- Rate limiting and monitoring: detect fast-spreading commands and throttle or pause on anomalies (p. 32).
- Blast-radius guardrails: quotas, progress caps and circuit breakers between planner and executor (p. 32).
- Behavioural and governance drift detection against decision baselines (p. 32).
- Digital twin replay and policy gating: replay recorded actions in an isolated production clone before expanding policy (p. 32).
- Logging and non-repudiation: tamper-evident logs bound to cryptographic agent identities, with lineage for every propagated action (p. 32).

## ASI09: Human-Agent Trust Exploitation

**Description.** Fluent, empathetic and expert-seeming agents (anthropomorphism) earn trust that adversaries or flawed designs can exploit to steer decisions or win approval for unsafe actions. Automation bias and over-reliance on confident or unverifiable rationales make abuse look legitimate; this entry concerns human misperception, while ASI10 concerns agent intent (p. 33).

**Common examples**

- Opaque reasoning makes users trust outputs they cannot question (p. 33).
- A single prompt becomes an irreversible transfer or deletion because nothing asks for confirmation (pp. 33-34).
- Empathetic agents persuade users to disclose secrets or act unsafely (p. 34).
- Fabricated rationales hide malicious logic from the approver (p. 34).

**Prevention and mitigation**

- Explicit confirmations: multi-step approval or human in the loop before risky actions or extra sensitive data (p. 34).
- Immutable logs of user queries and agent actions for audit and forensics (p. 34).
- Behavioural detection: monitor sensitive data exposure and risky actions over time (p. 35).
- Reporting of suspicious interactions: in user-interactive systems, a plain-language risk summary (not model-generated rationale) and a flag option that triggers review or lockdown (p. 35).
- Adaptive trust calibration: scale oversight to contextual risk; show cues such as "unverified source"; train human overseers (p. 35).
- Content provenance and policy enforcement: attach source identifiers, timestamps and integrity hashes; block actions without trusted provenance (p. 35).
- Separate preview from effect: block state-changing calls during preview; show a risk badge with expected side effects (p. 35).
- Human-factors and UI safeguards: distinguish high-risk recommendations visually; where appropriate, avoid manipulative language in safety-critical flows; train personnel (p. 35).
- Plan-divergence detection: alert on detours, skipped validation steps or novel tool combinations against approved baselines (p. 35).

## ASI10: Rogue Agents

**Description.** Rogue agents are malicious or compromised agents that deviate from their intended function or authorised scope, acting harmfully, deceptively or parasitically. Their individual actions can look legitimate; the entry concerns lost behavioural integrity once drift begins, not the initial intrusion (p. 36).

**Common examples**

- Goal drift: agents appear compliant while pursuing hidden goals (p. 36).
- Workflow hijacking: trusted workflows are redirected to malicious objectives (p. 36).
- Collusion and self-replication across the system (p. 36).
- Reward hacking: agents exploit flawed metrics to produce misleading results (p. 36).

**Prevention and mitigation**

- Governance and logging: immutable, signed audit logs of actions, tool calls and inter-agent communication (p. 37).
- Isolation and boundaries: trust zones with strict inter-zone rules; sandboxes; least-privilege API scopes (p. 37).
- Monitoring and detection: watchdog agents for collusion and coordinated false signals; watch for abnormal action volumes (p. 37).
- Containment and response: kill switches and credential revocation; quarantine in sandboxes for forensic review (p. 37).
- Identity attestation and behavioural integrity: per-agent attestation; signed behavioural manifests validated before each action; continuous monitoring of tasks for deviations from the declared manifest (p. 37).
- Periodic behavioural attestation: challenge tasks, signed bill of materials, per-run ephemeral credentials, and keys mediated by orchestrators (pp. 37-38).
- Recovery and reintegration: trusted baselines, fresh attestation and human approval before reintegration (p. 38).

## Appendices and other sections after the ten

- **Appendix A: OWASP Agentic AI Security Mapping Matrix** (pp. 39-40): maps each ASI entry to the OWASP LLM Top 10 (2025), Agentic AI Threats and Mitigations T-codes and AIVSS core risks.
- **Appendix B: Relationship to OWASP CycloneDX and AIBOM** (p. 41): how CycloneDX provenance complements the Top 10's behavioural risks.
- **Appendix C: Mapping to the OWASP Non-Human Identities Top 10 (2025)** (pp. 42-43): maps NHI1 to NHI10 to ASI entries, T-codes and AIVSS core risks.
- **Appendix D: ASI Agentic Exploits and Incidents Tracker** (pp. 44-49): real-world incidents from February to October 2025, each mapped to ASI entries.
- **Appendix E: Abbreviations** (pp. 50-51).
- **Acknowledgements** (pp. 52-54): entry leads, contributors and review board.
- **Project supporters** (p. 56): supporting organisations as of publication.
