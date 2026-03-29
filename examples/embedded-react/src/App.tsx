import { useState } from "react";
import { URLExample } from "./examples/URLExample";
import { StringExample } from "./examples/StringExample";
import { ObjectExample } from "./examples/ObjectExample";
import { DynamicExample } from "./examples/DynamicExample";

type ExampleType = "url" | "string" | "object" | "dynamic";

const examples: Record<
  ExampleType,
  { title: string; description: string; component: () => JSX.Element }
> = {
  url: {
    title: "URL-based Loading",
    description: "Load OpenAPI spec from a remote URL",
    component: URLExample,
  },
  string: {
    title: "String-based Loading",
    description: "Embed OpenAPI spec as a raw YAML/JSON string",
    component: StringExample,
  },
  object: {
    title: "Object-based Loading",
    description: "Use a parsed JavaScript object",
    component: ObjectExample,
  },
  dynamic: {
    title: "Dynamic Switching",
    description: "Switch between multiple API specs dynamically",
    component: DynamicExample,
  },
};

function App() {
  const [currentExample, setCurrentExample] = useState<ExampleType>("url");

  const Example = examples[currentExample].component;

  return (
    <div>
      <header className="app-header">
        <h1>🚀 Zudoku Embedded Example</h1>
        <p>Interactive demonstration of embedding Zudoku in React applications</p>
      </header>

      <div className="app-container">
        <aside className="sidebar">
          <nav>
            <ul className="sidebar-nav">
              {Object.entries(examples).map(([key, { title, description }]) => (
                <li key={key}>
                  <button
                    className={currentExample === key ? "active" : ""}
                    onClick={() => setCurrentExample(key as ExampleType)}
                  >
                    <div>
                      <strong>{title}</strong>
                    </div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "0.25rem" }}>
                      {description}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="content">
          <Example />
        </main>
      </div>
    </div>
  );
}

export default App;
