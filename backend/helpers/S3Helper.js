const AWS = require("aws-sdk");
const fs = require("fs");
const { S3 } = require("@aws-sdk/client-s3"); 

const S3Clientt = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-south-1",
});




function uploadFile(filePath, key) {
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: "myfilesbucketv1",
    Key: key,
    Body: fileContent,
    // ACL: "public-read", // or 'private' if restricted/
  };

  return S3Clientt.upload(params).promise(); // returns a promise
}

function sanitizeKey(key) {
    
}
module.exports = { uploadFile, s3 };
