/**
 * Zudoku takes inspiration from some of the great features os Docusaurus.
 * As such we duplicate some of the Docusaurus documentation to provide
 * a consistent experience and make migration easier.
 *
 * Docusaurus Docs are licensed under Creative Commons Attribution 4.0
 * International (CC BY 4.0). This means that any doc we copy content from
 * needs to be attributed and linked to the original source.
 */
export function DocusaurusDocsLicense({ sourceUrl }: { sourceUrl: string }) {
  return (
    <p>
      Portions of this document are adapted from from the{" "}
      <a href="https://docusaurus.io/">Docusaurus project</a>, created by Meta
      Platforms, Inc., and is licensed under the{" "}
      <a href="https://github.com/facebook/docusaurus/blob/main/LICENSE-docs">
        Creative Commons Attribution 4.0 International
      </a>
      (CC BY 4.0) license. The <a href={sourceUrl}>original document</a>
      has been modified.
    </p>
  );
}
