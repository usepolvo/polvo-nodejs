/* eslint-env node */

module.exports = {
  branches: ['main'],
  tagFormat: 'linear-v${version}',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@anolilab/semantic-release-pnpm',
    [
      '@semantic-release/git',
      {
        assets: ['package.json'],
        message: 'chore(release): @usepolvo/linear ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    '@semantic-release/github',
  ],
};
