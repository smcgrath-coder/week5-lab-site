import { useState } from "react";
import "./App.css";
import Landing from "./components/Landing.jsx";
import Layout from "./components/Layout.jsx";
import { PasscodeContext, loadPasscode, savePasscode } from "./state/passcode.js";
import { useLabState } from "./state/useLabState.js";

function hasCompletedLanding(state) {
  return Boolean(state.student.name && state.student.lane && state.student.acknowledgedPHI);
}

function computeInitialRoute(state) {
  if (typeof window !== "undefined" && window.location.hash === "#instructor") {
    return "instructor";
  }
  if (hasCompletedLanding(state) && loadPasscode()) {
    return "hub";
  }
  return "landing";
}

function App() {
  const labState = useLabState();
  const [route, setRoute] = useState(() => computeInitialRoute(labState.state));
  const [passcode, setPasscode] = useState(() => loadPasscode());

  function handleLandingSuccess({ name, lane, acknowledgedPHI, passcode: enteredPasscode }) {
    labState.setStudent({ name, lane, acknowledgedPHI });
    savePasscode(enteredPasscode);
    setPasscode(enteredPasscode);
    setRoute("hub");
  }

  return (
    <PasscodeContext.Provider value={passcode}>
      <Layout>
        {route === "landing" && (
          <Landing initialStudent={labState.state.student} onSuccess={handleLandingSuccess} />
        )}
        {route !== "landing" && route !== "instructor" && (
          <p>Welcome back, {labState.state.student.name || "there"} — the lab hub is coming next.</p>
        )}
        {route === "instructor" && <p>Instructor page coming soon.</p>}
      </Layout>
    </PasscodeContext.Provider>
  );
}

export default App;
