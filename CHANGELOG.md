# Change Log

All notable changes to the "javascript--spidermonkey--run-button" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.1.44] - 2026-08-13

- Updated the Windows SpiderMonkey installer to Firefox 140.13.0 ESR.
- Added SHA-256 verification for the downloaded Windows SpiderMonkey archive.
- Added CI, Dependabot updates, VSIX artifacts, and tag-based Marketplace publishing.
- Updated vulnerable dependencies and current VS Code extension test tooling.
- Corrected the Windows installation documentation.

## [0.1.39]

- Switched TypeScript runner from `ts-node` to `tsx`. Install with `npm i -g typescript tsx` (the global `ts-node` install is no longer required).