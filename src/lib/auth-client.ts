import { createAuthClient } from "better-auth/client";
import type { auth } from "./src/lib/server/auth.ts";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [inferAdditionalFields<typeof auth>()],
});
