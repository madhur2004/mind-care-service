import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// ✅ Initialize with empty config first
cloudinary.config({
  cloud_name: '',
  api_key: '', 
  api_secret: ''
});

let isConfigured = false;

// ✅ Configuration function jo index.js se call karenge
export const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  isConfigured = true;
  console.log('🔑 Cloudinary Configured from index.js:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
    api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
    api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'
  });
};

// Buffer to stream converter
const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
};

// Upload to Cloudinary function
export const uploadToCloudinary = (buffer, userId) => {
  if (!isConfigured) {
    throw new Error('Cloudinary not configured. Call configureCloudinary() first.');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'mental-health-app/avatars',
        public_id: `avatar_${userId}`,
        overwrite: true,
        transformation: [
          { width: 200, height: 200, crop: "fill" },
          { quality: "auto" },
          { format: "webp" }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary Upload Error:', error);
          reject(error);
        } else {
          console.log('✅ Cloudinary Upload Success:', result.secure_url);
          resolve(result);
        }
      }
    );

    bufferToStream(buffer).pipe(uploadStream);
  });
};

// Delete from Cloudinary
export const deleteFromCloudinary = (publicId) => {
  if (!isConfigured) {
    throw new Error('Cloudinary not configured. Call configureCloudinary() first.');
  }

  return cloudinary.uploader.destroy(publicId);
};