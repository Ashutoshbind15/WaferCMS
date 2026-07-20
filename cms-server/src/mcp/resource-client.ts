import { createAuthClient } from "better-auth/client";
import { oauthProviderResourceClient } from "@better-auth/oauth-provider/resource-client";
import { auth } from "../lib/auth.js";

export const mcpResourceClient = createAuthClient({
  plugins: [oauthProviderResourceClient(auth)],
});
