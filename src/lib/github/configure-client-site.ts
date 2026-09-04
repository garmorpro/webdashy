import "server-only";

import { buildClientSiteFiles } from "./client-site-config.mjs";
import { getRepositoryFile, putRepositoryFile } from "./client";

export async function configureClientSiteRepository(input: {
  owner: string;
  repo: string;
  branch: string;
  siteUrl: string;
}) {
  const [configFile, robotsFile, netlifyFile] = await Promise.all([
    getRepositoryFile(input.owner, input.repo, "_config.yml", input.branch),
    getRepositoryFile(input.owner, input.repo, "robots.txt", input.branch),
    getRepositoryFile(input.owner, input.repo, "netlify.toml", input.branch),
  ]);

  if (!configFile) {
    throw new Error("The generated client repository is missing _config.yml.");
  }

  const files = buildClientSiteFiles({
    existingConfig: configFile.content,
    existingRobots:
      robotsFile?.content ??
      `User-agent: *
Allow: /
`,
    siteUrl: input.siteUrl,
  });

  const changes: string[] = [];

  if (configFile.content !== files.config) {
    await putRepositoryFile({
      owner: input.owner,
      repo: input.repo,
      path: "_config.yml",
      branch: input.branch,
      message: "Configure client site URL",
      content: files.config,
      sha: configFile.sha,
    });

    changes.push("_config.yml");
  }

  if (robotsFile?.content !== files.robots) {
    await putRepositoryFile({
      owner: input.owner,
      repo: input.repo,
      path: "robots.txt",
      branch: input.branch,
      message: "Update client sitemap URL",
      content: files.robots,
      sha: robotsFile?.sha,
    });

    changes.push("robots.txt");
  }

  if (netlifyFile?.content !== files.netlifyToml) {
    await putRepositoryFile({
      owner: input.owner,
      repo: input.repo,
      path: "netlify.toml",
      branch: input.branch,
      message: "Configure Netlify Jekyll build",
      content: files.netlifyToml,
      sha: netlifyFile?.sha,
    });

    changes.push("netlify.toml");
  }

  return {
    siteUrl: files.siteUrl,
    changed: changes.length > 0,
    changes,
  };
}
