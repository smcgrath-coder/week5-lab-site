import ReflectionField from "./ReflectionField";
import { LABS } from "../data/labs";

export default function WrapUp({ labState, onNavigate }) {
  const wrapUp = labState.state.labs.wrapUp;

  return (
    <div className="lab-screen">
      <button type="button" className="back-link" onClick={() => onNavigate("hub")}>
        ← Back to hub
      </button>

      <h1>Wrap-Up</h1>
      <p>{LABS.wrapUp.note}</p>

      <ReflectionField
        label={LABS.wrapUp.prompt}
        value={wrapUp.paragraph}
        onChange={(value) => labState.updateLab("wrapUp", { paragraph: value })}
      />

      <button type="button" className="finish-link" onClick={() => onNavigate("finish")}>
        Finish &amp; submit →
      </button>
    </div>
  );
}
