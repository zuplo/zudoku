import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker.js?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker.js?worker";
import GraphQLWorker from "monaco-graphql/esm/graphql.worker.js?worker";

type MonacoEnvironment = {
  getWorker?: (_workerId: string, label: string) => Worker;
};

const globalScope = globalThis as typeof globalThis & {
  MonacoEnvironment?: MonacoEnvironment;
};

const monacoEnvironment = globalScope.MonacoEnvironment;

globalScope.MonacoEnvironment = {
  ...monacoEnvironment,
  getWorker(workerId: string, label: string) {
    if (label === "json") {
      return new JsonWorker();
    }

    if (label === "graphql") {
      return new GraphQLWorker();
    }

    return (
      monacoEnvironment?.getWorker?.(workerId, label) ?? new EditorWorker()
    );
  },
};
