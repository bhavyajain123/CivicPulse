
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error("Cloudinary environment variables are missing");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
  debug: true
});


export const uploadImageBuffer = async (
  buffer: Buffer
) => {
  const uploadPreset = "civicpulse_incident_upload";

  return new Promise<{
    url: string;
    publicId: string;
    format: string;
    width: number;
    height: number;
  }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.unsigned_upload_stream(
      uploadPreset,
      {
        resource_type: "image"
      },
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary unsigned upload failed:", {
            message: error?.message,
            http_code: error?.http_code
          });

          reject(error || new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height
        });
      }
    );

    uploadStream.end(buffer);
  });
};


export const deleteImage = async (publicId: string) => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image"
  });
};

export default cloudinary;
