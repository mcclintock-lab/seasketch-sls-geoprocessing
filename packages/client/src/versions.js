import semver from "semver";
const CLIENT_VERSION = process.env.CLIENT_VERSION;
const PACKAGING_VERSION = process.env.PACKAGING_VERSION;

if (!CLIENT_VERSION || !PACKAGING_VERSION) {
  console.error(CLIENT_VERSION, PACKAGING_VERSION);
  throw new Error("CLIENT_VERSION and/or PACKAGING_VERSION not set in environment variables");
}

const versionSatisfied = client => {
  return semver.satisfies(CLIENT_VERSION, client.requiredClientVersion) &&
    semver.satisfies(PACKAGING_VERSION, client.requiredPackagingVersion)
}

export { CLIENT_VERSION, PACKAGING_VERSION, versionSatisfied };
