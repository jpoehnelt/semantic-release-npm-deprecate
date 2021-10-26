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

import { Context } from "semantic-release";
import getPkg from "@semantic-release/npm/lib/get-pkg";
import { template } from "lodash";
import { execSync } from "child_process";

export interface Deprecation {
  version: string;
  message: string;
}
export interface PluginConfig {
  deprecations?: Deprecation[];
}

export async function success(
  { deprecations = [] }: PluginConfig,
  context: Context
): Promise<void> {
  const pkg = await getPackage(context);

  // get deprecations from package.json deprecations field
  deprecations = [...deprecations, ...(pkg.deprecations || [])];
  context.logger.log(`Found ${deprecations.length} deprecations`);

  // short circuit if there are no deprecations
  if (deprecations.length === 0) {
    return;
  }

  deprecations = renderDeprecations(deprecations, context);
  deprecations.forEach((deprecation) =>
    deprecate(deprecation, pkg.name, context.logger)
  );
}

export const renderDeprecations = (
  deprecations: Deprecation[],
  context: Context
) =>
  deprecations.map(({ version, message }) => ({
    version: template(version)({ ...context }),
    message: template(message)({ ...context }),
  }));

export const getPackage = async (context: Context) => getPkg({}, context);

export const deprecate = (
  { version, message }: Deprecation,
  name: string,
  logger: Context["logger"]
) =>
  /* istanbul ignore next */
  logger.log(
    execSync(`npm deprecate ${name}@"${version}" "${message}"`, {
      stdio: "inherit",
    }).toString()
  );
