import {
  findUser,
  createEmailUser,
  getSpace,
  inviteGuestsToSpace,
} from "../lib/notion";

const res = {
  json(data, status) {
    return new Response(JSON.stringify({ data }), {
      status,
      headers: {
        "content-type": "application/json",
      },
    });
  },
};

export default {
  async fetch(request) {
    const { pathname, searchParams } = new URL(request.url);

    // request params
    const email = searchParams.get("email");
    const workspace = searchParams.get("workspace");
    const pageid = searchParams.get("pageid");
    const permission = searchParams.get("permission");

    if (pathname === "/invite" && email && workspace && pageid && permission) {
      try {
        // get space id
        const space = await getSpace(workspace);
        if (!space) {
          return res.json({ error: "workspace not found" }, 404);
        }

        let user = await findUser(email);

        if (user && Object.keys(user).length !== 0) {
          user = user.value.value.id;
        } else {
          const { userId } = await createEmailUser(email);
          user = userId;
        }
        await inviteGuestsToSpace(pageid, space, user, permission);
        return res.json({ success: "user Invited" }, 200);
      } catch (err) {
        res.json({ error: err.stack }, 500);
      }
    }
    return res.json({ message: "script is running!" }, 200);
  },
};
