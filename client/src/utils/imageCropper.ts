'use client';

import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

/**
 * Load face detection models from the public/models directory
 * This should be called once on app initialization
 */
export async function loadFaceDetectionModels(): Promise<void> {
  if (modelsLoaded) return;
  
  try {
    // Use CDN instead of local files to avoid Next.js serving issues
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
    
    // Load required models
    console.log('Loading tinyFaceDetector from CDN...');
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    console.log('tinyFaceDetector loaded successfully');
    
    console.log('Loading faceLandmark68TinyNet from CDN...');
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
    console.log('faceLandmark68TinyNet loaded successfully');
    
    modelsLoaded = true;
    console.log('Face detection models loaded successfully');
  } catch (error) {
    console.error('Error loading face detection models:', error);
    throw error;
  }
}

/**
 * Detect eyes in an image and position it horizontally so eyes are centered
 * Keeps the full height of the image, no zooming
 * Returns null if no face/eyes detected
 */
export async function centerImageOnEyes(
  imageSrc: string,
  targetWidth: number,
  targetHeight: number
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = async () => {
      try {
        // Ensure models are loaded
        if (!modelsLoaded) {
          await loadFaceDetectionModels();
        }

        // Detect face and landmarks using tiny models
        const detections = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true); // true = use tiny model

        if (!detections) {
          console.log('No face detected in image:', imageSrc);
          resolve(null);
          return;
        }

        // Get eye positions
        const landmarks = detections.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // Calculate center point between eyes
        const leftEyeCenter = {
          x: leftEye.reduce((sum, point) => sum + point.x, 0) / leftEye.length,
          y: leftEye.reduce((sum, point) => sum + point.y, 0) / leftEye.length,
        };
        const rightEyeCenter = {
          x: rightEye.reduce((sum, point) => sum + point.x, 0) / rightEye.length,
          y: rightEye.reduce((sum, point) => sum + point.y, 0) / rightEye.length,
        };
        
        const eyeCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
        const eyeCenterY = (leftEyeCenter.y + rightEyeCenter.y) / 2;

        console.log('Eyes detected at:', { eyeCenterX, eyeCenterY });

        // Create canvas with original image dimensions
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }

        // Draw the full original image with no scaling or cropping
        ctx.drawImage(img, 0, 0);

        // Return the full image with metadata about eye position
        // The CSS will handle positioning via object-position
        const dataUrl = canvas.toDataURL();
        
        // Calculate the horizontal percentage where eyes are located
        const eyePercentX = (eyeCenterX / img.width) * 100;
        
        // Store eye position in a data attribute by encoding it in the URL
        resolve(JSON.stringify({ 
          dataUrl, 
          eyePositionX: eyePercentX 
        }));
      } catch (error) {
        console.error('Error processing image:', error);
        resolve(null);
      }
    };

    img.onerror = () => {
      console.error('Failed to load image:', imageSrc);
      resolve(null);
    };
  });
}

/**
 * Process multiple images and return only those with detectable eyes, centered on the eyes
 */
export async function processImagesWithEyeDetection(
  imageUrls: string[],
  targetWidth: number = 100,
  targetHeight: number = 160
): Promise<string[]> {
  try {
    // Ensure models are loaded first
    if (!modelsLoaded) {
      await loadFaceDetectionModels();
    }

    // Process all images in parallel
    const results = await Promise.all(
      imageUrls.map(url => centerImageOnEyes(url, targetWidth, targetHeight))
    );

    // Filter out nulls (images without detected eyes)
    return results.filter((result): result is string => result !== null);
  } catch (error) {
    console.error('Error processing images:', error);
    return [];
  }
}
