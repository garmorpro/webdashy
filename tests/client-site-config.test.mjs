import test from "node:test";
import assert from "node:assert/strict";
import { buildClientSiteFiles } from "../src/lib/github/client-site-config.mjs";

test("creates client-specific Jekyll and Netlify configuration", () => {
  const result = buildClientSiteFiles({
    siteUrl: "https://blue-ridge-outdoor-services.netlify.app/",
    existingConfig: `title: Example
url: "https://webdashy.github.io"
baseurl: "/larkspur-design-build"
plugins:
  - jekyll-sitemap
`,
    existingRobots: `User-agent: *
Allow: /

Sitemap: https://webdashy.github.io/larkspur-design-build/sitemap.xml
`,
  });

  assert.equal(
    result.siteUrl,
    "https://blue-ridge-outdoor-services.netlify.app"
  );

  assert.match(
    result.config,
    /url: "https:\/\/blue-ridge-outdoor-services\.netlify\.app"/
  );

  assert.match(result.config, /baseurl: ""/);
  assert.doesNotMatch(result.config, /larkspur-design-build/);

  assert.match(
    result.robots,
    /Sitemap: https:\/\/blue-ridge-outdoor-services\.netlify\.app\/sitemap\.xml/
  );

  assert.match(result.netlifyToml, /bundle exec jekyll build/);
  assert.match(result.netlifyToml, /publish = "_site"/);
});
