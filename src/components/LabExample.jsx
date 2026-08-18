export default function LabExample({ children }) {
  return (
    <details className="lab-example">
      <summary>See a worked example</summary>
      <div className="lab-example-body">{children}</div>
    </details>
  );
}
