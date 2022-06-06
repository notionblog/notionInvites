const _BASEURL = "https://www.notion.so/api/v3";
const TOKEN_V2 =
  "52a7e757713beb0368238285fb8b7373c317299881b78e5e6a86549716e4fbf277a3f443359a9c2ea9667f0e347caf23b16ae0d22eb55781af1df059cee8b4a65123c66c8d44f02a92aede61667b";
function _HEADERS() {
  return {
    Cookie: `token_v2=${typeof TOKEN_V2 !== undefined ? TOKEN_V2 : ""};`,
    "Content-Type": "application/json",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
  };
}
const _id2uuid = (id) =>
  `${id.substr(0, 8)}-${id.substr(8, 4)}-${id.substr(12, 4)}-${id.substr(
    16,
    4
  )}-${id.substr(20)}`;
/**
 * Return list of available user workspaces
 *
 * @return {Array} arrray of spaces with name and id
 */

export const getSpace = async (name) => {
  const res = await fetch(`${_BASEURL}/getSpaces`, {
    method: "POST",
    headers: _HEADERS(),
  });
  const data = await res.json();
  const userSpaces = data[Object.keys(data)[0]].space;
  const userSpacesIds = Object.keys(userSpaces);
  console.log("user spaces: ", userSpaces);
  return userSpacesIds.find(
    (spaceId) =>
      userSpaces[spaceId].value.name.toLowerCase() === name.toLowerCase()
  );
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
  const data = await res.json();

  return data;
};
// can edit -> read_and_write
// can comment -> comment_only
// can view -> reader
export const inviteGuestsToSpace = async (pageId, spaceId, userId) => {
  const body = {
    block: {
      id: _id2uuid(pageId),
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
  const res = await fetch("https://www.notion.so/api/v3/inviteGuestsToSpace", {
    headers: _HEADERS(),
    body: JSON.stringify(body),
    method: "POST",
  });
  const data = await res.text();

  return data;
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
