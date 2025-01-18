// src/utils/createCircularTexture.js

import * as THREE from 'three';

/**
 * Creates a circular texture with soft edges.
 * @param {number} size - The width and height of the texture in pixels.
 * @param {string} color - The color of the circle.
 * @returns {THREE.CanvasTexture} - The generated circular texture.
 */
export const createCircularTexture = (size = 128, color = '#ffffff') => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');

  // Draw a circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, false);
  ctx.closePath();

  // Create a radial gradient for soft edges
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};
