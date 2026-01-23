import { v2 as cloudinary, v2 } from "cloudinary";

import fs from "fs";
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

const uploadOnCloudinary = async (localFilePath) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    if (!localFilePath) return null;
    // upload the file on cloudinary.

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // the file has been uploaded
    // console.log("file is uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the file is uploaded on cloudinary.
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the operation got failed.
    console.log("Error while file uploading: ", error);
    return null;
  }
};

export { uploadOnCloudinary };

// cloudinary.v2.uploader.upload(
//   "",
//   { public_id: "public_id" },
//   function (error, result) {
//     console.log(result);
//   }
// );
