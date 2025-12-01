import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const safeUnlink = (filePath) => {
  try {
    // Convert relative path to absolute
    const absolutePath = path.join(__dirname, '..', filePath);


    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log('File deleted successfully');
    } else {
      console.warn('File not found:', absolutePath);
    }
  } catch (err) {
    console.error('Error deleting file:', filePath, err);
  }
};

export default safeUnlink;
