import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const rootFolder = "vyom-realm-backend";

const uploadOnCloudinary = async (localFilePath, subFolder = "") => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    if (!localFilePath) return null;
    // upload the file on cloudinary.

    const finalFolder = subFolder ? `${rootFolder}/${subFolder}` : rootFolder;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: finalFolder,
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

const deleteFromCloudinary = async (public_id, resource_type = "image") => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    if (!public_id) return null;

    const response = await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type,
    });

    return response;
  } catch (error) {
    console.log("Error while deleting the file: ", error);
    return null;
  }
};
export { uploadOnCloudinary, deleteFromCloudinary };

// cloudinary.v2.uploader.upload(
//   "",
//   { public_id: "public_id" },
//   function (error, result) {
//     console.log(result);
//   }
// );
