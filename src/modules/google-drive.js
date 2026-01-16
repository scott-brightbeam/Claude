/**
 * Google Drive Integration Module
 *
 * Handles authentication and file operations with Google Drive
 */

import { google } from 'googleapis';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import mammoth from 'mammoth';

// Source folder ID for capstone submissions
export const SOURCE_FOLDER_ID = '1Z7GRBwSDQdCdJmxY7UVFaTYKMO55u807';

/**
 * Google Drive client wrapper
 */
export class GoogleDriveClient {
  constructor() {
    this.drive = null;
    this.docs = null;
    this.isAuthenticated = false;
  }

  /**
   * Initialize with service account credentials
   * @param {string|Object} credentials - Path to JSON file or credentials object
   */
  async authenticate(credentials) {
    try {
      let credentialsObj;

      if (typeof credentials === 'string') {
        // Load from file path
        const content = await readFile(credentials, 'utf8');
        credentialsObj = JSON.parse(content);
      } else {
        // Use object directly
        credentialsObj = credentials;
      }

      const auth = new google.auth.GoogleAuth({
        credentials: credentialsObj,
        scopes: [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/documents.readonly'
        ]
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.docs = google.docs({ version: 'v1', auth });
      this.isAuthenticated = true;

      console.log('Google Drive authentication successful');
      return true;
    } catch (error) {
      console.error('Authentication failed:', error.message);
      throw new Error(`Google Drive authentication failed: ${error.message}`);
    }
  }

  /**
   * List all files in a folder with pagination
   * @param {string} folderId - Google Drive folder ID
   * @returns {Array} Array of file objects
   */
  async listAllFiles(folderId = SOURCE_FOLDER_ID) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    const allFiles = [];
    let pageToken = null;

    do {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime)',
        pageSize: 50,
        orderBy: 'name',
        pageToken: pageToken
      });

      allFiles.push(...response.data.files);
      pageToken = response.data.nextPageToken;

