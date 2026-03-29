import { ZudokuEmbedded } from "zudoku/components";

export function URLExample() {
  return (
    <div className="embedded-container">
      <ZudokuEmbedded
        openApi={{
          type: "url",
          url: "https://petstore3.swagger.io/api/v3/openapi.json",
        }}
        config={{
          site: {
            title: "Petstore API",
          },
        }}
      />
    </div>
  );
}
