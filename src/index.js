import { findUser, createEmailUser } from "../lib/notion";
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
      } else {
        // create user
        const createdUser = await createEmailUser(email);
        const { userId } = createdUser;

        console.log("user is created: ", userId);

        return new Response(JSON.stringify(createdUser), {
          headers: {
            "content-type": "application/json",
          },
        });
        // invite user
      }
    }

    return new Response("Hello World!");
  },
};
