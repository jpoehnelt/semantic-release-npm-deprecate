/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as m from "./index";
import child_process from "child_process";
import tempy from "tempy";
import { Context, NextRelease } from "semantic-release";
import { readFileSync } from "fs";

let getPackageSpy: jest.SpyInstance;
let deprecateSpy: jest.SpyInstance;
let execSyncSpy: jest.SpyInstance;
let setNpmrcSpy: jest.SpyInstance;

beforeEach(() => {
  getPackageSpy = jest
    .spyOn(m, "getPackage")
    .mockResolvedValue({ name: "test-package" });
  deprecateSpy = jest.spyOn(m, "deprecate").mockReturnValue(undefined);
  execSyncSpy = jest
    .spyOn(child_process, "execSync")
    .mockReturnValue(undefined);
  setNpmrcSpy = jest.spyOn(m, "setNpmrc").mockResolvedValue(undefined);
});

const context: Context = {
  logger: { log: jest.fn(), error: jest.fn() },
  env: { NPM_TOKEN: "test-token" },
  nextRelease: { version: "1.2.3" } as NextRelease,
  // @ts-ignore incorrect typings
  cwd: tempy.directory(),
};

test("should expose publish", async () => {
  expect(m.publish).toBeDefined();
});

test("should return if no deprecations", async () => {
  await expect(
    m.publish({ deprecations: [] }, context)
  ).resolves.toBeUndefined();
  expect(getPackageSpy).toHaveBeenCalledTimes(1);
  expect(deprecateSpy).not.toHaveBeenCalled();
});

test("should return if no config", async () => {
  await expect(m.publish({}, context)).resolves.toBeUndefined();
  expect(getPackageSpy).toHaveBeenCalledTimes(1);
  expect(deprecateSpy).not.toHaveBeenCalled();
});

test("should get deprecations from package.json", async () => {
  getPackageSpy.mockResolvedValue({
    name: "foo",
    deprecations: [{ version: "<1", message: "foo" }],
  });

  await expect(m.publish({}, context)).resolves.toBeUndefined();
  expect(getPackageSpy).toHaveBeenCalledTimes(1);
  expect(deprecateSpy).toHaveBeenCalledTimes(1);
});

test("should call deprecate", async () => {
  const deprecations = [{ version: "<1", message: "Please use version > 1." }];
  await expect(m.publish({ deprecations }, context)).resolves.toBeUndefined();
  expect(getPackageSpy).toHaveBeenCalledTimes(1);
  expect(deprecateSpy).toHaveBeenCalledWith(
    deprecations[0],
    (await m.getPackage(context)).name,
    expect.stringMatching(/\.npmrc$/),
    expect.anything(),
    context
  );
});

test("should call deprecate with rendered templates", async () => {
  const deprecations = [
    {
      version: "< ${nextRelease.version}",
      message: "Please use ${nextRelease.version}.",
    },
  ];
  await expect(m.publish({ deprecations }, context)).resolves.toBeUndefined();
  expect(getPackageSpy).toHaveBeenCalledTimes(1);
  expect(deprecateSpy).toHaveBeenCalledWith(
    { version: "< 1.2.3", message: "Please use 1.2.3." },
    (await m.getPackage(context)).name,
    expect.stringMatching(/\.npmrc$/),
    expect.anything(),
    context
  );
});

test("should call deprecate with more complex templates", async () => {
  const deprecations = [
    {
      version: "< ${nextRelease.version.split('.')[0]}",
      message: "Please use ^${nextRelease.version.split('.')[0]}.0.0.",
    },
  ];
  await expect(m.publish({ deprecations }, context)).resolves.toBeUndefined();
  expect(getPackageSpy).toHaveBeenCalledTimes(1);
  expect(deprecateSpy).toHaveBeenCalledWith(
    { version: "< 1", message: "Please use ^1.0.0." },
    (await m.getPackage(context)).name,
    expect.stringMatching(/\.npmrc$/),
    expect.anything(),
    context
  );
});

test("should call execSync correctly", async () => {
  deprecateSpy.mockRestore();
  const deprecation = {
    version: "< 1",
    message: "Please use ^1.",
  };
  const name = "test-package";
  m.deprecate(
    deprecation,
    name,
    ".npmrc",
    "https://registry.npmjs.org/",
    context
  );

  expect(execSyncSpy.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      "npm deprecate --userconfig .npmrc --registry https://registry.npmjs.org/ test-package@\\"< 1\\" \\"Please use ^1.\\"",
      Object {
        "stdio": "inherit",
      },
    ]
  `);
  expect(context.logger.log).toBeCalledWith(
    'Completed call to: npm deprecate --userconfig .npmrc --registry https://registry.npmjs.org/ test-package@"< 1" "Please use ^1."'
  );
});

test("should set npmrc", async () => {
  setNpmrcSpy.mockRestore();
  const consoleLogSpy = jest.spyOn(console, "log").mockReturnValue(undefined);

  const npmrc = tempy.file();

  await m.setNpmrc(npmrc, "https://example.com", context);
  consoleLogSpy.mockRestore();

  expect(readFileSync(npmrc).toString()).toContain(
    "//example.com/:_authToken = ${NPM_TOKEN}"
  );
});
