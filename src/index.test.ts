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

import { Context, NextRelease } from "semantic-release";

let getPackageSpy: jest.SpyInstance;
let deprecateSpy: jest.SpyInstance;

beforeEach(() => {
  getPackageSpy = jest
    .spyOn(m, "getPackage")
    .mockResolvedValue({ name: "test-package" });
  deprecateSpy = jest.spyOn(m, "deprecate").mockReturnValue(undefined);
});

const context: Context = {
  logger: console,
  env: {},
  nextRelease: { version: "1.2.3" } as NextRelease,
};

test("should expose success", async () => {
  expect(m.success).toBeDefined();
});

test("should return if no deprecations", async () => {
  await expect(
    m.success({ deprecations: [] }, context)
  ).resolves.toBeUndefined();
  expect(getPackageSpy).toHaveBeenCalledTimes(1);
  expect(deprecateSpy).not.toHaveBeenCalled();
});

test("should return if no config", async () => {
  await expect(m.success({}, context)).resolves.toBeUndefined();
  expect(getPackageSpy).toHaveBeenCalledTimes(1);
  expect(deprecateSpy).not.toHaveBeenCalled();
});

test("should get deprecations from package.json", async () => {
  getPackageSpy.mockResolvedValue({
    name: "foo",
    deprecations: [{ version: "<1", message: "foo" }],
  });

  await expect(m.success({}, context)).resolves.toBeUndefined();
  expect(getPackageSpy).toHaveBeenCalledTimes(1);
  expect(deprecateSpy).toHaveBeenCalledTimes(1);
});

test("should call deprecate", async () => {
  const deprecations = [{ version: "<1", message: "Please use version > 1." }];
  await expect(m.success({ deprecations }, context)).resolves.toBeUndefined();
  expect(getPackageSpy).toHaveBeenCalledTimes(1);
  expect(deprecateSpy).toHaveBeenCalledWith(
    deprecations[0],
    (await m.getPackage(context)).name
  );
});

test("should call deprecate with rendered templates", async () => {
  const deprecations = [
    {
      version: "< ${nextRelease.version}",
      message: "Please use ${nextRelease.version}.",
    },
  ];
  await expect(m.success({ deprecations }, context)).resolves.toBeUndefined();
  expect(getPackageSpy).toHaveBeenCalledTimes(1);
  expect(deprecateSpy).toHaveBeenCalledWith(
    { version: "< 1.2.3", message: "Please use 1.2.3." },
    (await m.getPackage(context)).name
  );
});

test("should call deprecate with more complex templates", async () => {
  const deprecations = [
    {
      version: "< ${nextRelease.version.split('.')[0]}",
      message: "Please use ^${nextRelease.version.split('.')[0]}.0.0.",
    },
  ];
  await expect(m.success({ deprecations }, context)).resolves.toBeUndefined();
  expect(getPackageSpy).toHaveBeenCalledTimes(1);
  expect(deprecateSpy).toHaveBeenCalledWith(
    { version: "< 1", message: "Please use ^1.0.0." },
    (await m.getPackage(context)).name
  );
});
