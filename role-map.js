/* Role check - map a job description to evidence on this site.
   No AI. A fixed dictionary: each entry lists the ways a JD might say something, and the one quote
   from Gaurav's own pages that answers it. The same JD always gives the same result.
   Status: 'direct'   - the portfolio shows it
           'adjacent' - related experience, stated at its real level (see the quote)
           'gap'      - not in the portfolio; worth asking Gaurav directly
   Every quote is copied word for word from the page it links to. Edit freely, keep it that way. */
(function () {
  "use strict";
  var S = "https://gsj24983.github.io/";
  // Sources: [label, url]
  var SRC = {
    resume: ["Résumé", S + "resume.pdf"],
    resumeAI: ["AI product résumé", S + "resume-ai-product.pdf"],
    resumeTr: ["Transformation résumé", S + "resume-transformation.pdf"],
    moved: ["Who I am - What I've moved", S + "who-am-i.html#moved"],
    who: ["Who I am", S + "who-am-i.html"],
    journey: ["Who I am - Career journey", S + "who-am-i.html#journey"],
    dayone: ["Overview - What you get on day one", S + "overview.html?for=ft#day-one"],
    firstweek: ["Overview - consulting", S + "overview.html?for=con#first-week"],
    frameworks: ["How I think - Frameworks", S + "how-i-think.html#frameworks"],
    dairy: ["How I think - Dairy case", S + "how-i-think.html#case-dairy"],
    whatsapp: ["How I think - WhatsApp case", S + "how-i-think.html#case-whatsapp"],
    words: ["In their words", S + "in-their-words.html"],
    contact: ["Get in touch", S + "contact.html"],
  };

  // [id, label, group, status, source, quote, jd-wordings...]
  var D = [
    // ---- Strategy and discovery
    ["strategy", "Product strategy", "Strategy and discovery", "direct", "resume",
      "Sole owner of cross-product greenfield initiatives with no data, benchmarks or team: scope definition, primary and secondary research, GTM strategy, feature mapping, mock screens, business case and cost-benefit analysis through to PoC decisions.",
      "product strategy", "product vision", "vision and strategy", "strategic direction", "define the strategy", "set the strategy", "strategy and roadmap", "product leadership", "head of product", "product leader"],
    ["zero", "Zero to one / new products", "Strategy and discovery", "direct", "dayone",
      "Built products from a blank page five times, across five industries - travel, loyalty, banking procurement, media & entertainment, and enterprise software - often with a limited data team.",
      "zero to one", "zero-to-one", "0 to 1", "0-1", "0→1", "0-to-1", "greenfield", "from scratch", "new product development", "npd", "new products", "new product", "build new", "incubation", "blank page", "new business"],
    ["roadmap", "Roadmap ownership", "Strategy and discovery", "direct", "resumeAI",
      "Managed 3 senior business analysts on independent module workstreams while holding consolidated roadmap accountability",
      "roadmap", "roadmaps", "roadmapping", "product roadmap", "own the roadmap"],
    ["discovery", "Product discovery", "Strategy and discovery", "direct", "who",
      "I did the discovery from scratch; there was no guidebook and no data to build the business case.",
      "discovery", "product discovery", "problem discovery", "customer discovery", "continuous discovery", "problem framing", "problem definition", "ambiguous problems"],
    ["gtm", "Go-to-market, pricing and launch", "Strategy and discovery", "direct", "moved",
      "Customer loyalty evaluation product at Nihilent, as a two-person team: segmentation, positioning, pricing, client PoC and a commercial B2B2C launch.",
      "go to market", "go-to-market", "gtm", "launch strategy", "product launch", "launches", "launch", "pricing", "monetisation", "monetization", "positioning", "segmentation", "commercialisation", "commercialization", "market sizing", "tam"],
    ["poc", "MVP, PoC and pilots", "Strategy and discovery", "direct", "moved",
      "A 12-person procure-to-pay contact centre PoC across 5 live branches at Standard Bank South Africa, with no operational disruption - as a contractor.",
      "mvp", "minimum viable product", "proof of concept", "poc", "pocs", "pilot", "pilots", "prototype", "prototypes", "prototyping", "experiments"],
    ["bizcase", "Business case and ROI", "Strategy and discovery", "direct", "resume",
      "Medscheme (Proxy Product Owner): backlog ownership and ROI business case for a healthcare core system upgrade, with 3 business analysts on independent modules.",
      "business case", "business cases", "cost benefit", "cost-benefit", "roi", "return on investment", "financial model", "financial modelling", "financial modeling", "investment case", "value case"],
    ["research", "User and customer research", "Strategy and discovery", "direct", "frameworks",
      "Backed by 100-user primary research with Chase cardholders, then built as a working prototype - a scoring engine with an output layer that shows why each package scored as it did.",
      "user research", "customer research", "primary research", "market research", "user interviews", "customer interviews", "voice of customer", "voc", "surveys", "survey", "usability", "customer insights", "user insights", "customer needs", "user needs"],
    ["personas", "Personas and journeys", "Strategy and discovery", "direct", "dairy",
      "Designed for 8 personas across the value chain, not one 'customer'.",
      "persona", "personas", "user journey", "customer journey", "journey mapping", "journey maps", "jobs to be done", "jtbd", "customer experience", "user experience", "cx", "ux"],
    ["competitive", "Competitive analysis", "Strategy and discovery", "direct", "whatsapp",
      "Scored WhatsApp against Discord on group management, communication and tooling.",
      "competitive analysis", "competitor analysis", "competitive landscape", "competitive intelligence", "market analysis", "benchmarking", "competitors"],
    ["prioritise", "Prioritisation and trade-offs", "Strategy and discovery", "direct", "moved",
      "I set the sequencing basis (alert volume against booking impact) and held the resolution cadence with API and connector teams; the ground-level taxonomy analysis was owned by a product analyst on the workstream.",
      "prioritization", "prioritisation", "prioritize", "prioritise", "prioritizing", "prioritising", "trade-offs", "tradeoffs", "trade offs", "rice", "moscow", "kano", "sequencing"],
    ["okr", "OKRs, KPIs and strategy execution", "Strategy and discovery", "direct", "resume",
      "Banking Association South Africa: strategy map and balanced scorecard implementation in 6 months using Nihilent's LAMAT strategy-execution platform, translating organisational objectives into KPIs, data elements and calculation logic.",
      "okr", "okrs", "kpi", "kpis", "key performance indicators", "success metrics", "north star", "north-star", "metrics", "measurable outcomes", "balanced scorecard", "strategy execution"],

    // ---- Delivery
    ["reqs", "Requirements, PRDs and user stories", "Delivery", "direct", "who",
      "I have also used the SPIDR framework to break down epics into relevant user stories so that the requirements are MECE (Mutually Exclusive and Collectively Exhaustive).",
      "prd", "prds", "product requirements", "requirements", "requirement", "brd", "frd", "specifications", "specs", "user stories", "user story", "acceptance criteria", "epics", "documentation"],
    ["agile", "Agile, Scrum and SAFe", "Delivery", "direct", "resume",
      "SAFe Product Owner / Product Manager (POPM) - Scaled Agile | Certified Scrum Product Owner (CSPO) - Scrum Alliance",
      "agile", "scrum", "safe", "scaled agile", "sprint", "sprints", "pi planning", "kanban", "waterfall", "product owner", "cspo", "popm"],
    ["backlog", "Backlog ownership", "Delivery", "direct", "resume",
      "Medscheme (Proxy Product Owner): backlog ownership and ROI business case for a healthcare core system upgrade, with 3 business analysts on independent modules.",
      "backlog", "backlogs", "product backlog", "backlog grooming", "backlog refinement", "backlog management"],
    ["tools", "Jira, Confluence and product tools", "Delivery", "direct", "resume",
      "Tools: Jira | Jira Align | Confluence | Balsamiq | Roadmunk | Grafana | Kibana | SAS | MS Visio | TFS",
      "jira", "jira align", "confluence", "balsamiq", "roadmunk", "visio", "tfs", "aha!", "productboard"],
    ["wireframes", "Wireframes and mock screens", "Delivery", "direct", "resume",
      "Sole owner of cross-product greenfield initiatives with no data, benchmarks or team: scope definition, primary and secondary research, GTM strategy, feature mapping, mock screens, business case and cost-benefit analysis through to PoC decisions.",
      "wireframe", "wireframes", "wireframing", "mockup", "mockups", "mock-ups", "mock screens", "low-fidelity", "lo-fi"],
    ["figma", "Figma and high-fidelity design tools", "Delivery", "gap", "", "",
      "figma", "sketch", "adobe xd", "invision", "high-fidelity", "hi-fi"],
    ["scale", "Delivery at scale", "Delivery", "direct", "moved",
      "Travel and loyalty platform, moved on-premises to cloud: 3 launches for 5 enterprise clients in 12 months, zero critical defects, zero downtime.",
      "at scale", "scaling", "large-scale", "large scale", "enterprise scale", "releases", "shipping", "shipped"],

    // ---- Domains
    ["travel", "Travel", "Domain", "direct", "moved",
      "Partner travel and loyalty platform at JPMorgan Chase - flights, hotels, car and activities - with a 27-person cross-functional team across product, engineering, data and UX.",
      "travel", "ota", "online travel", "booking", "bookings", "hotels", "hotel", "flights", "flight", "airline", "airlines", "hospitality", "gds", "amadeus", "sabre", "travelport", "trips", "tourism", "car rental"],
    ["loyalty", "Loyalty and rewards", "Domain", "direct", "journey",
      "Customer loyalty evaluation product: a CEO's concept to a commercial B2B2C launch in 12 months, as a two-person team.",
      "loyalty", "rewards", "reward", "redemption", "redemptions", "miles", "loyalty program", "loyalty programme", "customer retention", "retention"],
    ["ecom", "E-commerce", "Domain", "direct", "resume",
      "Product leader, 18+ years, taking undefined mandates to shipped and adopted products across travel e-commerce, loyalty redemption, media & entertainment, banking procurement and regulated enterprise platforms.",
      "e-commerce", "ecommerce", "online retail", "marketplace", "marketplaces", "checkout", "consumer internet", "d2c", "digital commerce"],
    ["banking", "Banking and financial services", "Domain", "direct", "moved",
      "A 12-person procure-to-pay contact centre PoC across 5 live branches at Standard Bank South Africa, with no operational disruption - as a contractor.",
      "banking", "bank", "banks", "bfsi", "financial services", "fintech", "lending", "credit card", "credit cards", "cards", "wealth", "wealth management", "nbfc", "financial institution"],
    ["payments", "Payments", "Domain", "adjacent", "moved",
      "Shipped a new UI and 0→1 features along the way - guest flow and new forms of payment.",
      "payments", "payment", "payment gateway", "upi", "card issuing", "acquiring", "settlement", "settlements", "psp", "wallets", "remittance"],
    ["insurance", "Insurance and healthcare", "Domain", "adjacent", "resume",
      "Medscheme (Proxy Product Owner): backlog ownership and ROI business case for a healthcare core system upgrade, with 3 business analysts on independent modules.",
      "insurance", "insurtech", "healthcare", "healthtech", "claims", "medical"],
    ["enterprise", "Enterprise software and SaaS", "Domain", "direct", "moved",
      "Travel and loyalty platform, moved on-premises to cloud: 3 launches for 5 enterprise clients in 12 months, zero critical defects, zero downtime.",
      "saas", "enterprise software", "b2b", "b2b saas", "enterprise", "enterprise clients", "enterprise customers", "subscription"],
    ["consumer", "Consumer and B2B2C products", "Domain", "direct", "dayone",
      "Led product on a B2B2C travel and loyalty platform at that scale, through an on-prem-to-cloud rebuild: 3 launches for 5 enterprise clients, zero downtime.",
      "b2c", "b2b2c", "consumer", "consumers", "consumer-facing", "customer-facing", "end users", "end-users"],
    ["platform", "Platform products", "Domain", "direct", "resumeTr",
      "so decisions on ambiguous, continuously shifting architecture stayed business-driven rather than technology-driven.",
      "platform", "platforms", "platform product", "platform thinking", "multi-tenant", "multi tenant", "rules engine", "rbac", "access control", "core platform", "foundational"],
    ["media", "Media and entertainment", "Domain", "direct", "resume",
      "SuperSport and M-Net, South Africa: onsite lead for a content contracts, scheduling and inventory platform - 7 consecutive enterprise releases over 2.5 years, 2 analysts reporting in, offshore team of 30-40.",
      "media", "entertainment", "broadcasting", "broadcast", "ott", "streaming", "content platform", "scheduling"],
    ["procurement", "Procurement", "Domain", "direct", "moved",
      "A 12-person procure-to-pay contact centre PoC across 5 live branches at Standard Bank South Africa, with no operational disruption - as a contractor.",
      "procurement", "procure-to-pay", "procure to pay", "p2p", "sourcing", "purchasing", "spend management"],
    ["supplychain", "Supply chain and logistics", "Domain", "gap", "", "",
      "supply chain", "logistics", "warehouse", "warehousing", "fulfilment", "fulfillment", "inventory management", "last mile"],
    ["suppliers", "Supplier and partner integration", "Domain", "direct", "moved",
      "Supplier-error workstream (FIFT): support alerts down 50% and booking failures down 30% across 9 suppliers, with 38 standardised error categories.",
      "supplier", "suppliers", "partner integration", "partner integrations", "partners", "vendor", "vendors", "vendor management", "third party", "third-party", "connectors", "ecosystem"],
    ["onboarding", "Client onboarding and operating models", "Domain", "direct", "resume",
      "Proposed a redesigned enterprise client onboarding operating model - process mapping, waste elimination, automation opportunities and cross-functional RACI - estimated to move onboarding from 6-8 months to ~3 months including client UAT.",
      "onboarding", "client onboarding", "customer onboarding", "merchant onboarding", "operating model", "operating models", "process mapping"],

    // ---- AI
    ["ai", "AI products", "AI", "direct", "resumeAI",
      "Tata Safari AI Assistant - live multimodal RAG application, built solo end to end (2026)",
      "ai", "artificial intelligence", "ai product", "ai products", "ai-powered", "ai powered", "ai/ml", "ai-first", "applied ai", "ai-native", "ai features"],
    ["genai", "Generative AI and LLMs", "AI", "direct", "resumeAI",
      "LLM-assisted resume review (JPMC): designed key-term logic, synonym mapping and conflict rules, with human-in-the-loop review and a full audit trail - ~75% less review time per resume.",
      "generative ai", "genai", "gen ai", "llm", "llms", "large language model", "large language models", "foundation model", "foundation models", "gpt", "gemini", "claude", "chatbot", "chatbots", "conversational ai", "copilot"],
    ["rag", "RAG and vector search", "AI", "direct", "resume",
      "Multimodal RAG on Google Gemini with vector search, deployed on Streamlit Cloud.",
      "rag", "retrieval augmented", "retrieval-augmented", "vector", "vector database", "vector search", "embeddings", "semantic search", "knowledge base", "grounding"],
    ["aitrust", "Responsible AI, evaluation and human-in-the-loop", "AI", "direct", "resumeAI",
      "Builds AI where the constraint is trust rather than novelty: human-in-the-loop review with audit trails, compliance risk detection grounded in regulatory source documents, and an original AI Trustworthiness Matrix built on the NIST AI RMF.",
      "responsible ai", "ai governance", "ai risk", "ai ethics", "trustworthy ai", "nist", "ai rmf", "explainability", "eu ai act", "human in the loop", "human-in-the-loop", "hitl", "evals", "evaluation", "model evaluation", "hallucination", "hallucinations", "guardrails"],
    ["ml", "Machine learning", "AI", "adjacent", "resume",
      "Multimodal RAG on Google Gemini with vector search, deployed on Streamlit Cloud.",
      "machine learning", "ml", "ml models", "predictive", "predictive models", "recommendation engine", "recommendation engines", "recommender", "personalisation", "personalization", "data science", "deep learning", "computer vision", "nlp"],
    ["prompt", "Prompt engineering", "AI", "gap", "", "",
      "prompt engineering", "prompt design", "prompting", "prompts"],
    ["agentic", "Agentic AI and AI agents", "AI", "gap", "", "",
      "agentic", "ai agents", "agents", "agent orchestration", "multi-agent", "langchain", "langgraph", "mcp", "autonomous agents"],

    // ---- Technical
    ["apis", "APIs and integrations", "Technical", "direct", "moved",
      "I set the sequencing basis (alert volume against booking impact) and held the resolution cadence with API and connector teams; the ground-level taxonomy analysis was owned by a product analyst on the workstream.",
      "api", "apis", "rest", "restful", "graphql", "webhooks", "integration", "integrations", "microservices"],
    ["cloud", "Cloud migration", "Technical", "direct", "moved",
      "Travel and loyalty platform, moved on-premises to cloud: 3 launches for 5 enterprise clients in 12 months, zero critical defects, zero downtime.",
      "cloud", "cloud migration", "aws", "azure", "gcp", "on-prem", "on-premises", "data centre", "data center", "migration", "migrations", "modernisation", "modernization"],
    ["build", "Hands-on building and coding", "Technical", "direct", "resumeAI",
      "Goal-Based Travel Package prototype: took a scoring framework out of documents and into working software, coded solo at an internal hackathon using Copilot - JavaScript scoring engine, externalised configuration, and an HTML output layer rendering each package with a visual justification of its score.",
      "javascript", "coding", "programming", "hands-on", "hands on", "builder", "technical product manager", "technical background", "engineering background"],
    ["python", "Python", "Technical", "gap", "", "",
      "python", "pandas", "jupyter"],
    ["sql", "SQL and querying data", "Technical", "gap", "", "",
      "sql", "mysql", "postgres", "postgresql", "bigquery", "queries", "querying"],
    ["dash", "Dashboards and monitoring tools", "Technical", "direct", "resume",
      "Tools: Jira | Jira Align | Confluence | Balsamiq | Roadmunk | Grafana | Kibana | SAS | MS Visio | TFS",
      "grafana", "kibana", "sas", "dashboards", "dashboard", "monitoring", "observability", "splunk", "datadog"],
    ["experiments", "A/B testing and product analytics", "Technical", "gap", "", "",
      "a/b testing", "a/b test", "a/b tests", "ab testing", "experimentation", "split testing", "multivariate", "product analytics", "funnel", "funnels", "cohort", "cohorts", "amplitude", "mixpanel", "google analytics", "tableau", "looker", "power bi"],

    // ---- Governance and change
    ["regulatory", "Regulatory compliance", "Governance and change", "direct", "moved",
      "Enterprise dark-pattern regulation (FTC, CA, TX, MA) across 40 stakeholders. I built the governance model and translated regulation into product-level decisions, inside the mandated timelines.",
      "regulatory", "regulation", "regulations", "compliance", "compliant", "regulated", "audit", "audits", "consumer protection", "dark patterns"],
    ["privacy", "Data privacy", "Governance and change", "adjacent", "resume",
      "Led enterprise dark-pattern regulatory compliance (FTC, CA, TX, MA; equivalent to India CPA 2019 and DPDP Act 2023) across 15+ product teams and 40 stakeholders with no direct authority - built the governance model, translated regulation into product-level decisions, 100% compliant within mandated timelines.",
      "privacy", "data privacy", "gdpr", "dpdp", "ccpa", "pii", "data protection", "consent"],
    ["risk", "Risk and controls", "Governance and change", "adjacent", "who",
      "Product requirements were fluid, and Risk and Controls stakeholders were panicking. However, I made sure the cross-product requirements were documented, communicated, finalised and delivered within the given timeline.",
      "risk", "risks", "risk management", "controls", "operational risk", "model risk"],
    ["kyc", "KYC, AML and fraud", "Governance and change", "gap", "", "",
      "kyc", "aml", "anti-money laundering", "fraud", "fraud prevention", "sanctions"],
    ["process", "Process improvement", "Governance and change", "direct", "moved",
      "It rolled out nationally and won the CIPS Southern Africa Best Process Improvement award.",
      "process improvement", "process re-engineering", "process reengineering", "re-engineering", "lean", "six sigma", "operational excellence", "efficiency", "automation", "waste elimination"],
    ["transformation", "Transformation and adoption", "Governance and change", "direct", "resume",
      "Achieved 100% client adoption with zero downtime across 3 distinct launches for 5 enterprise clients within 12 months",
      "transformation", "digital transformation", "change management", "adoption", "organisational change", "organizational change"],
    ["raci", "Governance models and RACI", "Governance and change", "direct", "resume",
      "Stakeholder Management | Agile & SAFe | Backlog Management | RACI | Mentoring",
      "raci", "governance model", "operating rhythm", "decision rights"],

    // ---- Leadership
    ["people", "Managing product people", "Leadership", "direct", "resume",
      "Managed 4 product managers, each owning an independent partner workstream with dotted-line authority over their engineering and architecture teams",
      "people management", "direct reports", "manage a team", "managing a team", "lead a team", "leading a team", "team of product managers", "manage product managers", "people leader", "line management", "team leadership", "lead and grow", "mentor", "mentoring", "coach", "coaching"],
    ["hiring", "Hiring and performance management", "Leadership", "gap", "", "",
      "hire and develop", "hiring and", "hiring plan", "hiring decisions", "recruit and", "recruiting and", "performance reviews", "performance management", "headcount", "build the team", "grow the team", "build a team", "scale the team"],
    ["influence", "Stakeholders and influence without authority", "Leadership", "direct", "dayone",
      "Drove a regulatory initiative across 15+ cross-product teams and 40 stakeholders - legal, risk, engineering, data, design - with no direct reporting line, to achieve 100% compliance.",
      "stakeholder", "stakeholders", "stakeholder management", "influence", "influencing", "without authority", "executive", "executives", "c-suite", "cxo", "senior leadership", "leadership team", "alignment"],
    ["xfn", "Cross-functional leadership", "Leadership", "direct", "moved",
      "Partner travel and loyalty platform at JPMorgan Chase - flights, hotels, car and activities - with a 27-person cross-functional team across product, engineering, data and UX.",
      "cross-functional", "cross functional", "matrix", "matrixed", "engineering, design", "design and engineering", "multi-disciplinary", "multidisciplinary"],
    ["pnl", "P&L and budget ownership", "Leadership", "adjacent", "contact",
      "Not a formal P&L. At JPMorgan, Gaurav worked on capacity allocation and approval per initiative, not an annual budget in USD.",
      "p&l", "profit and loss", "revenue ownership", "revenue targets", "budget ownership", "budget", "budgets", "budgeting", "cost center", "cost centre", "commercial ownership", "revenue"],
    ["training", "Training and capability building", "Leadership", "direct", "resume",
      "Swanubhava™, my product management behavioural model (8 observable behaviours inspired by the ICF Core Competencies, scored on a rubric), runs on Puppeteer, a scenario engine I built solo.",
      "training", "capability building", "enablement", "learning and development", "l&d", "upskilling", "upskill", "workshops", "product craft", "product culture"],
    ["consulting", "Consulting and client-facing work", "Leadership", "direct", "resume",
      "SuperSport and M-Net, South Africa: onsite lead for a content contracts, scheduling and inventory platform - 7 consecutive enterprise releases over 2.5 years, 2 analysts reporting in, offshore team of 30-40.",
      "consulting", "consultant", "client-facing", "client facing", "advisory", "customer success"],
    ["global", "International and distributed teams", "Leadership", "direct", "resume",
      "Delivery across India, South Africa and the UK.",
      "global", "international", "distributed", "distributed teams", "offshore", "onshore", "multi-country", "geographies", "remote teams", "time zones"],

    // ---- How he works (from recommendations - other people's words)
    ["ambiguity", "Comfort with ambiguity", "How he works", "direct", "moved",
      "Gaurav thrives where most people falter: in absolute ambiguity.",
      "ambiguity", "ambiguous", "fast-paced", "fast paced", "startup environment", "uncertainty", "chaos"],
    ["collab", "Collaboration", "How he works", "direct", "words",
      "I valued Gaurav's collaborative approach, product expertise, and commitment to delivering high-quality outcomes.",
      "collaboration", "collaborative", "collaborate", "partner with", "work closely", "teamwork"],
    ["analytical", "Analytical problem solving", "How he works", "direct", "words",
      "He is a thoughtful, detail-oriented product professional with strong analytical skills and a talent for turning complex challenges into clear, actionable solutions.",
      "analytical", "problem solving", "problem-solving", "critical thinking", "first principles", "structured thinking", "detail-oriented", "detail oriented", "attention to detail", "data-driven", "data driven"],
    ["customer", "Customer focus and strategic thinking", "How he works", "direct", "words",
      "I would highly recommend him to any organization looking for a strategic, customer-focused, and execution-oriented product professional.",
      "customer-centric", "customer centric", "customer-focused", "customer focused", "customer obsession", "user-centric", "user centric", "strategic thinking", "strategic thinker"],
  ];

  // One honest line for each 'related experience' row: how far the evidence goes (Honest Framing Rules)
  var NOTE = {
    payments: "Payment features on a travel platform - not payments infrastructure or rails.",
    insurance: "A healthcare core system upgrade - not insurance products.",
    ml: "Applied AI - LLMs and RAG - rather than classical machine learning models.",
    privacy: "Regulatory compliance work equivalent to India's DPDP Act - not a standalone privacy programme.",
    risk: "Worked alongside Risk and Controls on regulatory change - not a risk-management role.",
    pnl: "No formal P&L ownership.",
  };

  // Scope signals from Gaurav's 'Open to' line: roles mostly about these may not be what he's looking for
  var SCOPE = [
    ["Scrum Master", ["scrum master"]],
    ["Business Analyst", ["business analyst role", "role: business analyst", "position: business analyst", "as a business analyst"]],
    ["QA / testing", ["quality assurance", "qa engineer", "test engineer", "test cases", "uat testing"]],
    ["Project management", ["project manager role", "project coordinator", "pmo"]],
  ];
  var OPEN_TO = "Director / VP / Head of Product, or senior Product Manager roles where the scope is real. And select engagements.";
  var COMP_WORDS = ["salary", "ctc", "compensation", "lpa", "per annum", "pay range", "pay band", "remuneration"];

  // ---------- matching (same approach as the Parse & Gap scanner) ----------
  function norm(s) {
    return " " + String(s || "").toLowerCase()
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/→/g, "→")
      .replace(/[^a-z0-9+#&/\-→ ]+/g, " ").replace(/\s+/g, " ") + " ";
  }
  function countIn(hay, needle) {
    var base = norm(needle).trim(), c = 0;
    [" " + base + " ", " " + base + "s "].forEach(function (n) {
      var i = 0;
      while ((i = hay.indexOf(n, i)) !== -1) { c++; i += n.length - 1; }
    });
    return c;
  }

  function mapJD(text) {
    var J = norm(text), rows = [];
    D.forEach(function (e) {
      var hits = 0, said = [];
      e.slice(6).forEach(function (v) { var n = countIn(J, v); if (n) { hits += n; said.push(v); } });
      if (hits) rows.push({ id: e[0], label: e[1], group: e[2], status: e[3], src: SRC[e[4]] || null, quote: e[5], note: NOTE[e[0]] || "", hits: hits, said: said.slice(0, 3) });
    });
    rows.sort(function (a, b) { return b.hits - a.hits || a.label.localeCompare(b.label); });
    var scope = SCOPE.filter(function (s) { return s[1].some(function (v) { return countIn(J, v) > 0; }); }).map(function (s) { return s[0]; });
    var comp = COMP_WORDS.some(function (w) { return countIn(J, w) > 0; });
    var words = J.trim().split(" ").filter(Boolean).length;
    return {
      rows: rows, words: words, scope: scope, comp: comp, openTo: OPEN_TO,
      count: {
        direct: rows.filter(function (r) { return r.status === "direct"; }).length,
        adjacent: rows.filter(function (r) { return r.status === "adjacent"; }).length,
        gap: rows.filter(function (r) { return r.status === "gap"; }).length,
      },
    };
  }

  window.RoleMap = { mapJD: mapJD, entries: D.length, sources: SRC };
})();
