/* eslint-env node */

module.exports = {
  branches: ['main'],
  tagFormat: 'webhook-v${version}',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        assets: ['package.json'],
        message: 'chore(release): @usepolvo/webhook ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    '@semantic-release/github',
  ],
};
