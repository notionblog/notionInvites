const _BASEURL = "https://www.notion.so/api/v3";
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

function _HEADERS(env) {
  return {
    Cookie: `token_v2=${
      typeof env.TOKEN_V2 !== undefined ? env.TOKEN_V2 : ""
    };`,
    "Content-Type": "application/json",
  };
}
function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

function id2uuid(id) {
  return `${id.substr(0, 8)}-${id.substr(8, 4)}-${id.substr(12, 4)}-${id.substr(
    16,
    4
  )}-${id.substr(20)}`;
}

async function getSpace(name, env) {
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
}
async function createEmailUser(email, env) {
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
  return await res.json();
}

function generateTransaction(userId, spaceId, pageId, permission) {
  const permissions = {
    edit: "read_and_write",
    comment: "comment_only",
    view: "reader",
    fullaccess: "editor",
  };
  return {
    requestId: uuidv4(),
    transactions: [
      {
        id: uuidv4(),
        spaceId: spaceId,
        debug: { userAction: "permissionsActions.savePermissionItems" },
        operations: [
          {
            pointer: {
              table: "block",
              id: id2uuid(pageId),
              spaceId: spaceId,
            },
            command: "setPermissionItem",
            path: ["permissions"],
            args: {
              type: "user_permission",
              role: permissions[permission] || permissions["comment"],
              user_id: userId,
            },
          },
          {
            pointer: {
              table: "block",
              id: id2uuid(pageId),
              spaceId: spaceId,
            },
            path: [],
            command: "update",
            args: { last_edited_time: Date.now() },
          },
        ],
      },
    ],
  };
}

async function inviteGuestsToSpace(pageId, spaceId, userId, permission, env) {
  const body = generateTransaction(userId, spaceId, pageId, permission);

  const res = await fetch("https://www.notion.so/api/v3/saveTransactions", {
    headers: _HEADERS(env),
    body: JSON.stringify(body),
    method: "POST",
  });
  return await res.json();
}

async function findUser(email, env) {
  const body = { email: email };

  const res = await fetch("https://www.notion.so/api/v3/findUser", {
    headers: _HEADERS(env),
    body: JSON.stringify(body),
    method: "POST",
  });
  return await res.json();
}
async function getData(request, contentType) {
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
}
async function viaSlack(data, error, SLACK_WEBHOOK) {
  const { workspace, email, pageid } = data;
  let content;
  if (error) {
    content = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `⚠️ Error`,
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Invitation failed.\n- Error: ${error}\n please update your Notion token (TOKEN_V2) in your Cloudflare worker`,
          },
        },
      ],
    };
  } else {
    content = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `👤 A new user has joined.`,
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `- Workspace: ${workspace}\n- Page: https://notion.so/${pageid}\n- Email: ${email}     
          `,
          },
        },
      ],
    };
  }

  await fetch(SLACK_WEBHOOK, {
    method: "POST",
    body: JSON.stringify(content),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function notify(data, error, env) {
  if (typeof env.SLACK_WEBHOOK !== "undefined")
    await viaSlack(data, error, env.SLACK_WEBHOOK);
  // if (typeof DISCORD_WEBHOOK !== "undefined") await _discord(data, error);
}

export default {
  async fetch(request, env) {
    if (
      typeof env.TOKEN_V2 === "undefined" ||
      typeof env.WORKSPACE === "undefined"
    ) {
      return res.json(
        { error: "TOKEN_V2 and WORKSPACE sercrets are required" },
        401
      );
    }
    if (request.method === "POST") {
      try {
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
          const { email: userEmail, product_permalink } =
            JSON.parse(gumroadData);
          const parsePageId = product_permalink.split("/")[4];
          email = userEmail;
          pageid = parsePageId;
        }

        const paths = ["/invite", "/gumroad"];

        if (paths.includes(pathname) && email && workspace && pageid) {
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
          await notify({ workspace, email, pageid }, null, env);
          return res.json({ success: "user Invited" }, 200);
        }
      } catch (err) {
        console.log(err.stack);
        notify(null, error.stack, env);
      }
    }
    return res.json({ message: "script is running!" }, 200);
  },
};
