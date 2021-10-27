# Semantic Release NPM Deprecate Plugin

[![npm](https://img.shields.io/npm/v/semantic-release-npm-deprecate)](https://www.npmjs.com/package/semantic-release-npm-deprecate)
![Build](https://github.com/jpoehnelt/semantic-release-npm-deprecate/workflows/Build/badge.svg)
![Release](https://github.com/jpoehnelt/semantic-release-npm-deprecate/workflows/Release/badge.svg)
[![codecov](https://codecov.io/gh/jpoehnelt/semantic-release-npm-deprecate/branch/master/graph/badge.svg)](https://codecov.io/gh/jpoehnelt/semantic-release-npm-deprecate)
![GitHub contributors](https://img.shields.io/github/contributors/jpoehnelt/semantic-release-npm-deprecate?color=green)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

The `semantic-release-npm-deprecate` plugin provides functionality to mark NPM releases as deprecated.

Read more about [Semantic Release](https://semantic-release.gitbook.io/).

## Install

```bash
$ npm install -D semantic-release-npm-deprecate
```

## Basic Usage

The following example will mark all previous major versions as deprecated. That is, if the next release is `2.3.4`, all versions `< 2` will be marked as deprecated.

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/npm",
    [
      "semantic-release-npm-deprecate",
      {
        "deprecations": [
          {
            "version": "< ${nextRelease.version.split('.')[0]}",
            "message": "Please use ^${nextRelease.version.split('.')[0]}.0.0."
          }
        ]
      }
    ]
  ]
}
```

This plugin runs in the `publish` lifecycle.

## Configuration Options

- `deprecations`: An array containing objects with the following properties:
  - `version`: A version range that will be deprecated.
  - `message`: A message that will be added to the release notes.

This plugin will also check for configuration in the `package.json` file under the `deprecations` field. This is experimental and the field name may change in the future.

### NPM
Configuration for NPM registry, token, etc matches that of [@semantic-release/npm](https://www.npmjs.com/package/@semantic-release/npm).

### Templates

The `version` and `message` fields support Lodash templates and are passed the [Context](https://semantic-release.gitbook.io/semantic-release/developer-guide/plugin#context) object. The following example uses the `nextRelease` object to get the next release version and split off the major version.

```js
{
  version: "< ${nextRelease.version.split('.')[0]}";
}
```

See https://semver.npmjs.com/ for all supported version ranges.
