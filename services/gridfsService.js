// services/gridfsService.js
import mongoose from "mongoose";
import { Readable } from "stream";
import { ObjectId } from "mongodb";

async function saveToGrid(buffer, filename, mimetype) {
  // make sure DB is connected
  if (!mongoose.connection || !mongoose.connection.db) {
    throw new Error("MongoDB not connected");
  }

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });

  // convert buffer -> readable stream
  const readableStream = new Readable();
  readableStream.push(buffer);
  readableStream.push(null);

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype,
    });

    // pipe the data
    readableStream.pipe(uploadStream);

    // NOTE: 'finish' callback DOES NOT get the file object.
    // Use uploadStream.id and uploadStream.filename to build returned obj.
    uploadStream.on("finish", () => {
      // uploadStream.id is an ObjectId, uploadStream.filename is the name
      const file = {
        _id: uploadStream.id instanceof ObjectId ? uploadStream.id : new ObjectId(uploadStream.id),
        filename: uploadStream.filename,
        length: uploadStream.length, // may be undefined
        chunkSize: uploadStream.chunkSize,
        contentType: mimetype,
        uploadDate: new Date()
      };
      console.log("UPLOAD SUCCESS - file id:", file._id.toString());
      resolve(file);
    });

    uploadStream.on("error", (err) => {
      console.error("GridFS upload error:", err);
      reject(err);
    });
  });
}

export { saveToGrid };
