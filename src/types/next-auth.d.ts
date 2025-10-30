import { DefaultSession, DefaultUser } from "next-auth";
import { TokenUser } from "./token-user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    roles: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: TokenUser;
  }
}
