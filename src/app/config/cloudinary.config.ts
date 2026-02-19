/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { envVars } from "./env";
import AppError from "../errorHelpers/AppError";
import status from "http-status";

cloudinary.config({
  cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET,
});

export const uploadFileToCloudinary = async (
  buffer: Buffer,
  filenmae: string,
): Promise<UploadApiResponse> => {
  if (!buffer || !filenmae) {
    throw new AppError(
      status.BAD_REQUEST,
      "File buffer and file name are required for upload",
    );
  }

  const extension = filenmae.split(".").pop()?.toLocaleLowerCase();

  const fileNameWithoutExtension = filenmae
    .split(".")
    .slice(0, -1)
    .join(".")
    .toLowerCase()
    .replace(/\s+/g, "-")
    // eslint-disable-next-line no-useless-escape
    .replace(/[^a-z0-9\-]/g, "");

  const uniqueName =
    Math.random().toString(32).substring(2) +
    "-" +
    Date.now() +
    "-" +
    fileNameWithoutExtension;

  const folder = extension === "pdf" ? "pdf" : "images";

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          public_id: `ph-healthcare/${folder}/${uniqueName}`,
          folder: `ph-healthcare/${folder}`,
        },
        (error, result) => {
          if (error) {
            return reject(
              new AppError(
                status.INTERNAL_SERVER_ERROR,
                "Failed to upload file to Cloudinary",
              ),
            );
          }
          resolve(result as UploadApiResponse);
        },
      )
      .end(buffer);
  });
};

export const deleteFileFromCloudinary = async (url: string) => {
  try {
    //find the public id from the url
    const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)+$/;

    const match = url.match(regex);

    if (match && match[1]) {
      const publicId = match[1];

      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    }
  } catch (error: any) {
    console.error("Error deleting file from Cloudinary:", error);
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to delete file from Cloudinary",
    );
  }
};

export const cloudinaryUpload = cloudinary;
