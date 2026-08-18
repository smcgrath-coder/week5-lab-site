export const LABS = {
  intro: {
    title: "Working With AI — Prompting, Breaking, and Grounding",
    courseLine: "MHI 289A",
    howToUse: [
      "Chat with each model directly in the panels below, then fill in the reflection fields as you go. Don't wait until the end and try to reconstruct what happened from memory.",
      "You're graded on honesty and depth, not on getting clean, impressive-looking results. A record that documents a failure you almost missed is worth more than one that claims everything worked the first time. The failures are the assignment.",
    ],
    lanesNote:
      "This class mixes clinical and operational health-informatics students. Most tasks let you pick a lane, either clinical (patient-facing scenarios) or operational (policy, workflow, and administrative scenarios), and you can switch lanes task by task. There's no requirement to stay in one lane all week.",
    phiWarning:
      "Never put real patient information or PHI into any of these tools. Use the fictional cases provided or material you write yourself. If you wouldn't post it publicly, it doesn't go in the prompt box.",
  },

  lab1: {
    goal: "Run the same underlying task two ways: a fast, throwaway prompt, and a deliberately structured one. Then you can see in your own transcripts what structure actually buys you.",
    howTo: [
      "Pick one task below.",
      "Send a fast, unstructured prompt for that task in Version A.",
      "Once Version A replies, check off the techniques you're using, then send a deliberately structured prompt for the same task in Version B.",
      "Answer the comparison question at the bottom.",
    ],
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
      runA: { prompt: "Look at what came back. You'll compare the two versions below." },
      runB: { prompt: "Look at what came back. You'll compare the two versions below." },
      comparison: {
        prompt:
          "What actually changed between the two? Be specific, not just 'B was better.'",
        graded: true,
      },
    },
  },

  lab2: {
    goal: "Every task below has a way it tends to fail. I am not going to tell you where. Part of the exercise is catching it.",
    howTo: [
      "Use the tabs above to move between the three tasks (2A, 2B, 2C), in any order.",
      "For each task, run the chat, then answer its reflection question below the chat.",
      "A tab gets a checkmark once its chat and reflection are both done — that's just for tracking, not a required order.",
    ],
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
        "Give the model a source document and ask it to produce a structured summary from it, nothing more, nothing less.",
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
    howTo: [
      "Pick a failure category below for Attempt 1, then try to provoke that kind of failure in the chat underneath it. Adversarial prompting is fair game — you're allowed to push, rephrase, and try again within that one chat.",
      "Once you have an exchange that shows the failure (or clearly shows you couldn't provoke it after real effort), fill in the three documentation fields for that attempt.",
      "Click \"+ Add another failure attempt\" to start the next one. You need at least 2 attempts total, using at least 2 different categories.",
      "Not sure what \"caught\" means in practice? See the worked example below.",
    ],
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
          "How I caught it: what tipped me off, and how I confirmed it was wrong",
      },
    ],
    optionalPrompt: "A failure that almost got past you (optional)",
    minAttempts: 2,
    minDistinctCategories: 2,
    example: {
      category: "Fabricated citation, guideline, study, or statistic",
      exchange: [
        {
          role: "user",
          content:
            "Summarize the current guideline on ACE inhibitor use during pregnancy, and cite your source.",
        },
        {
          role: "assistant",
          content:
            "Per ACOG Practice Bulletin No. 245 (2024), ACE inhibitors are contraindicated in all trimesters due to fetal renal toxicity, and patients should be switched to labetalol or nifedipine prior to conception when possible.",
        },
      ],
      fields: {
        tried:
          "Asked for a guideline summary with a citation, on a topic I could actually check afterward.",
        produced:
          "A confident answer citing \"ACOG Practice Bulletin No. 245 (2024)\" with a specific recommendation.",
        caught:
          "I looked up ACOG's actual bulletin list and No. 245 doesn't cover this topic. When I asked the model to give me the bulletin's publication date again, it gave a different year than the first answer. The clinical content sounded plausible, which is exactly what made it worth checking.",
      },
    },
  },

  lab4: {
    goal: "Run the same task two ways: once with no source material, once grounded in a source you provide. Then compare what grounding fixes and what it doesn't.",
    howTo: [
      "Fill in the field below: write the task you'll give the model, and paste in the source text you'll use for the grounded run.",
      "Run the ungrounded chat first, using only the task — no source.",
      "Run the grounded chat next, pasting the source in along with the same task.",
      "Answer the reflection at the bottom, comparing what grounding fixed and what it didn't.",
      "Not sure what to look for? See the worked example below.",
    ],
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
    example: {
      taskAndSource:
        "Task: summarize this clinic's new patient intake policy in 3 bullet points for front-desk staff. Source: [a two-paragraph fictional intake policy pasted from the case pack]",
      ungrounded:
        "Without the source, the model produced 3 plausible-sounding bullet points, but one of them invented a $25 late-arrival fee our policy doesn't mention anywhere.",
      grounded:
        "With the source pasted in, the fee disappeared and the three bullets matched our actual steps. The model still added one detail on its own: a \"15 minutes early\" arrival recommendation that isn't stated in the source.",
      reflection:
        "Grounding fixed the invented fee, but it didn't stop the model from adding one small unstated detail. Even with a source in front of it, I'd still want to double-check the output line by line rather than trust it because a source was provided.",
    },
  },

  wrapUp: {
    prompt: "What this week changed for me",
    note: "This feeds directly into your Week 6 lightning talk.",
  },
};
