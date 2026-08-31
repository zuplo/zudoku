# ARD v0.91 schema provenance

- Upstream:
  <https://raw.githubusercontent.com/ards-project/ard-spec/aa3e598bb7752a9175897823234311216acfa864/spec/schemas/ard-entry.schema.json>
- Revision: `aa3e598bb7752a9175897823234311216acfa864`
- Retrieved: 2026-08-28
- SHA-256: `011b86d55fd5d2883dffae3f0577d26f5efb56ca866eb079edbc78a628f95499`
- Conformance runner:
  <https://raw.githubusercontent.com/ards-project/ard-spec/aa3e598bb7752a9175897823234311216acfa864/conformance/bin/conformance-test>
- Conformance runner SHA-256: `15e7edd544c5d77bba80a13e85181adc6fa8c909245b4bfec13f399d86e2b47c`

The upstream schema's root `$ref` validates one `ArdEntry`. The manifest test clones the schema and
changes only that root reference to `#/$defs/ArdManifest`, the official definition for
`/.well-known/ard.json` in the same pinned file.

The official `conformance/bin/conformance-test` executable is vendored byte-for-byte from the same
revision and exercised in manifest mode. Both files are licensed under the accompanying Apache-2.0
license.
