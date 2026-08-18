import { useState } from "react";
import "./App.css";
import Hub from "./components/Hub.jsx";
import Lab1 from "./components/Lab1.jsx";
import Lab2 from "./components/Lab2.jsx";
import Lab3 from "./components/Lab3.jsx";
import Lab4 from "./components/Lab4.jsx";
import Landing from "./components/Landing.jsx";
import Layout from "./components/Layout.jsx";
import WrapUp from "./components/WrapUp.jsx";
import { PasscodeContext, loadPasscode, savePasscode } from "./state/passcode.js";
import { useLabState } from "./state/useLabState.js";

const LAB_SCREENS = {
  lab1: Lab1,
  lab2: Lab2,
  lab3: Lab3,
  lab4: Lab4,
  wrapUp: WrapUp,
};

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

  const LabScreen = LAB_SCREENS[route];

  return (
    <PasscodeContext.Provider value={passcode}>
      <Layout>
        {route === "landing" && (
          <Landing initialStudent={labState.state.student} onSuccess={handleLandingSuccess} />
        )}
        {route === "hub" && <Hub labState={labState} onNavigate={setRoute} />}
        {LabScreen && <LabScreen labState={labState} onNavigate={setRoute} />}
        {route === "finish" && <p>Finish screen coming soon.</p>}
        {route === "instructor" && <p>Instructor page coming soon.</p>}
      </Layout>
    </PasscodeContext.Provider>
  );
}

export default App;
