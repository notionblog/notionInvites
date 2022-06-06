import {
  findUser,
  createEmailUser,
  getSpace,
  inviteGuestsToSpace,
} from "../lib/notion";
export default {
  async fetch(request) {
    const { pathname, searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const workspace = searchParams.get("workspace");
    if (pathname === "/invite" && email && workspace) {
      // get space id
      const space = await getSpace(workspace);
      if (!space) {
        return new Response(JSON.stringify({ error: "workspace not found" }), {
          status: 404,
          headers: {
            "content-type": "application/json",
          },
        });
      }

      let user = await findUser(email);

      // if user is found
      if (user && Object.keys(user).length !== 0) {
        user = user.value.value.id;
      } else {
        // create user
        const { userId } = await createEmailUser(email);
        user = userId;
      }
      // invite the user
      const inviteUser = await inviteGuestsToSpace(
        "44cfd713a4ae42e893de3ba2d48516da",
        space,
        user
      );
      return new Response(JSON.stringify(inviteUser), {
        headers: {
          "content-type": "application/json",
        },
      });
    }

    return new Response("Hello World!");
  },
};
