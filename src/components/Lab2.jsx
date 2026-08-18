import { useState } from "react";
import ChatPanel from "./ChatPanel";
import LabProgress from "./LabProgress";
import ReflectionField from "./ReflectionField";
import { CASE_PACK } from "../data/casePack";
import { LABS } from "../data/labs";

function hasAssistantReply(conversation) {
  return Boolean(conversation?.messages?.some((m) => m.role === "assistant"));
}

function nonBlank(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isTaskDone(task) {
  return hasAssistantReply(task.chat) && nonBlank(task.reflection);
}

function casesFor(usedFor, lane) {
  return CASE_PACK.filter((c) => c.usedFor === usedFor && (!lane || c.lane === lane)).map((c) => c.id);
}

const TABS = [
  { id: "t2a", label: "2A — Reading level" },
  { id: "t2b", label: "2B — Source to summary" },
  { id: "t2c", label: "2C — Synthesis" },
];

export default function Lab2({ labState, onNavigate }) {
  const lab2 = labState.state.labs.lab2;
  const studentLane = labState.state.student.lane;
  const [activeTab, setActiveTab] = useState("t2a");

  const progressSteps = TABS.map((tab) => ({ label: tab.label, done: isTaskDone(lab2[tab.id]) }));

  function updateTask(taskId, patch) {
    labState.updateLab("lab2", { [taskId]: { ...lab2[taskId], ...patch } });
  }

  // A task's own lane is a starting point, not a commitment — until the
  // student explicitly picks one for this task, default to the lane they
  // chose on landing (per the landing page's own promise: "just a starting
  // point"), rather than showing both lanes' cases until clicked.
  function effectiveLane(taskLane) {
    return taskLane ?? studentLane;
  }

  function chatHandlersFor(taskId) {
    const path = ["lab2", taskId, "chat"];
    return {
      onUpdate: ({ model, messages }) => labState.setConversationState(path, { model, messages }),
      onTryDifferentModel: () => labState.clearConversation(path),
    };
  }

  return (
    <div className="lab-screen">
      <button type="button" className="back-link" onClick={() => onNavigate("hub")}>
        ← Back to hub
      </button>

      <h1>Lab 2 — Applied Task Labs</h1>
      <p>{LABS.lab2.goal}</p>
      <LabProgress steps={progressSteps} />
      <div className="lab-howto" data-testid="lab-howto">
        <ol>
          {LABS.lab2.howTo.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab-button${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label} {isTaskDone(lab2[tab.id]) && "✓"}
          </button>
        ))}
      </div>

      {activeTab === "t2a" && (
        <section>
          <h2>{LABS.lab2.t2a.label}</h2>
          <p>{LABS.lab2.t2a.description}</p>
          <div className="lane-toggle">
            {["clinical", "operational"].map((lane) => (
              <button
                key={lane}
                type="button"
                aria-pressed={effectiveLane(lab2.t2a.lane) === lane}
                className={`lane-toggle-button${effectiveLane(lab2.t2a.lane) === lane ? " selected" : ""}`}
                onClick={() => updateTask("t2a", { lane })}
              >
                {lane}
              </button>
            ))}
          </div>
          <ChatPanel
            conversation={lab2.t2a.chat}
            caseButtons={casesFor("task2a", effectiveLane(lab2.t2a.lane))}
            label="2A — Reading level"
            {...chatHandlersFor("t2a")}
          />
          <ReflectionField
            label={LABS.lab2.t2a.reflection}
            value={lab2.t2a.reflection}
            onChange={(value) => updateTask("t2a", { reflection: value })}
          />
        </section>
      )}

      {activeTab === "t2b" && (
        <section>
          <h2>{LABS.lab2.t2b.label}</h2>
          <p>{LABS.lab2.t2b.description}</p>
          <div className="lane-toggle">
            {["clinical", "operational"].map((lane) => (
              <button
                key={lane}
                type="button"
                aria-pressed={effectiveLane(lab2.t2b.lane) === lane}
                className={`lane-toggle-button${effectiveLane(lab2.t2b.lane) === lane ? " selected" : ""}`}
                onClick={() => updateTask("t2b", { lane })}
              >
                {lane}
              </button>
            ))}
          </div>
          <ChatPanel
            conversation={lab2.t2b.chat}
            caseButtons={casesFor("task2b", effectiveLane(lab2.t2b.lane))}
            label="2B — Source to structured summary"
            {...chatHandlersFor("t2b")}
          />
          <ReflectionField
            label={LABS.lab2.t2b.reflection}
            value={lab2.t2b.reflection}
            onChange={(value) => updateTask("t2b", { reflection: value })}
          />
        </section>
      )}

      {activeTab === "t2c" && (
        <section>
          <h2>{LABS.lab2.t2c.label}</h2>
          <p>{LABS.lab2.t2c.description}</p>
          <ChatPanel
            conversation={lab2.t2c.chat}
            caseButtons={casesFor("task2c", null)}
            label="2C — Synthesis"
            {...chatHandlersFor("t2c")}
          />
          <ReflectionField
            label={LABS.lab2.t2c.reflection}
            value={lab2.t2c.reflection}
            onChange={(value) => updateTask("t2c", { reflection: value })}
          />
        </section>
      )}

      <button type="button" className="back-link" onClick={() => onNavigate("hub")}>
        ← Back to hub
      </button>
    </div>
  );
}
