const _BASEURL = "https://www.notion.so/api/v3";

function _HEADERS() {
  return {
    Cookie: `token_v2=${typeof TOKEN_V2 !== undefined ? TOKEN_V2 : ""};`,
    "Content-Type": "application/json",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
  };
}

/**
 * Return list of available user workspaces
 *
 * @return {Array} arrray of spaces with name and id
 */

export const getSpaces = async () => {
  const res = await fetch(`${_BASEURL}/getSpaces`, {
    method: "POST",
    headers: _HEADERS(),
  });
  const data = await res.json();
  const userSpaces = data[Object.keys(data)[0]].space;
  const userSpacesIds = Object.keys(userSpaces);
  return userSpacesIds.map((spaceId) => ({
    id: userSpaces[spaceId].value.id,
    name: userSpaces[spaceId].value.name,
  }));
};

export const createEmailUser = async (email) => {
  const body = {
    email: email,
    preferredLocaleOrigin: "inferred_from_inviter",
    preferredLocale: "en-US",
  };
  const res = await fetch("https://www.notion.so/api/v3/createEmailUser", {
    method: "POST",
    headers: _HEADERS(),
    body: JSON.stringify(body),
  });
  console.log(res);
};
// can edit -> read_and_write
// can comment -> comment_only
// can view -> reader
export const inviteGuestsToSpace = async (pageId, spaceId, userId) => {
  const body = {
    block: {
      id: pageId,
      spaceId: spaceId,
    },
    permissionItems: [
      {
        type: "user_permission",
        role: "read_and_write",
        user_id: userId,
      },
    ],
  };
  const res = fetch("https://www.notion.so/api/v3/inviteGuestsToSpace", {
    headers: _HEADERS(),
    body: JSON.stringify(body),
    method: "POST",
  });
  console.log(res);
};

export const findUser = async (email) => {
  const body = { email: email };

  const res = await fetch("https://www.notion.so/api/v3/findUser", {
    headers: _HEADERS(),
    body: JSON.stringify(body),
    method: "POST",
  });
  const data = await res.json();

  return data;
};
