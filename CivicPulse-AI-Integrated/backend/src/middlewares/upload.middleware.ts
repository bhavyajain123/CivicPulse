
import multer from "multer";
import ApiError from "../utils/ApiError";

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new ApiError(400, "Only JPG, PNG and WEBP images are allowed.")
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5
  }
});

export const uploadIncidentImages = (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  upload.array("images", 5)(req, res, async (error) => {
    if (error) {
      return next(error);
    }

    try {
      const { fileTypeFromBuffer } = await import("file-type");

      const files = req.files as Express.Multer.File[];

      const allowedMimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        png: "image/png",
        webp: "image/webp"
      };

      for (const file of files || []) {
        const fileType = await fileTypeFromBuffer(file.buffer);

        if (
          !fileType ||
          allowedMimeTypes[fileType.ext] !== file.mimetype
        ) {
          return next(
            new ApiError(
              400,
              "Invalid image content. Only genuine JPG, PNG and WEBP images are allowed."
            )
          );
        }
      }

      next();
    } catch (validationError) {
      next(validationError);
    }
  });
};
export const uploadResolutionImages = (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  upload.array("resolutionImages", 5)(req, res, async (error) => {
    if (error) {
      return next(error);
    }

    try {
      const { fileTypeFromBuffer } = await import("file-type");

      const files = req.files as Express.Multer.File[];

      const allowedMimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        png: "image/png",
        webp: "image/webp"
      };

      for (const file of files || []) {
        const fileType = await fileTypeFromBuffer(file.buffer);

        if (
          !fileType ||
          allowedMimeTypes[fileType.ext] !== file.mimetype
        ) {
          return next(
            new ApiError(
              400,
              "Invalid resolution image. Only genuine JPG, PNG and WEBP images are allowed."
            )
          );
        }
      }

      next();
    } catch (validationError) {
      next(validationError);
    }
  });
};

export const handleUploadError = (
  error: unknown,
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Each image must be smaller than 5 MB."
        : error.code === "LIMIT_FILE_COUNT" ||
          error.code === "LIMIT_UNEXPECTED_FILE"
        ? "Maximum 5 images are allowed."
        : "Image upload failed.";

    return res.status(400).json({
      success: false,
      message
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

export default upload;
