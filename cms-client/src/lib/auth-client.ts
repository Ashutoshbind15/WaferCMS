import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";
import { getCmsApiBase } from "@/lib/runtime-config";

const baseURL = getCmsApiBase();

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
