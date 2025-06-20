module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer', // analyzes commit messages
    '@semantic-release/release-notes-generator', // generates changelog content
    '@semantic-release/changelog', // updates CHANGELOG.md
    '@semantic-release/github', // creates GitHub release
    '@semantic-release/git' // commits updated changelog back
  ],
  preset: 'conventionalcommits'
};
