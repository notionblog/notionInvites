import { findUser } from "../lib/notion";
export default {
  async fetch(request) {
    const { pathname, searchParams } = new URL(request.url);
    if (pathname === "/invite") {
      const email = searchParams.get("email");
      console.log("email: ", email);
      const user = await findUser(email);
      console.log("user: ", user);
      if (user && Object.keys(user).length !== 0) {
        return new Response(JSON.stringify(user), {
          headers: {
            "content-type": "application/json",
          },
        });
      }
    }

    return new Response("Hello World!");
  },
};
