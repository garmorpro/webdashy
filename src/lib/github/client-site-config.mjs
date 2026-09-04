function normalizeSiteUrl(value) {
  const url = new URL(value.trim());
  url.hash = "";
  url.search = "";
  return url.toString().replace(/\/$/, "");
}

export function buildClientSiteFiles({
  existingConfig,
  existingRobots,
  siteUrl,
}) {
  const normalizedUrl = normalizeSiteUrl(siteUrl);

  let config = existingConfig;

  if (/^url:\s*.*$/m.test(config)) {
    config = config.replace(/^url:\s*.*$/m, `url: "${normalizedUrl}"`);
  } else {
    config = `url: "${normalizedUrl}"\n${config}`;
  }

  if (/^baseurl:\s*.*$/m.test(config)) {
    config = config.replace(/^baseurl:\s*.*$/m, 'baseurl: ""');
  } else {
    config = `${config.trimEnd()}\nbaseurl: ""\n`;
  }

  let robots = existingRobots;

  if (/^Sitemap:\s*.*$/im.test(robots)) {
    robots = robots.replace(
      /^Sitemap:\s*.*$/im,
      `Sitemap: ${normalizedUrl}/sitemap.xml`
    );
  } else {
    robots = `${robots.trimEnd()}\nSitemap: ${normalizedUrl}/sitemap.xml\n`;
  }

  const netlifyToml = `[build]
  command = "bundle exec jekyll build"
  publish = "_site"

[build.environment]
  JEKYLL_ENV = "production"
`;

  return {
    siteUrl: normalizedUrl,
    config,
    robots,
    netlifyToml,
  };
}
