import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";

const baseURL =
  import.meta.env.VITE_CMS_API_BASE?.replace(/\/$/, "") ??
  "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL,
  basePath: "/auth",
  plugins: [
    usernameClient(),
    oauthProviderClient(),
    inferAdditionalFields({
      user: {
        enabled: {
          type: "boolean",
          required: false,
          defaultValue: true,
          input: false,
        },
      },
    }),
  ],
});
