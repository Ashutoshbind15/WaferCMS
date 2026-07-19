import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";

const baseURL =
  import.meta.env.VITE_CMS_API_BASE?.replace(/\/$/, "") ??
  "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL,
  basePath: "/auth",
  plugins: [
    usernameClient(),
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
