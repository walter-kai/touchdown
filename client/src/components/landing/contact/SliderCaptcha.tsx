import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FaRedo, FaArrowRight } from 'react-icons/fa';
import LoadingScreenDots from '../../common/LoadingScreenDots';

interface SliderCaptchaProps {
  width?: number;
  height?: number;
  sliderL?: number;
  sliderR?: number;
  offset?: number;
  loadingText?: string;
  failedText?: string;
  barText?: string;
  onSuccess?: () => void;
  onFail?: () => void;
  onRefresh?: () => void;
}

const SliderCaptcha: React.FC<SliderCaptchaProps> = ({
  width = 280,
  height = 155,
  sliderL = 42,
  sliderR = 9,
  offset = 5,
  loadingText = 'Loading...',
  failedText = 'Try again',
  barText = 'Slide right to fill',
  onSuccess,
  onFail,
  onRefresh
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blockRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState(loadingText);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [puzzleX, setPuzzleX] = useState(0);
  const [puzzleY, setPuzzleY] = useState(0);
  const [trail, setTrail] = useState<number[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');

  const PI = Math.PI;

  // Generate random puzzle position
  const generatePuzzlePosition = useCallback(() => {
    const r = sliderL + sliderR * 2 + 3;
    // Ensure puzzle piece is fully inside the image with proper margins
    const minX = r / 2 + 10;
    const maxX = width - r / 2 - 20;
    const minY = r / 2 + 10;
    const maxY = height - r / 2 - 20;
    
    const x = Math.round(Math.random() * (maxX - minX) + minX);
    const y = Math.round(Math.random() * (maxY - minY) + minY);
    
    setPuzzleX(x);
    setPuzzleY(y);
    return { x, y };
  }, [width, height, sliderL, sliderR]);

  // Draw puzzle piece shape
  const drawPuzzleShape = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, drawBorder = false) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x + sliderL / 2, y - sliderR + 2, sliderR, 0.72 * PI, 2.26 * PI);
    ctx.lineTo(x + sliderL, y);
    ctx.arc(x + sliderL + sliderR - 2, y + sliderL / 2, sliderR, 1.21 * PI, 2.78 * PI);
    ctx.lineTo(x + sliderL, y + sliderL);
    ctx.lineTo(x, y + sliderL);
    ctx.arc(x + sliderR - 2, y + sliderL / 2, sliderR + 0.4, 2.76 * PI, 1.24 * PI, true);
    ctx.lineTo(x, y);
    
    if (drawBorder) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00ffe7';
      ctx.stroke();
    }
    ctx.fill();
  }, [sliderL, sliderR, PI]);

  // Load and draw image
  const loadImage = useCallback(() => {
    setIsLoading(true);
    setText(loadingText);
    setImageLoaded(false);
    setIsSuccess(false);
    setIsFailed(false);

    const canvas = canvasRef.current;
    const blockCanvas = blockRef.current;
    if (!canvas || !blockCanvas) {
      setIsLoading(false);
      return;
    }

    const ctx = canvas.getContext('2d');
    const blockCtx = blockCanvas.getContext('2d');
    if (!ctx || !blockCtx) {
      setIsLoading(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Generate new image source
    const imageId = Math.floor(Math.random() * 1000) + Date.now();
    const newImageSrc = `https://picsum.photos/${width}/${height}?random=${imageId}`;
    setCurrentImageSrc(newImageSrc);
    
    img.onload = () => {
      try {
        setImageLoaded(true);
        
        // Generate puzzle position
        const { x, y } = generatePuzzlePosition();
        
        // Clear canvases
        ctx.clearRect(0, 0, width, height);
        blockCtx.clearRect(0, 0, width, height);
        
        // Set block canvas size to match main canvas
        blockCanvas.width = width - 2;
        blockCanvas.height = height;
        
        // Draw main image
        ctx.drawImage(img, 0, 0, width - 2, height);
        
        // Create a copy for the puzzle piece
        blockCtx.drawImage(img, 0, 0, width - 2, height);
        
        // Create puzzle hole on main canvas
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        drawPuzzleShape(ctx, x, y);
        ctx.restore();
        
        // Add border outline to the hole
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'transparent';
        drawPuzzleShape(ctx, x, y, true);
        ctx.restore();
        
        // Create puzzle piece on block canvas
        blockCtx.save();
        blockCtx.globalCompositeOperation = 'destination-in';
        drawPuzzleShape(blockCtx, x, y);
        blockCtx.restore();
        
        // Add border outline to the puzzle piece
        blockCtx.save();
        blockCtx.globalCompositeOperation = 'source-over';
        blockCtx.fillStyle = 'transparent';
        drawPuzzleShape(blockCtx, x, y, true);
        blockCtx.restore();
        
        // Position puzzle piece outside bounds on the left (hidden)
        const initialOffset = -sliderL - 50;
        if (blockRef.current) {
          blockRef.current.style.left = `${initialOffset}px`;
        }
        
        setIsLoading(false);
        setText(barText);
      } catch (error) {
        console.error('Error processing image:', error);
        setIsLoading(false);
        setText('Processing error - retrying...');
        setTimeout(() => loadImage(), 1500);
      }
    };

    img.onerror = (error) => {
      console.error('Image load error:', error);
      setImageLoaded(false);
      setIsLoading(false);
      setText('Image failed - retrying...');
      setTimeout(() => loadImage(), 2000);
    };

    // Set image source to start loading
    img.src = newImageSrc;
  }, [width, height, sliderL, sliderR, loadingText, barText, generatePuzzlePosition, drawPuzzleShape]);

  // Verify puzzle solution
  const verify = useCallback(() => {
    if (!sliderRef.current || !blockRef.current) return { spliced: false, verified: false };
    
    const sliderLeft = parseInt(sliderRef.current.style.left) || 0;
    const blockLeft = parseInt(blockRef.current.style.left) || 0;
    
    // Simple approach: The puzzle piece should be positioned near the hole's X position
    // When the block canvas is at position 0, the puzzle piece inside it aligns with the hole
    const targetBlockPosition = 0; // Block canvas should be at 0 to align puzzle with hole
    const spliced = Math.abs(blockLeft - targetBlockPosition) < 20; // More forgiving threshold
    
    // Very simple bot detection - just check if there's any movement data
    const verified = trail.length > 0;
    
    console.log('Verify Debug:', {
      sliderLeft,
      blockLeft,
      puzzleX,
      targetBlockPosition,
      difference: Math.abs(blockLeft - targetBlockPosition),
      spliced,
      verified,
      trailLength: trail.length
    });
    
    return { spliced, verified };
  }, [trail, puzzleX]);

  // Reset captcha
  const reset = useCallback(() => {
    setIsSuccess(false);
    setIsFailed(false);
    setIsDragging(false);
    setTrail([]);
    setImageLoaded(false);
    
    if (sliderRef.current) sliderRef.current.style.left = '0px';
    if (blockRef.current) blockRef.current.style.left = `${-sliderL - 50}px`;
    if (maskRef.current) maskRef.current.style.width = '0px';
    
    loadImage();
  }, [loadImage, sliderL]);

  // Handle mouse/touch events
  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !imageLoaded) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    
    // Constrain slider movement
    const maxSliderDelta = width - 60;
    const constrainedSliderX = Math.max(0, Math.min(deltaX, maxSliderDelta));
    
    // Update slider position
    if (sliderRef.current) {
      sliderRef.current.style.left = `${constrainedSliderX}px`;
    }
    
    // Move puzzle piece: start from hidden position and move right with slider
    const initialBlockPosition = -sliderL - 50;
    const newBlockLeft = initialBlockPosition + constrainedSliderX; // Use constrained slider position
    
    if (blockRef.current) {
      blockRef.current.style.left = `${newBlockLeft}px`;
    }
    
    // Update progress mask
    if (maskRef.current) {
      maskRef.current.style.width = `${constrainedSliderX + 50}px`;
    }
    
    setTrail(prev => [...prev, Math.round(deltaY)]);
  }, [isDragging, startX, startY, width, imageLoaded, sliderL]);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isLoading || isSuccess || !imageLoaded) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setStartX(clientX);
    setStartY(clientY);
    setIsDragging(true);
    setTrail([]);
  }, [isLoading, isSuccess, imageLoaded]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (containerRef.current) {
      containerRef.current.classList.remove('active');
    }
    
    // Only verify position after user releases mouse/touch
    const result = verify();
    
    if (result.spliced && result.verified) {
      setIsSuccess(true);
      if (containerRef.current) {
        containerRef.current.classList.add('success');
      }
      setText('Success!');
      onSuccess?.();
    } else {
      setIsFailed(true);
      if (containerRef.current) {
        containerRef.current.classList.add('failed');
      }
      setText(failedText);
      onFail?.();
      
      setTimeout(() => {
        reset();
      }, 1000);
    }
  }, [isDragging, verify, onSuccess, onFail, failedText, reset]);

  // Event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e);
    const handleMouseUp = () => handleEnd();
    const handleTouchMove = (e: TouchEvent) => handleMove(e);
    const handleTouchEnd = () => handleEnd();

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  // Initialize only once on mount
  useEffect(() => {
    loadImage();
  }, []); // Empty dependency array

  const handleRefresh = () => {
    reset();
    onRefresh?.();
  };

  return (
    <div className="slider-captcha relative mx-auto" style={{ width }}>
      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        width={width - 2}
        height={height}
        className="border border-[#00ffe7]/30 rounded-lg block"
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 border border-[#00ffe7]/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <LoadingScreenDots size={4} />
            <p className="text-[#e0e7ef] text-sm mt-4">{loadingText}</p>
          </div>
        </div>
      )}
      
      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="absolute top-2 right-2 w-8 h-8 bg-[#23263a] border border-[#00ffe7]/30 rounded text-[#00ffe7] hover:bg-[#00ffe7] hover:text-[#181a23] transition-all duration-200 flex items-center justify-center disabled:opacity-50"
      >
        <FaRedo className="text-xs" />
      </button>
      
      {/* Block canvas - puzzle piece */}
      <canvas
        ref={blockRef}
        width={width - 2}
        height={height}
        className="absolute top-0 rounded-lg block pointer-events-none transition-none overflow-hidden"
        style={{ 
          left: `${-sliderL - 50}px`,
          top: '0px',
          clipPath: 'inset(0)'
        }}
      />
      
      {/* Slider container */}
      <div
        ref={containerRef}
        className={`mt-4 relative h-12 bg-[#23263a] border border-[#00ffe7]/30 rounded-lg overflow-hidden ${
          isDragging ? 'shadow-[0_4px_12px_rgba(0,255,231,0.4)]' : ''
        } ${
          isSuccess 
            ? 'bg-gradient-to-r from-green-500/20 to-green-500/10 border-green-500/50' 
            : isFailed 
            ? 'bg-gradient-to-r from-red-500/20 to-red-500/10 border-red-500/50'
            : ''
        }`}
      >
        {/* Background track */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#181a23] to-[#23263a]" />
        
        {/* Progress mask */}
        <div
          ref={maskRef}
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00ffe7]/20 to-[#00ffe7]/10 transition-none"
          style={{ width: '0px' }}
        />
        
        {/* Slider button */}
        <div
          ref={sliderRef}
          className={`absolute left-0 top-0 w-12 h-12 rounded-lg cursor-pointer flex items-center justify-center transition-colors duration-200 hover:shadow-lg ${
            isDragging ? 'shadow-lg scale-105' : ''
          } ${
            isSuccess 
              ? 'bg-green-500' 
              : isFailed 
              ? 'bg-red-500' 
              : 'bg-[#00ffe7]'
          } ${!imageLoaded || isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
          style={{ left: '0px' }}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          <FaArrowRight className={`text-[#181a23] ${isDragging ? 'animate-pulse' : ''}`} />
        </div>
        
        {/* Text */}
        <span
          ref={textRef}
          className="absolute inset-0 flex items-center justify-center text-[#e0e7ef] text-sm font-medium pointer-events-none"
        >
          {text}
        </span>
      </div>
    </div>
  );
};

export default SliderCaptcha;
