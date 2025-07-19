import Editor from "@monaco-editor/react";

const CodeEditor = () => {
  return (
    <Editor
      height="600px"
      defaultLanguage="javascript"
      defaultValue="// Écrivez votre code ici"
      theme="vs-dark"
    />
  );
};

export default CodeEditor;
