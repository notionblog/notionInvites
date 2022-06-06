const _BASEURL = "https://www.notion.so/api/v3";

function _HEADERS(env) {
  return {
    Cookie: `token_v2=${
      typeof env.TOKEN_V2 !== undefined ? env.TOKEN_V2 : ""
    };`,
    "Content-Type": "application/json",
  };
}
const _id2uuid = (id) =>
  `${id.substr(0, 8)}-${id.substr(8, 4)}-${id.substr(12, 4)}-${id.substr(
    16,
    4
  )}-${id.substr(20)}`;

const getSpace = async (name, env) => {
  const res = await fetch(`${_BASEURL}/getSpaces`, {
    method: "POST",
    headers: _HEADERS(env),
  });
  const data = await res.json();
  const userSpaces = data[Object.keys(data)[0]].space;
  const userSpacesIds = Object.keys(userSpaces);

  return userSpacesIds.find(
    (spaceId) =>
      userSpaces[spaceId].value.name.toLowerCase() === name.toLowerCase()
  );
};

const createEmailUser = async (email, env) => {
  const body = {
    email: email,
    preferredLocaleOrigin: "inferred_from_inviter",
    preferredLocale: "en-US",
  };
  const res = await fetch("https://www.notion.so/api/v3/createEmailUser", {
    method: "POST",
    headers: _HEADERS(env),
    body: JSON.stringify(body),
  });
  const data = await res.json();

  return data;
};

const inviteGuestsToSpace = async (
  pageId,
  spaceId,
  userId,
  permission,
  env
) => {
  const permissions = {
    edit: "read_and_write",
    comment: "comment_only",
    view: "reader",
  };
  const body = {
    block: {
      id: _id2uuid(pageId),
      spaceId: spaceId,
    },
    permissionItems: [
      {
        type: "user_permission",
        role: permissions[permission] || permissions["comment"],
        user_id: userId,
      },
    ],
  };
  const res = await fetch("https://www.notion.so/api/v3/inviteGuestsToSpace", {
    headers: _HEADERS(env),
    body: JSON.stringify(body),
    method: "POST",
  });
  const data = await res.text();

  return data;
};

const findUser = async (email, env) => {
  const body = { email: email };

  const res = await fetch("https://www.notion.so/api/v3/findUser", {
    headers: _HEADERS(env),
    body: JSON.stringify(body, env),
    method: "POST",
  });
  const data = await res.json();

  return data;
};

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
  async fetch(request, env) {
    if (
      typeof env.TOKEN_V2 === "undefined" ||
      typeof env.WORKSPACE === "undefined"
    ) {
      return res.json({ error: "TOKEN_V2 is required" }, 401);
    }
    if (request.method === "POST") {
      const { headers } = request;
      const { pathname, searchParams } = new URL(request.url);
      const contentType = headers.get("content-type") || "";

      let workspace = env.WORKSPACE;
      // request params
      let email = searchParams.get("email");
      let pageid = searchParams.get("pageid");
      let permission = searchParams.get("permission");
      if (pathname === "/gumroad") {
        const gumroadData = await getData(request, contentType);
        const { email: userEmail, product_permalink } = JSON.parse(gumroadData);
        const parsePageId = product_permalink.split("/")[4];
        email = userEmail;
        pageid = parsePageId;
      }

      const paths = ["/invite", "/gumroad"];

      if (paths.includes(pathname) && email && workspace && pageid) {
        try {
          const space = await getSpace(workspace, env);
          if (!space) {
            return res.json({ error: "workspace not found" }, 404);
          }

          let user = await findUser(email, env);

          if (user && Object.keys(user).length !== 0) {
            user = user.value.value.id;
          } else {
            const { userId } = await createEmailUser(email, env);
            user = userId;
          }
          await inviteGuestsToSpace(pageid, space, user, permission, env);
          return res.json({ success: "user Invited" }, 200);
        } catch (err) {
          res.json({ error: err.stack }, 500);
        }
      }
    }
    return res.json({ message: "script is running!" }, 200);
  },
};
