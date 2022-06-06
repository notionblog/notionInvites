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

const getData = async (request, contentType) => {
  if (contentType.includes("application/json")) {
    return JSON.stringify(await request.json());
  } else if (contentType.includes("application/text")) {
    return request.text();
  } else if (contentType.includes("text/html")) {
    return request.text();
  } else if (contentType.includes("form")) {
    const formData = await request.formData();
    const body = {};
    for (const entry of formData.entries()) {
      body[entry[0]] = entry[1];
    }
    return JSON.stringify(body);
  }
};
export default {
  async fetch(request) {
    const { headers } = request;
    const { pathname, searchParams } = new URL(request.url);
    const contentType = headers.get("content-type") || "";

    // request params
    let email = searchParams.get("email");
    let workspace = searchParams.get("workspace");
    let pageid = searchParams.get("pageid");
    let permission = searchParams.get("permission");
    if (pathname === "/gumroad") {
      console.log("from gumroad");

      const gumroadData = await getData(request, contentType);
      const { email: userEmail, product_permalink } = JSON.parse(gumroadData);
      const parsePageId = product_permalink.split("/")[4];
      email = userEmail;
      pageid = parsePageId;
    }

    const paths = ["/invite", "/gumroad"];
    console.log(`----- ${email} -- ${workspace} --- ${pageid}`);

    if (paths.includes(pathname) && email && workspace && pageid) {
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
