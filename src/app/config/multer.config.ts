import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,

  params: async (req, file) => {
    //formate all extension + filenmae
    const originalName = file.originalname;
    const extension = originalName.split(".").pop()?.toLocaleLowerCase();

    const fileNameWithoutExtension = originalName
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

    return {
      folder: `healthcare/${folder}`,
      public_id: uniqueName,
      resource_type: "auto",
    };
  },
});

export const multerUpload = multer({ storage });
