export function reconciledRepositoryMetadata(storedRepositoryId, repository) {
  if (BigInt(repository.id) !== BigInt(storedRepositoryId)) return null;
  return {
    actualVisibility: repository.private || (repository.visibility && repository.visibility !== "public") ? "PRIVATE" : "PUBLIC",
    defaultBranch: repository.default_branch,
    repositoryUrl: repository.html_url,
    targetOwner: repository.owner.login,
    targetRepositoryName: repository.name,
    githubNodeId: repository.node_id,
  };
}
