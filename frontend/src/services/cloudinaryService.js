export const uploadEvidenceToCloudinary = async (videoBlob) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary environment variables missing");
  }

  const file = new File(
    [videoBlob],
    `evidence-${Date.now()}.webm`,
    {
      type: videoBlob.type || "video/webm",
    }
  );

  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "voice-of-her-evidence");
  formData.append("resource_type", "video");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.log(errorData);
    throw new Error(errorData.error?.message || "Cloudinary upload failed");
  }

  const data = await response.json();

  return data.secure_url;
};