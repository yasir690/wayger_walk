
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const streamifier = require('streamifier');

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

const uploadFileWithFolder = async (buffer, filename, contentType, folder) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Provided file is not a valid Buffer');
  }

  const bufferStream = streamifier.createReadStream(buffer);

  const uploadParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: `${folder}/${filename}`,
    Body: bufferStream,
    ContentType: contentType,
  };

  const upload = new Upload({
    client: s3,
    params: uploadParams,
  });

  try {
    console.log(process.env.BUCKET_NAME, 'buketname');

    const result = await upload.done();
    return `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/${folder}/${filename}`;
  } catch (error) {
    console.error("Upload Error:", error);
    throw new Error(error.message);
  }
};

module.exports = uploadFileWithFolder;

