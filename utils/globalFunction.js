import fs from 'fs';
import path from 'path';

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
