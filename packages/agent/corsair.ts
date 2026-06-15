import { createClient } from "@corsair-dev/app";

const corsair = createClient({ apiKey: process.env.CORSAIR_DEV_KEY! });
const instance = corsair.instance(process.env.CORSAIR_INSTANCE_ID!);

export function getCorsairTenant(tenantId: string) {
  return instance.tenant(tenantId);
}

export { corsair, instance };