      console.log(`Retrieved ${allFiles.length} files so far...`);
    } while (pageToken);

    console.log(`Total files found: ${allFiles.length}`);
    return allFiles;
  }

  /**
   * Group files by participant name
   * @param {Array} files - Array of file objects
   * @returns {Object} Grouped files by participant
   */
  groupFilesByParticipant(files) {
    const participants = {};

    for (const file of files) {
      // Extract participant name from filename
      // Expected format: "Firstname Lastname - Capstone Project" or similar
      const nameParts = file.name.split(' - ');
      const participantName = nameParts[0].trim();

      if (!participants[participantName]) {
        participants[participantName] = {
          name: participantName,
          mainDoc: null,
          supportingDocs: []
        };
      }

      // Check if this is the main capstone document
      const isMainDoc = file.name.toLowerCase().includes('capstone project') ||
                        file.name.toLowerCase().includes('capstone submission');

      if (isMainDoc) {
        participants[participantName].mainDoc = {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType
        };
      } else {
        participants[participantName].supportingDocs.push({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType
        });
      }
    }

    // Sort participants alphabetically
    const sortedParticipants = {};
    Object.keys(participants)
      .sort()
      .forEach(key => {
        sortedParticipants[key] = participants[key];
      });

    return sortedParticipants;
  }

  /**
   * Fetch Google Doc content
   * @param {string} docId - Google Doc ID
   * @returns {string} Document text content
   */
  async fetchGoogleDoc(docId) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const response = await this.docs.documents.get({
        documentId: docId
      });

      const doc = response.data;
      let text = '';

      // Extract text from document body
      if (doc.body && doc.body.content) {
        for (const element of doc.body.content) {
          if (element.paragraph) {
            for (const elem of element.paragraph.elements || []) {
              if (elem.textRun && elem.textRun.content) {
                text += elem.textRun.content;
              }
            }
          }
          if (element.table) {
            for (const row of element.table.tableRows || []) {
              for (const cell of row.tableCells || []) {
                if (cell.content) {
                  for (const cellElement of cell.content) {
                    if (cellElement.paragraph) {
                      for (const elem of cellElement.paragraph.elements || []) {
                        if (elem.textRun && elem.textRun.content) {
                          text += elem.textRun.content;
                        }
                      }
                    }
                  }
                }
                text += '\t';
              }
              text += '\n';
            }
          }
        }
      }

      return text;
    } catch (error) {
      console.error(`Error fetching Google Doc ${docId}:`, error.message);
      throw error;
    }
  }

  /**
   * Download a file to local path
   * @param {string} fileId - Google Drive file ID
   * @param {string} destPath - Local destination path
   * @returns {string} Path to downloaded file
   */
  async downloadFile(fileId, destPath) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    // Ensure directory exists
    const dir = path.dirname(destPath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    await writeFile(destPath, Buffer.from(response.data));
    return destPath;
  }

  /**
   * Export Google Doc as DOCX
   * @param {string} docId - Google Doc ID
   * @param {string} destPath - Local destination path
   * @returns {string} Path to exported file
   */
  async exportGoogleDocAsDocx(docId, destPath) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    const dir = path.dirname(destPath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const response = await this.drive.files.export(
      {
        fileId: docId,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      },
      { responseType: 'arraybuffer' }
    );

    await writeFile(destPath, Buffer.from(response.data));
    return destPath;
  }

  /**
   * Fetch content from any supported file type
   * @param {Object} fileInfo - File info object with id, name, mimeType
   * @param {string} tempDir - Temporary directory for downloads
   * @returns {string} Extracted text content
   */
  async fetchFileContent(fileInfo, tempDir = '/tmp/capstone') {
    const { id, name, mimeType } = fileInfo;

    try {
      // Google Docs
      if (mimeType === 'application/vnd.google-apps.document') {
        return await this.fetchGoogleDoc(id);
      }

      // Regular DOCX files
      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const localPath = path.join(tempDir, `${id}.docx`);
        await this.downloadFile(id, localPath);
        const result = await mammoth.extractRawText({ path: localPath });
        return result.value;
      }

      // PDF files
      if (mimeType === 'application/pdf') {
        const localPath = path.join(tempDir, `${id}.pdf`);
        await this.downloadFile(id, localPath);
        // Note: pdf-parse would be used here
        // For now, return placeholder indicating PDF
        return `[PDF Content from: ${name}]`;
      }

      // Excel files
      if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          mimeType === 'application/vnd.google-apps.spreadsheet') {
        // Would use xlsx library here
        return `[Spreadsheet Content from: ${name}]`;
      }

      // Unsupported type
      console.warn(`Unsupported file type: ${mimeType} for file: ${name}`);
      return `[Unsupported file type: ${mimeType}]`;

    } catch (error) {
      console.error(`Error fetching content from ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch all content for a participant
   * @param {Object} participant - Participant object with mainDoc and supportingDocs
   * @param {string} tempDir - Temporary directory for downloads
   * @returns {Object} Combined content object
   */
  async fetchParticipantContent(participant, tempDir = '/tmp/capstone') {
    const content = {
      mainContent: '',
      supportingContent: [],
      filesProcessed: 0,
      errors: []
    };

    // Fetch main document
    if (participant.mainDoc) {
      try {
        content.mainContent = await this.fetchFileContent(participant.mainDoc, tempDir);
        content.filesProcessed++;
      } catch (error) {
        content.errors.push({
          file: participant.mainDoc.name,
          error: error.message
        });
      }
    }

    // Fetch supporting documents
    for (const doc of participant.supportingDocs) {
      try {
        const text = await this.fetchFileContent(doc, tempDir);
        content.supportingContent.push({
          name: doc.name,
          content: text
        });
        content.filesProcessed++;
      } catch (error) {
        content.errors.push({
          file: doc.name,
          error: error.message
        });
      }
    }

    return content;
  }
}

/**
 * Create and return a configured client
 */
export function createDriveClient() {
  return new GoogleDriveClient();
}

export default {
  GoogleDriveClient,
  createDriveClient,
  SOURCE_FOLDER_ID
};
