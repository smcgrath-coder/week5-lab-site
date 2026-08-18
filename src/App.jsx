import { useState } from "react";
import "./App.css";
import Finish from "./components/Finish.jsx";
import Hub from "./components/Hub.jsx";
import Instructor from "./components/Instructor.jsx";
import Lab1 from "./components/Lab1.jsx";
import Lab2 from "./components/Lab2.jsx";
import Lab3 from "./components/Lab3.jsx";
import Lab4 from "./components/Lab4.jsx";
import Landing from "./components/Landing.jsx";
import Layout from "./components/Layout.jsx";
import WrapUp from "./components/WrapUp.jsx";
import { createInitialState } from "./state/labState.js";
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
  const [justCompletedLanding, setJustCompletedLanding] = useState(false);

  function handleLandingSuccess({ name, lane, acknowledgedPHI, passcode: enteredPasscode }) {
    labState.setStudent({ name, lane, acknowledgedPHI });
    savePasscode(enteredPasscode);
    setPasscode(enteredPasscode);
    setJustCompletedLanding(true);
    setRoute("hub");
  }

  function handleStartOver() {
    labState.restoreState(createInitialState());
    savePasscode("");
    setPasscode("");
    setJustCompletedLanding(false);
    setRoute("landing");
  }

  const LabScreen = LAB_SCREENS[route];

  return (
    <PasscodeContext.Provider value={passcode}>
      <Layout>
        {route === "landing" && (
          <Landing initialStudent={labState.state.student} onSuccess={handleLandingSuccess} />
        )}
        {route === "hub" && (
          <Hub
            labState={labState}
            onNavigate={setRoute}
            onStartOver={handleStartOver}
            isFirstVisit={justCompletedLanding}
          />
        )}
        {LabScreen && <LabScreen labState={labState} onNavigate={setRoute} />}
        {route === "finish" && <Finish labState={labState} onNavigate={setRoute} />}
        {route === "instructor" && <Instructor />}
      </Layout>
    </PasscodeContext.Provider>
  );
}

export default App;
