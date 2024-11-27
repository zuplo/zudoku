export default async function runRelease({ github, context }) {
  const { ZUDOKU_VERSION } = process.env;
  const { owner, repo } = context.repo;
  const tag_name = `v${ZUDOKU_VERSION}`;
  const eventName = context.eventName;

  const releases = await github.paginate(github.rest.repos.listReleases, {
    owner,
    repo,
    per_page: 100,
  });

  const shared = {
    owner,
    repo,
    tag_name,
    generate_release_notes: true,
  };

  const existingPrerelease = releases.find((r) => r.prerelease);

  if (eventName === "workflow_dispatch") {
    await github.rest.repos.createRelease({
      ...shared,
      name: tag_name,
      prerelease: false,
    });

    if (!existingPrerelease) return;

    await github.rest.repos.deleteRelease({
      owner,
      repo,
      release_id: existingPrerelease.id,
    });
  } else {
    if (existingPrerelease) {
      const lastRelease = releases.find((r) => !r.prerelease);

      // Release notes are not re-generated if the release is updated so we do it manually
      const releaseNotes = await github.rest.repos.generateReleaseNotes({
        owner,
        repo,
        tag_name,
        previous_tag_name: lastRelease.tag_name,
      });

      await github.rest.repos.updateRelease({
        ...shared,
        release_id: existingPrerelease.id,
        body: releaseNotes.data.body,
        prerelease: true,
      });
      return;
    }

    await github.rest.repos.createRelease({
      ...shared,
      name: "Upcoming release",
      prerelease: true,
    });
  }
}
