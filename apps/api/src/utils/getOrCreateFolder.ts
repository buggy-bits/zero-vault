import { drive_v3 } from "googleapis";

/**
 * Returns folderId of "ZeroVault".
 * Creates it if it does not exist.
 */
export async function getOrCreateZeroVaultFolder(
  drive: drive_v3.Drive
): Promise<string> {
  // 1. Search for existing folder
  const listRes = await drive.files.list({
    q:
      "mimeType='application/vnd.google-apps.folder' and name='ZeroVault' and trashed=false",
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (listRes.data.files && listRes.data.files.length > 0) {
    return listRes.data.files[0].id!;
  }

  // 2. Create folder if not found
  const createRes = await drive.files.create({
    requestBody: {
      name: "ZeroVault",
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });

  return createRes.data.id!;
}
