import { registerRemotes } from '@module-federation/enhanced/runtime';

type RuntimeConfig = {
  passportFormManifestUrl?: string;
};

/**
 * Reads runtime-config.json, which can be edited after a build, and points the host at the
 * remote it names. Without the file or the setting, the host keeps the URL it was built with.
 */
export async function applyRuntimeConfig(): Promise<void> {
  let config: RuntimeConfig = {};
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}runtime-config.json`, { cache: 'no-store' });
    if (response.ok) config = (await response.json()) as RuntimeConfig;
  } catch {
    // A missing or malformed file is not an error: the build-time URL still applies.
  }

  if (config.passportFormManifestUrl) {
    registerRemotes([{ name: 'passport_form', entry: config.passportFormManifestUrl }], { force: true });
  }
}
