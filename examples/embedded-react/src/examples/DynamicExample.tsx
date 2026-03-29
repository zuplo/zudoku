import { useState } from "react";
import { ZudokuEmbedded } from "zudoku/components";

const apiSpecs = {
  petstore: {
    name: "Petstore API",
    url: "https://petstore3.swagger.io/api/v3/openapi.json",
  },
  github: {
    name: "GitHub API",
    url: "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json",
  },
};

type ApiKey = keyof typeof apiSpecs;

export function DynamicExample() {
  const [selectedApi, setSelectedApi] = useState<ApiKey>("petstore");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="example-controls">
        <label htmlFor="api-select">Select API:</label>
        <select
          id="api-select"
          value={selectedApi}
          onChange={(e) => setSelectedApi(e.target.value as ApiKey)}
        >
          {Object.entries(apiSpecs).map(([key, { name }]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <ZudokuEmbedded
          key={selectedApi}
          openApi={{
            type: "url",
            url: apiSpecs[selectedApi].url,
          }}
          config={{
            site: {
              title: apiSpecs[selectedApi].name,
            },
          }}
        />
      </div>
    </div>
  );
}
