export const LABS = {
  intro: {
    title: "Working With AI — Prompting, Breaking, and Grounding",
    courseLine: "MHI 289A • UC Davis School of Medicine • Summer 2026",
    howToUse: [
      "Chat with each model directly in the panels below, then fill in the reflection fields as you go — don't wait until the end and try to reconstruct what happened from memory.",
      "You're graded on honesty and depth, not on getting clean, impressive-looking results. A record that documents a failure you almost missed is worth more than one that claims everything worked the first time. The failures are the assignment.",
    ],
    lanesNote:
      "This class mixes clinical and operational health-informatics students. Most tasks let you pick a lane — clinical (patient-facing scenarios) or operational (policy, workflow, and administrative scenarios) — and you can switch lanes task by task. There's no requirement to stay in one lane all week.",
    phiWarning:
      "Never put real patient information or PHI into any of these tools. Use the fictional cases provided or material you write yourself. If you wouldn't post it publicly, it doesn't go in the prompt box.",
  },

  lab1: {
    goal: "Run the same underlying task two ways — a fast, throwaway prompt and a deliberately structured one — so you can see, in your own transcripts, what structure actually buys you.",
    taskOptions: [
      {
        id: "t2dDischarge",
        lane: "clinical",
        label:
          "Explain type 2 diabetes discharge instructions in plain language for a patient",
      },
      {
        id: "medications",
        lane: "clinical",
        label:
          "Explain two fictional medications to a worried family member",
      },
      {
        id: "policySummary",
        lane: "operational",
        label: "Write a plain-language summary of a policy",
      },
      {
        id: "schedulingOnboarding",
        lane: "operational",
        label:
          "Write onboarding instructions for a fictional clinic scheduling system",
      },
    ],
    techniques: [
      { id: "role", label: "Give the model a role" },
      { id: "stepByStep", label: "Ask for step-by-step reasoning" },
      { id: "workedExample", label: "Provide a worked example" },
      { id: "refining", label: "Refine across turns" },
    ],
    reflections: {
      runA: { prompt: "Look at what came back — you'll compare the two versions below." },
      runB: { prompt: "Look at what came back — you'll compare the two versions below." },
      comparison: {
        prompt:
          "What actually changed between the two? Be specific — not 'B was better'…",
        graded: true,
      },
    },
  },

  lab2: {
    goal: "Every task below has a way it tends to fail. I am not going to tell you where. Part of the exercise is catching it.",
    t2a: {
      id: "t2a",
      label: "Reading level",
      description:
        "Take a piece of clinical or operational text and ask the model to rewrite it at a specific target reading level for patients or staff.",
      reflection:
        "What I noticed when I looked closely (accuracy, reading level, anything off)",
    },
    t2b: {
      id: "t2b",
      label: "Source to structured summary",
      description:
        "Give the model a source document and ask it to produce a structured summary from it — nothing more, nothing less.",
      reflection: "Did anything appear that wasn't in my source?",
    },
    t2c: {
      id: "t2c",
      label: "Synthesis",
      description:
        "Same task for everyone: ask the model to synthesize two source items into a short combined summary.",
      reflection: "Check the citations carefully.",
    },
  },

  lab3: {
    goal: "Lab 3 is the core of the week: make each model fail on purpose, then document exactly how you caught it.",
    failureCategories: [
      { id: "confidentWrong", label: "Confident wrong answer" },
      {
        id: "fabricatedCitation",
        label: "Fabricated citation, guideline, study, or statistic",
      },
      { id: "biased", label: "Biased or skewed completion" },
      { id: "contradicts", label: "Contradicts itself across turns" },
    ],
    documentationFields: [
      {
        id: "tried",
        label: "What I was trying to make it do + prompts used",
      },
      { id: "produced", label: "What it produced" },
      {
        id: "caught",
        label:
          "How I caught it — what tipped me off, and how I confirmed it was wrong",
      },
    ],
    optionalPrompt: "A failure that almost got past you (optional)",
    minAttempts: 2,
    minDistinctCategories: 2,
  },

  lab4: {
    goal: "Run the same task two ways — once with no source material, once grounded in a source you provide — and compare what grounding fixes and what it doesn't.",
    fields: {
      taskAndSource: {
        label: "The task, and the source text I used for the grounded run",
      },
      ungrounded: { label: "Ungrounded run notes" },
      grounded: { label: "Grounded run notes" },
      reflection: {
        label:
          "What did grounding fix? What did it NOT fix? Did any error survive even with the source in front of it?",
      },
    },
  },

  wrapUp: {
    prompt: "What this week changed for me",
    note: "This feeds directly into your Week 6 lightning talk.",
  },
};
