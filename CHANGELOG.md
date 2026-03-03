# Changelog

## [Unreleased]

### Added

- .env.example file for environment variable configuration
- All API base URLs now use EXPO_PUBLIC_API_URL from environment variables
- .gitignore file to exclude sensitive and build files

### Changed

- Removed all hardcoded API URLs from the codebase; only environment variable is used

### Instructions

- Copy .env.example to .env and set the actual api endpoint EXPO_PUBLIC_API_URL
