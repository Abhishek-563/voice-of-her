import { uploadEvidenceToCloudinary } from "./cloudinaryService";

const getSupportedMimeType = () => {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

const waitForVideoTrack = (stream) => {
  return new Promise((resolve, reject) => {
    const videoTracks = stream.getVideoTracks();

    if (!videoTracks || videoTracks.length === 0) {
      reject(new Error("No video track found"));
      return;
    }

    const videoTrack = videoTracks[0];

    if (videoTrack.readyState === "live") {
      resolve(true);
      return;
    }

    let attempts = 0;

    const interval = setInterval(() => {
      attempts++;

      if (videoTrack.readyState === "live") {
        clearInterval(interval);
        resolve(true);
      }

      if (attempts > 10) {
        clearInterval(interval);
        reject(new Error("Video track not active"));
      }
    }, 300);
  });
};

export const recordEvidenceForSeconds = async (seconds = 10) => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Media recording is not supported");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user",
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  await waitForVideoTrack(stream);

  const videoTracks = stream.getVideoTracks();
  const audioTracks = stream.getAudioTracks();

  console.log("Auto evidence video tracks:", videoTracks);
  console.log("Auto evidence audio tracks:", audioTracks);

  if (videoTracks.length === 0) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error("Camera video track missing");
  }

  const chunks = [];
  const mimeType = getSupportedMimeType();

  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType })
    : new MediaRecorder(stream);

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onerror = () => {
      stream.getTracks().forEach((track) => track.stop());
      reject(new Error("Recording failed"));
    };

    recorder.onstop = async () => {
      try {
        if (chunks.length === 0) {
          throw new Error("No recording chunks created");
        }

        const blob = new Blob(chunks, {
          type: mimeType || "video/webm",
        });

        if (blob.size < 50000) {
          throw new Error("Recorded file too small. Video may not be captured.");
        }

        stream.getTracks().forEach((track) => track.stop());

        const cloudUrl = await uploadEvidenceToCloudinary(blob);

        localStorage.setItem("latestEvidenceUrl", cloudUrl);

        resolve(cloudUrl);
      } catch (error) {
        stream.getTracks().forEach((track) => track.stop());
        reject(error);
      }
    };

    recorder.start(1000);

    setTimeout(() => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    }, seconds * 1000);
  });
};
