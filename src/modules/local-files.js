/**
 * Local File Processor Module
 *
 * Processes capstone submissions from a local directory instead of Google Drive
 */

import { readdir, readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import mammoth from 'mammoth';

/**
 * Supported file extensions and their processors
 */
const SUPPORTED_EXTENSIONS = ['.docx', '.doc', '.txt', '.pdf'];

/**
 * Local file processor class
 */
export class LocalFileProcessor {
  constructor(sourceDir) {
    this.sourceDir = sourceDir;
  }

  /**
   * List all supported files in the directory
   */
  async listAllFiles() {
    if (!existsSync(this.sourceDir)) {
      throw new Error(`Directory not found: ${this.sourceDir}`);
    }

    const files = await readdir(this.sourceDir);
    const fileList = [];

    for (const filename of files) {
      const filePath = path.join(this.sourceDir, filename);
      const fileStat = await stat(filePath);

      if (fileStat.isFile()) {
        const ext = path.extname(filename).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext) || ext === '') {
          fileList.push({
            id: filePath,
            name: filename,
            path: filePath,
            mimeType: this.getMimeType(ext),
            size: fileStat.size
          });
        }
      }
    }

    console.log(`Found ${fileList.length} supported files`);
    return fileList;
  }

  /**
   * Get MIME type from extension
   */
  getMimeType(ext) {
    const mimeTypes = {
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.txt': 'text/plain',
      '.pdf': 'application/pdf'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Group files by participant name
   */
  groupFilesByParticipant(files) {
    const participants = {};

    for (const file of files) {
      // Extract participant name from filename
      // Common patterns:
      // "Firstname Lastname - Capstone Project.docx"
      // "Firstname Lastname Capstone.docx"
      // "Capstone - Firstname Lastname.docx"

      let participantName = file.name;

      // Remove extension
      participantName = participantName.replace(/\.[^/.]+$/, '');

      // Try to extract name from common patterns
      const patterns = [
        /^(.+?)\s*[-–—]\s*[Cc]apstone/,     // "Name - Capstone..."
        /^[Cc]apstone\s*[-–—]\s*(.+)$/,     // "Capstone - Name"
        /^(.+?)\s+[Cc]apstone/,              // "Name Capstone..."
        /^(.+)$/                              // Fallback: use full name
      ];

      for (const pattern of patterns) {
        const match = participantName.match(pattern);
        if (match && match[1]) {
          participantName = match[1].trim();
          break;
        }
      }

      // Clean up the name
      participantName = participantName
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!participants[participantName]) {
        participants[participantName] = {
          name: participantName,
          mainDoc: null,
          supportingDocs: []
        };
      }

      // Check if this is the main capstone document
      const isMainDoc = file.name.toLowerCase().includes('capstone');

      if (isMainDoc && !participants[participantName].mainDoc) {
        participants[participantName].mainDoc = file;
      } else {
        participants[participantName].supportingDocs.push(file);
      }
    }

    // Sort alphabetically
    const sorted = {};
    Object.keys(participants)
      .sort()
      .forEach(key => {
        sorted[key] = participants[key];
      });

    return sorted;
  }

  /**
   * Extract text content from a file
   */
  async extractContent(file) {
    const ext = path.extname(file.name).toLowerCase();

    try {
      switch (ext) {
        case '.docx':
          return await this.extractDocx(file.path);

        case '.txt':
          return await readFile(file.path, 'utf-8');

        case '.pdf':
          return await this.extractPdf(file.path);

        case '.doc':
          // Old .doc format - try mammoth anyway or return placeholder
          try {
            return await this.extractDocx(file.path);
          } catch {
            return `[Unable to extract .doc format: ${file.name}]`;
          }

        default:
          return `[Unsupported format: ${ext}]`;
      }
    } catch (error) {
      console.error(`Error extracting ${file.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Extract text from DOCX file
   */
  async extractDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * Extract text from PDF file
   */
  async extractPdf(filePath) {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const dataBuffer = await readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error.message);
      return `[PDF extraction failed: ${error.message}]`;
    }
  }

  /**
   * Fetch all content for a participant
   */
  async fetchParticipantContent(participant) {
    const content = {
      mainContent: '',
      supportingContent: [],
      filesProcessed: 0,
      errors: []
    };

    // Process main document
    if (participant.mainDoc) {
      try {
        content.mainContent = await this.extractContent(participant.mainDoc);
        content.filesProcessed++;
      } catch (error) {
        content.errors.push({
          file: participant.mainDoc.name,
          error: error.message
        });
      }
    }

    // Process supporting documents
    for (const doc of participant.supportingDocs) {
      try {
        const text = await this.extractContent(doc);
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
 * Create processor for a directory
 */
export function createLocalProcessor(sourceDir) {
  return new LocalFileProcessor(sourceDir);
}

export default {
  LocalFileProcessor,
  createLocalProcessor
};
