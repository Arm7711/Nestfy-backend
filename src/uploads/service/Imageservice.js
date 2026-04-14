import sharp from "sharp";
import fs from "fs";
import path from "path";

const MAX_WIDTH = 1024;
const WEBP_QUALITY = 75;
const OPTIMIZED_DIR = path.join(__dirname, '..', '..', 'uploads', 'optimized');


async function optimizeImage(filePath, outputPath) {
    try {
        const result = await sharp(filePath)
            .resize({
                width: MAX_WIDTH,
                withoutEnlargement: true,
                fit: "inside",
            })
            .webp({ quality: WEBP_QUALITY })
            .toFile(outputPath);

        return result;
    } catch (err) {

        throw new Error(`sharp optimisation failed for "${filePath}": ${err.message}`);
    }
}

async function deleteOriginal(filePath) {
    try {
        await fs.promises.unlink(filePath);
        console.log(`Deleted original temp file: ${filePath}`);
    }catch (err) {
        if (err.code !== "ENOENT") {
            console.warn(`Could not delete original file "${filePath}": ${err.message}`);
        }
    }
}

async function processUpload(file) {
    const baseName = path.basename(file.fileName, path.extname(file.fileName));
    const outputFileName = `${baseName}.webp`;
    const outputPath = path.join(OPTIMIZED_DIR, outputFileName);

    const info = await optimizeImage(file.path, outputPath);

    await deleteOriginal(file.path);

    return {
        originalName: file.fileName,
        optimizedFileName: outputFileName,
        optimizedPath: `/uploads/optimized/${outputFileName}`,
        optimizedUrl: `http://localhost:${process.env.PORT || 3000}/uploads/optimized/${outputFileName}`,
        size: info.size,
        width: info.width,
        height: info.height,
    };
}

export {
    optimizeImage,
    deleteOriginal,
    processUpload,
}

