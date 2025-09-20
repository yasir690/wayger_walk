const multer = require("multer");
const path = require("path");
const Storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join("public", "uploads"));
  },
  filename: (req, file, callback) => {
    const fileName = file.originalname.split(" ").join("-");
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);
    const newFileName = baseName + "-" + Date.now() + extension;
    callback(null, newFileName);
  },
});

const handleMultiPartData = multer({
  storage: multer.memoryStorage(),
  // storage: Storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB in bytes
  },
  // fileFilter: (req, file, callback) => {
  //   const FileTypes =
  //     /jpeg|jpg|png|gif|pdf|tif|tiff|doc|docm|docx|dotx|csv|aac|ogg|3gpp|3gpp2|wav|webm|mp4|mp3|mpeg|aiff|caf|flac|wav|dmg/;
  //   const mimType = FileTypes.test(file.mimetype);
  //   const extname = FileTypes.test(path.extname(file.originalname));
  //   if (extname) {
  //     return callback(null, true);
  //   }
  //   return callback(new Error("File type not supported"), false);
  // },

  fileFilter: (req, file, callback) => {
    // const FileTypes =
    //   /jpeg|jpg|png|gif|pdf|tif|tiff|doc|docm|docx|dotx|csv|aac|ogg|3gpp|3gpp2|wav|webm|mp4|mp3|mpeg|aiff|caf|flac|wav|dmg|MOV/;

    // const mimTypeValid = FileTypes.test(file.mimetype); // Check mimetype
    // const extnameValid = FileTypes.test(path.extname(file.originalname).toLowerCase()); // Check file extension

    const fileTypes = /(jpeg|jpg|png|gif|pdf|tif|tiff|doc|docm|docx|dotx|csv|aac|ogg|3gpp|3gpp2|wav|webm|mp4|mp3|mpeg|aiff|caf|flac|dmg|mov|quicktime)/i;

    const mimTypeValid = fileTypes.test(file.mimetype); // will match "video/quicktime"
    const extnameValid = fileTypes.test(path.extname(file.originalname).toLowerCase()); // will match ".mov"


    // Log file info for debugging (can remove later)
    console.log(`File Mimetype: ${file.mimetype}, File Extension: ${path.extname(file.originalname)}`);

    if (mimTypeValid && extnameValid) {
      return callback(null, true); // File is valid
    }

    return callback(new Error("File type not supported"), false); // Reject the file
  },
});

module.exports = handleMultiPartData;
