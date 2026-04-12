'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import videojs from 'video.js';
import videoStyles from './video.module.css';

/* ============================================
   Constants
   ============================================ */
const SEEK_STEP = 10;
const DOUBLE_TAP_DELAY = 300;
const VOLUME_STEP = 0.1;
const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const REACTIONS = [
  { emoji: 'ðŸ‘', label: 'J\'aime' },
  { emoji: 'â¤ï¸', label: 'J\'adore' },
  { emoji: 'ðŸ˜‚', label: 'Haha' },
  { emoji: 'ðŸ˜®', label: 'Wouah' },
  { emoji: 'ðŸ˜¢', label: 'Triste' },
  { emoji: 'ðŸ˜¡', label: 'Grrr' },
];

const formatTime = (seconds) => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/* ============================================
   Icons (inline SVG to avoid dependencies)
   ============================================ */
const Icons = {
  Play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
  ),
  Pause: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
  ),
  VolumeHigh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  ),
  VolumeLow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  ),
  VolumeMute: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/>
      <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  ),
  Fullscreen: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
    </svg>
  ),
  FullscreenExit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  ),
  Pip: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><rect x="12" y="9" width="8" height="6" rx="1" fill="currentColor" opacity="0.3"/>
    </svg>
  ),
  MiniPlayer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2"/><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 12h16"/>
    </svg>
  ),
  Share: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  Subtitles: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M7 12h4M13 12h4M7 16h10"/>
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  SkipForward: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
    </svg>
  ),
  SkipBack: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>
    </svg>
  ),
  ThumbsUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  ),
  ThumbsDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
    </svg>
  ),
  Comment: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Bookmark: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  More: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
    </svg>
  ),
  Quality: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  ),
  Speed: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Keyboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Copy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  Expand: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
    </svg>
  ),
  Rewind: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 19l-7-7 7-7"/><path d="M18 19l-7-7 7-7"/>
    </svg>
  ),
  Forward: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 5l7 7-7 7"/><path d="M6 5l7 7-7 7"/>
    </svg>
  ),
};

/* ============================================
   Main Component
   ============================================ */
const UnifyVideoPlayer = forwardRef(function UnifyVideoPlayer(props, ref) {
    const {
      sources = [],
      poster,
      title = '',
      meta = '',
      channel = '',
      views = '',
      publishedAt = '',
      isLive = false,
      autoplay = false,
      loop = false,
      muted: mutedProp = false,
      startTime = 0,
      preload = 'metadata',
      aspectRatio = '16:9',
      enablePiP = true,
      enableMiniPlayer = true,
      enableReactions = true,
      suggestedVideos = [],
      enableKeyboardShortcuts = true,
      className = '',
      tracks = [],
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
      onVolumeChange,
      onFullscreenChange,
      onQualityChange,
      onSpeedChange,
      onMiniPlayerToggle,
      onError,
      enableShare = true,
      enableSubtitles = true,
    } = props;

    /* --- Refs --- */
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const wrapperRef = useRef(null);
    const progressRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    /* --- State --- */
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPiP, setIsPiP] = useState(false);
    const [isMiniPlayer, setIsMiniPlayer] = useState(false);
    const [isMuted, setIsMuted] = useState(mutedProp || autoplay);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [currentQuality, setCurrentQuality] = useState('Auto');
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showKeyboard, setShowKeyboard] = useState(false);
    const [showReactionBar, setShowReactionBar] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showSavedIndicator, setShowSavedIndicator] = useState(false);
    const [showSeekLeft, setShowSeekLeft] = useState(false);
    const [showSeekRight, setShowSeekRight] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [hoverTime, setHoverTime] = useState(null);
    const [hoverPosition, setHoverPosition] = useState(0);
    const [subtitleEnabled, setSubtitleEnabled] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [posterVisible, setPosterVisible] = useState(!!poster);
    const [likedCount, setLikedCount] = useState(0);

    /* --- Double tap refs --- */
    const lastTapLeft = useRef(0);
    const lastTapRight = useRef(0);
    const tapTimeoutRef = useRef(null);

    /* --- Aspect ratio class --- */
    const aspectClass = {
      '16:9': '',
      '4:3': 'is-4-3',
      '1:1': 'is-1-1',
      '21:9': 'is-21-9',
      '9:16': 'is-vertical',
      'auto': '',
    }[aspectRatio] || '';

    /* ============================================
       Controls Timer (declared early)
       ============================================ */
    const resetControlsTimer = useCallback(() => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        setIsPlaying(currentIsPlaying => {
          if (currentIsPlaying) {
            setShowControls(false);
            setShowSettings(false);
            setShowSpeedMenu(false);
            setShowQualityMenu(false);
          }
          return currentIsPlaying;
        });
      }, 3000);
    }, []);
    /* ============================================
       Play / Pause
       ============================================ */
    const togglePlay = useCallback(() => {
      const player = playerRef.current;
      if (!player) return;
      if (player.paused()) {
        player.play().catch(() => {});
      } else {
        player.pause();
      }
    }, []);

    /* ============================================
       Seek
       ============================================ */
    const seekBy = useCallback((seconds) => {
      const player = playerRef.current;
      if (!player || !isFinite(player.duration())) return;
      const newTime = Math.max(0, Math.min(player.duration() || 0, player.currentTime() || 0 + seconds));
      player.currentTime(newTime);
    }, []);

    /* ============================================
       Volume
       ============================================ */
    const toggleMute = useCallback(() => {
      const player = playerRef.current;
      if (!player) return;
      player.muted(!player.muted());
    }, []);

    const handleVolumeChange = useCallback((e) => {
      const vol = parseFloat(e.target.value);
      const player = playerRef.current;
      if (!player) return;
      player.volume(vol);
      if (vol > 0) player.muted(false);
    }, []);

    /* ============================================
       Fullscreen
       ============================================ */
    const toggleFullscreen = useCallback(() => {
      const player = playerRef.current;
      if (!player) return;
      if (player.isFullscreen()) {
        player.exitFullscreen();
      } else {
        player.requestFullscreen();
      }
    }, []);

    /* ============================================
       Picture-in-Picture
       ============================================ */
    const togglePiP = useCallback(async () => {
      const video = videoRef.current;
      if (!video || !document.pictureInPictureEnabled) return;
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await video.requestPictureInPicture();
        }
      } catch {
        // PiP not supported or denied
      }
    }, []);

    /* ============================================
       Mini Player
       ============================================ */
    const toggleMiniPlayer = useCallback(() => {
      setIsMiniPlayer(prev => {
        const next = !prev;
        onMiniPlayerToggle?.(next);
        return next;
      });
    }, [onMiniPlayerToggle]);

    /* ============================================
       Quality Change
       ============================================ */
    const handleQualityChange = useCallback((label) => {
      const player = playerRef.current;
      if (!player) return;

      setCurrentQuality(label);

      // Try quality levels API
      const qualityLevels = player.qualityLevels?.();
      if (qualityLevels) {
        for (let i = 0; i < qualityLevels.length; i++) {
          if (label === 'Auto') {
            qualityLevels[i].enabled = true;
          } else {
            const level = parseInt(label, 10);
            qualityLevels[i].enabled = qualityLevels[i].height === level;
          }
        }
      }

      onQualityChange?.(label);
      setShowQualityMenu(false);
    }, [onQualityChange]);

    /* ============================================
       Speed Change
       ============================================ */
    const handleSpeedChange = useCallback((speed) => {
      const player = playerRef.current;
      if (!player) return;
      player.playbackRate(speed);
      setPlaybackRate(speed);
      setShowSpeedMenu(false);
      onSpeedChange?.(speed);
    }, [onSpeedChange]);

    /* ============================================
       Subtitle Toggle
       ============================================ */
    const toggleSubtitles = useCallback(() => {
      const player = playerRef.current;
      if (!player) return;

      const textTracks = player.textTracks();
      const enabled = !subtitleEnabled;
      setSubtitleEnabled(enabled);

      for (let i = 0; i < textTracks.length; i++) {
        textTracks[i].mode = enabled ? 'showing' : 'hidden';
      }

      setShowSettings(false);
    }, [subtitleEnabled]);

    /* ============================================
       Initialize Video.js
       ============================================ */
    useEffect(() => {
      if (!videoRef.current) return;

      const videoElement = videoRef.current;

      // Register Video.js skin
      videojs.Vhs?.xhr?.setup?.({}, {});

      const player = videojs(videoElement, {
        controls: false,
        autoplay: autoplay,
        muted: autoplay ? true : mutedProp,
        loop,
        preload,
        sources: sources.length > 0 ? sources : undefined,
        poster: undefined, // We handle poster ourselves
        html5: {
          vhs: {
            overrideNative: true,
          },
          nativeAudioTracks: false,
          nativeVideoTracks: false,
        },
      });

      playerRef.current = player;

      if (startTime > 0) {
        player.currentTime(startTime);
      }

      /* --- Player events --- */
      player.on('play', () => {
        setIsPlaying(true);
        setIsPaused(false);
        setPosterVisible(false);
        resetControlsTimer();
        onPlay?.();
      });

      player.on('pause', () => {
        setIsPlaying(false);
        setIsPaused(true);
        setShowControls(true);
        onPause?.();
      });

      player.on('waiting', () => {
        setIsBuffering(true);
      });

      player.on('canplay', () => {
        setIsBuffering(false);
      });

      player.on('playing', () => {
        setIsBuffering(false);
      });

      player.on('ended', () => {
        if (!loop) {
          setIsPlaying(false);
          setIsPaused(true);
          setShowControls(true);
          setPosterVisible(true);
        }
        onEnded?.();
      });

      player.on('timeupdate', () => {
        setCurrentTime(player.currentTime() || 0);
        setDuration(player.duration() || 0);
        onTimeUpdate?.(player.currentTime() || 0, player.duration() || 0);

        // Update buffered
        const buf = player.bufferedPercent();
        setBuffered(buf);
      });

      player.on('volumechange', () => {
        setVolume(player.volume() || 0);
        setIsMuted(player.muted() || false);
        onVolumeChange?.(player.volume() || 0);
      });

      player.on('fullscreenchange', () => {
        const fs = player.isFullscreen() || document.fullscreenElement !== null;
        setIsFullscreen(fs);
        onFullscreenChange?.(fs);
      });

      player.on('ratechange', () => {
        setPlaybackRate(player.playbackRate() || 1);
        onSpeedChange?.(player.playbackRate() || 1);
      });

      player.on('error', () => {
        setHasError(true);
        onError?.(player.error());
      });

      player.on('enterpictureinpicture', () => setIsPiP(true));
      player.on('leavepictureinpicture', () => setIsPiP(false));

      // Handle quality levels
      player.on('loadedmetadata', () => {
        const qualityLevels = player.qualityLevels?.();
        if (qualityLevels && qualityLevels.length > 0) {
          qualityLevels.on('addqualitylevel', () => {
            // Quality levels available
          });
        }
      });

      // Set initial state via player events (not synchronous setState)
      player.one('loadedmetadata', () => {
        setVolume(player.volume() || 0);
        setIsMuted(player.muted() || false);
        setDuration(player.duration() || 0);
      });

      return () => {
        clearTimeout(controlsTimeoutRef.current);
        if (player && !player.isDisposed()) {
          player.dispose();
        }
        playerRef.current = null;
      };
    }, []);

    /* ============================================
       Update sources when they change
       ============================================ */
    useEffect(() => {
      const player = playerRef.current;
      if (!player || sources.length === 0) return;
      player.src(sources);
    }, [sources]);

    /* ============================================
       Imperative Handle (expose methods)
       ============================================ */
    useImperativeHandle(ref, () => ({
      player: playerRef.current,
      play: () => playerRef.current?.play(),
      pause: () => playerRef.current?.pause(),
      seek: (time) => { if (playerRef.current) playerRef.current.currentTime(time); },
      setVolume: (vol) => { if (playerRef.current) { playerRef.current.volume(vol); } },
      setPlaybackRate: (rate) => { if (playerRef.current) { playerRef.current.playbackRate(rate); } },
      setQuality: (label) => { handleQualityChange(label); },
      toggleFullscreen: () => toggleFullscreen(),
      togglePiP: () => togglePiP(),
      toggleMiniPlayer: () => toggleMiniPlayer(),
      getCurrentTime: () => playerRef.current?.currentTime() || 0,
      getDuration: () => playerRef.current?.duration() || 0,
    }));

    /* ============================================
       Progress Bar Interaction
       ============================================ */
    const handleProgressClick = useCallback((e) => {
      const player = playerRef.current;
      const bar = progressRef.current;
      if (!player || !bar || !isFinite(player.duration())) return;
      const rect = bar.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      player.currentTime(pos * player.duration() || 0);
    }, []);

    const handleProgressMouseDown = useCallback((e) => {
      setIsDragging(true);
      handleProgressClick(e);
      const handleMouseMove = (ev) => {
        const player = playerRef.current;
        const bar = progressRef.current;
        if (!player || !bar || !isFinite(player.duration())) return;
        const rect = bar.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
        player.currentTime(pos * player.duration() || 0);
      };
      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }, [handleProgressClick]);

    const handleProgressHover = useCallback((e) => {
      const bar = progressRef.current;
      const player = playerRef.current;
      if (!bar || !player || !isFinite(player.duration())) return;
      const rect = bar.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverTime(pos * player.duration() || 0);
      setHoverPosition(e.clientX - rect.left);
    }, []);

    const handleProgressLeave = useCallback(() => {
      setHoverTime(null);
    }, []);

    /* ============================================
       Keyboard Shortcuts
       ============================================ */
    useEffect(() => {
      if (!enableKeyboardShortcuts) return;

      const handleKeyDown = (e) => {
        // Ignore if focus is on input/textarea
        if (
          ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target)?.tagName)
        ) return;

        const player = playerRef.current;
        if (!player) return;

        switch (e.key.toLowerCase()) {
          case ' ':
          case 'k':
            e.preventDefault();
            togglePlay();
            break;
          case 'arrowleft':
            e.preventDefault();
            seekBy(e.shiftKey ? -30 : -SEEK_STEP);
            break;
          case 'arrowright':
            e.preventDefault();
            seekBy(e.shiftKey ? 30 : SEEK_STEP);
            break;
          case 'arrowup':
            e.preventDefault();
            player.volume(Math.min(1, player.volume() || 0 + VOLUME_STEP));
            break;
          case 'arrowdown':
            e.preventDefault();
            player.volume(Math.max(0, player.volume() || 0 - VOLUME_STEP));
            break;
          case 'f':
            e.preventDefault();
            toggleFullscreen();
            break;
          case 'm':
            e.preventDefault();
            toggleMute();
            break;
          case 'p':
            if (enablePiP) {
              e.preventDefault();
              togglePiP();
            }
            break;
          case 'escape':
            if (isFullscreen) {
              toggleFullscreen();
            } else if (isMiniPlayer) {
              toggleMiniPlayer();
            } else {
              setShowSettings(false);
              setShowShare(false);
              setShowKeyboard(false);
            }
            break;
          case '?':
            e.preventDefault();
            setShowKeyboard(prev => !prev);
            break;
          case 'c':
            if (enableSubtitles) {
              e.preventDefault();
              toggleSubtitles();
            }
            break;
          case 'j':
            e.preventDefault();
            seekBy(-10);
            break;
          case 'l':
            e.preventDefault();
            seekBy(10);
            break;
          case ',':
            if (e.shiftKey) {
              e.preventDefault();
              const newRate = Math.max(0.25, playbackRate - 0.25);
              handleSpeedChange(newRate);
            }
            break;
          case '.':
            if (e.shiftKey) {
              e.preventDefault();
              const newRate = Math.min(2, playbackRate + 0.25);
              handleSpeedChange(newRate);
            }
            break;
        }

        resetControlsTimer();
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [
      enableKeyboardShortcuts,
      togglePlay,
      seekBy,
      toggleFullscreen,
      toggleMute,
      togglePiP,
      toggleSubtitles,
      isFullscreen,
      isMiniPlayer,
      playbackRate,
      handleSpeedChange,
      resetControlsTimer,
      enablePiP,
      enableSubtitles,
    ]);

    /* ============================================
       Double Tap to Seek (Mobile)
       ============================================ */
    const handleDoubleTapLeft = useCallback(() => {
      const now = Date.now();
      if (now - lastTapLeft.current < DOUBLE_TAP_DELAY) {
        clearTimeout(tapTimeoutRef.current);
        seekBy(-10);
        setShowSeekLeft(true);
        setTimeout(() => setShowSeekLeft(false), 600);
        lastTapLeft.current = 0;
      } else {
        lastTapLeft.current = now;
        tapTimeoutRef.current = setTimeout(() => {
          togglePlay();
        }, DOUBLE_TAP_DELAY);
      }
    }, [seekBy, togglePlay]);

    const handleDoubleTapRight = useCallback(() => {
      const now = Date.now();
      if (now - lastTapRight.current < DOUBLE_TAP_DELAY) {
        clearTimeout(tapTimeoutRef.current);
        seekBy(10);
        setShowSeekRight(true);
        setTimeout(() => setShowSeekRight(false), 600);
        lastTapRight.current = 0;
      } else {
        lastTapRight.current = now;
        tapTimeoutRef.current = setTimeout(() => {
          togglePlay();
        }, DOUBLE_TAP_DELAY);
      }
    }, [seekBy, togglePlay]);

    /* ============================================
       Close menus on outside click
       ============================================ */
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (!(e.target).closest('.unify-settings-trigger')) {
          setShowSettings(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /* ============================================
       Mouse move on wrapper â†’ show controls
       ============================================ */
    const handleMouseMove = useCallback(() => {
      resetControlsTimer();
    }, [resetControlsTimer]);

    /* ============================================
       Action handlers
       ============================================ */
    const handleLike = () => {
      setIsLiked(prev => !prev);
      setLikedCount(prev => prev + (isLiked ? -1 : 1));
    };

    const handleSave = () => {
      setIsSaved(prev => !prev);
      setShowSavedIndicator(true);
      setTimeout(() => setShowSavedIndicator(false), 1000);
    };

    const handleCopyLink = () => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
      }
    };

    const handleRetry = () => {
      setHasError(false);
      const player = playerRef.current;
      if (player) {
        player.src(sources);
        player.play().catch(() => {});
      }
    };

    /* ============================================
       Volume icon
       ============================================ */
    const VolumeIcon = isMuted || volume === 0 ? Icons.VolumeMute : volume < 0.5 ? Icons.VolumeLow : Icons.VolumeHigh;

    /* ============================================
       Progress percentage
       ============================================ */
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const bufferedPercent = duration > 0 ? buffered * 100 : 0;

    /* ============================================
       Quality options derived from sources
       ============================================ */
    const qualityOptions = sources
      .filter(s => s.res || s.label)
      .map(s => ({
        label: s.label || `${s.res}p`,
        res: s.res || parseInt(s.label || '0', 10),
      }));
    const hasMultipleQualities = qualityOptions.length > 0;

    /* ============================================
       Render
       ============================================ */
    return (
      <div
        ref={wrapperRef}
        className={[
          'unify-video-wrapper',
          isPlaying && !showControls ? 'is-playing' : '',
          isPaused && !isPlaying ? 'is-paused' : '',
          isBuffering ? 'is-buffering' : '',
          isFullscreen ? 'fullscreen-mode' : '',
          isMiniPlayer ? 'mini-player-mode' : '',
          isPiP ? 'is-pip' : '',
          showControls ? 'show-controls' : '',
          hasError ? 'has-error' : '',
          className,
        ].filter(Boolean).join(' ')}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
      >
        {/* Aspect Ratio Container */}
        <div className={`unify-aspect-container ${aspectClass}`}>
          {/* Poster */}
          {posterVisible && poster && (
            <div className="unify-poster" style={{ backgroundImage: `url(${poster})` }}>
              <div className="unify-poster-gradient" />
            </div>
          )}

          {/* Video Element */}
          <video
            ref={videoRef}
            className="video-js"
            playsInline
            preload={preload}
          />

          {/* Text tracks */}
          {tracks.map((track, idx) => (
            <track
              key={idx}
              kind={track.kind}
              label={track.label}
              srcLang={track.language}
              src={track.src}
              default={idx === 0}
            />
          ))}

          {/* Double tap areas */}
          <div className="unify-tap-area tap-left" onClick={handleDoubleTapLeft} />
          <div className="unify-tap-area tap-right" onClick={handleDoubleTapRight} />

          {/* Custom Play Button */}
          <div className="unify-custom-play-button" onClick={togglePlay}>
            {isPlaying ? (
              <div className="pause-icon"><span /><span /></div>
            ) : (
              <div className="play-icon" />
            )}
          </div>

          {/* Loading Spinner */}
          <div className="unify-loading-spinner">
            <div className="spinner-ring" />
          </div>

          {/* Seek Indicators */}
          <div className={`unify-seek-indicator seek-left ${showSeekLeft ? 'is-visible' : ''}`}>
            <div className="seek-icon"><Icons.Rewind /></div>
            <span className="seek-time">-10s</span>
          </div>
          <div className={`unify-seek-indicator seek-right ${showSeekRight ? 'is-visible' : ''}`}>
            <div className="seek-icon"><Icons.Forward /></div>
            <span className="seek-time">+10s</span>
          </div>

          {/* PiP Badge */}
          <div className="unify-pip-badge">PiP</div>

          {/* Quality Indicator */}
          {currentQuality !== 'Auto' && (
            <div className="unify-quality-indicator">
              <span className="unify-quality-tag">{currentQuality}</span>
            </div>
          )}

          {/* Error State */}
          <div className="unify-error-state">
            <div className="error-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <p className="error-message">
              Impossible de lire cette vidÃ©o. VÃ©rifiez votre connexion internet ou rÃ©essayez.
            </p>
            <button className="retry-btn" onClick={handleRetry}>RÃ©essayer</button>
          </div>

          {/* Saved Indicator */}
          <div className={`unify-saved-indicator ${showSavedIndicator ? 'is-visible' : ''}`}>
            <div className="saved-icon">
              {isSaved ? <Icons.Bookmark /> : <Icons.Bookmark />}
            </div>
          </div>

          {/* ============================================
              Controls Overlay
              ============================================ */}
          <div className="unify-controls-overlay">
            {/* Top Controls */}
            <div className="unify-controls-top">
              <div className="unify-video-info">
                {title && <p className="unify-video-title">{title}</p>}
                <div className="unify-video-meta">
                  {channel && <span>{channel}</span>}
                  {(channel && (views || publishedAt)) && <span className="meta-separator" />}
                  {views && <span>{views} vues</span>}
                  {(views && publishedAt) && <span className="meta-separator" />}
                  {publishedAt && <span>{publishedAt}</span>}
                  {isLive && <span className="unify-live-badge">EN DIRECT</span>}
                </div>
              </div>
              <div className="unify-video-top-actions">
                {enableMiniPlayer && (
                  <button className="unify-ctrl-btn" onClick={toggleMiniPlayer}>
                    <Icons.MiniPlayer />
                    <span className="unify-tooltip">Mini lecteur</span>
                  </button>
                )}
              </div>
            </div>

            {/* Center click area */}
            <div className="unify-controls-center" onClick={togglePlay} />

            {/* Bottom Controls */}
            <div className="unify-controls-bottom">
              {/* Progress Bar */}
              <div
                ref={progressRef}
                className={`unify-progress-container ${isDragging ? 'is-dragging' : ''}`}
                onClick={handleProgressClick}
                onMouseDown={handleProgressMouseDown}
                onMouseMove={handleProgressHover}
                onMouseLeave={handleProgressLeave}
              >
                <div className="unify-progress-track">
                  <div className="unify-progress-buffered" style={{ width: `${bufferedPercent}%` }} />
                  <div className="unify-progress-played" style={{ width: `${progressPercent}%` }} />
                </div>
                <div
                  className="unify-progress-scrubber"
                  style={{ left: `${progressPercent}%` }}
                />
                {hoverTime !== null && (
                  <div className="unify-progress-hover-indicator" style={{ left: hoverPosition }}>
                    {formatTime(hoverTime)}
                  </div>
                )}
              </div>

              {/* Controls Row */}
              <div className="unify-controls-row">
                {/* Left */}
                <div className="unify-controls-left">
                  {/* Play/Pause */}
                  <button className="unify-ctrl-btn" onClick={togglePlay}>
                    {isPlaying ? <Icons.Pause /> : <Icons.Play />}
                  </button>

                  {/* Skip Back */}
                  <button className="unify-ctrl-btn" onClick={() => seekBy(-10)}>
                    <Icons.SkipBack />
                    <span className="unify-tooltip">-10s</span>
                  </button>

                  {/* Skip Forward */}
                  <button className="unify-ctrl-btn" onClick={() => seekBy(10)}>
                    <Icons.SkipForward />
                    <span className="unify-tooltip">+10s</span>
                  </button>

                  {/* Volume */}
                  <div className={`unify-volume-control ${volume > 0 && !isMuted ? 'is-active' : ''}`}>
                    <button className="unify-ctrl-btn" onClick={toggleMute}>
                      <VolumeIcon />
                      <span className="unify-tooltip">{isMuted ? 'Activer le son' : 'Couper le son'}</span>
                    </button>
                    <div className="unify-volume-slider-wrap">
                      <input
                        type="range"
                        className="unify-volume-slider"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                      />
                    </div>
                  </div>

                  {/* Time Display */}
                  <div className="unify-time-display">
                    <span className="time-current">{formatTime(currentTime)}</span>
                    <span className="time-separator"> / </span>
                    <span className="time-duration">{isLive ? 'LIVE' : formatTime(duration)}</span>
                  </div>
                </div>

                {/* Right */}
                <div className="unify-controls-right">
                  {/* Subtitles */}
                  {enableSubtitles && (
                    <button className={`unify-ctrl-btn ${subtitleEnabled ? 'is-active' : ''}`} onClick={toggleSubtitles}>
                      <Icons.Subtitles />
                      <span className="unify-tooltip">{subtitleEnabled ? 'DÃ©sactiver' : 'Sous-titres'}</span>
                    </button>
                  )}

                  {/* Settings */}
                  <div style={{ position: 'relative' }}>
                    <button
                      className="unify-ctrl-btn unify-settings-trigger"
                      onClick={() => { setShowSettings(!showSettings); setShowSpeedMenu(false); setShowQualityMenu(false); }}
                    >
                      <Icons.Settings />
                      <span className="unify-tooltip">ParamÃ¨tres</span>
                    </button>

                    {/* Settings Menu */}
                    <div className={`unify-settings-menu ${showSettings ? 'is-visible' : ''}`}>
                      {/* Speed */}
                      <div
                        className="unify-settings-item"
                        onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
                      >
                        <div className="item-label">
                          <Icons.Speed />
                          <span>Vitesse de lecture</span>
                        </div>
                        <div className="item-value">
                          <span className="unify-speed-badge">{playbackRate}x</span>
                        </div>
                      </div>

                      {/* Quality */}
                      {hasMultipleQualities && (
                        <div
                          className="unify-settings-item"
                          onClick={() => { setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
                        >
                          <div className="item-label">
                            <Icons.Quality />
                            <span>QualitÃ©</span>
                          </div>
                          <div className="item-value">
                            <span className="quality-badge">{currentQuality}</span>
                          </div>
                        </div>
                      )}

                      {/* Subtitles in settings */}
                      {enableSubtitles && (
                        <div className="unify-settings-item" onClick={toggleSubtitles}>
                          <div className="item-label">
                            <Icons.Subtitles />
                            <span>Sous-titres</span>
                          </div>
                          <div className="item-value">
                            {subtitleEnabled ? <Icons.Check /> : <span style={{ width: 16 }} />}
                          </div>
                        </div>
                      )}

                      {/* PiP */}
                      {enablePiP && (
                        <div className="unify-settings-item unify-pip-toggle" onClick={togglePiP}>
                          <div className="item-label">
                            <Icons.Pip />
                            <span>Image dans l&apos;image</span>
                          </div>
                        </div>
                      )}

                      {/* Mini Player */}
                      {enableMiniPlayer && (
                        <div className="unify-settings-item" onClick={toggleMiniPlayer}>
                          <div className="item-label">
                            <Icons.MiniPlayer />
                            <span>Mini lecteur</span>
                          </div>
                        </div>
                      )}

                      {/* Keyboard shortcuts */}
                      {enableKeyboardShortcuts && (
                        <div className="unify-settings-item" onClick={() => { setShowKeyboard(true); setShowSettings(false); }}>
                          <div className="item-label">
                            <Icons.Keyboard />
                            <span>Raccourcis clavier</span>
                          </div>
                        </div>
                      )}

                      {/* Speed Sub-menu */}
                      <div className={`unify-settings-submenu ${showSpeedMenu ? 'is-visible' : ''}`}>
                        <div className="submenu-title">Vitesse</div>
                        {SPEED_OPTIONS.map(speed => (
                          <div
                            key={speed}
                            className={`submenu-item ${playbackRate === speed ? 'is-active' : ''}`}
                            onClick={() => handleSpeedChange(speed)}
                          >
                            <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                            {playbackRate === speed && <span className="check-icon"><Icons.Check /></span>}
                          </div>
                        ))}
                      </div>

                      {/* Quality Sub-menu */}
                      {hasMultipleQualities && (
                        <div className={`unify-settings-submenu ${showQualityMenu ? 'is-visible' : ''}`}>
                          <div className="submenu-title">QualitÃ©</div>
                          <div
                            className={`submenu-item ${currentQuality === 'Auto' ? 'is-active' : ''}`}
                            onClick={() => handleQualityChange('Auto')}
                          >
                            <span>Auto</span>
                            {currentQuality === 'Auto' && <span className="check-icon"><Icons.Check /></span>}
                          </div>
                          {qualityOptions.map(opt => (
                            <div
                              key={opt.label}
                              className={`submenu-item ${currentQuality === opt.label ? 'is-active' : ''}`}
                              onClick={() => handleQualityChange(opt.label)}
                            >
                              <span>{opt.label}</span>
                              {currentQuality === opt.label && <span className="check-icon"><Icons.Check /></span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Share */}
                  {enableShare && (
                    <button className="unify-ctrl-btn" onClick={() => setShowShare(true)}>
                      <Icons.Share />
                      <span className="unify-tooltip">Partager</span>
                    </button>
                  )}

                  {/* Fullscreen */}
                  <button className="unify-ctrl-btn" onClick={toggleFullscreen}>
                    {isFullscreen ? <Icons.FullscreenExit /> : <Icons.Fullscreen />}
                    <span className="unify-tooltip">{isFullscreen ? 'RÃ©duire' : 'Plein Ã©cran'}</span>
                  </button>
                </div>
              </div>

              {/* Reaction Bar */}
              {enableReactions && (
                <div className={`unify-reaction-bar ${showReactionBar ? 'is-visible' : ''}`}>
                  {REACTIONS.map(reaction => (
                    <button
                      key={reaction.emoji}
                      className="unify-reaction-btn"
                      onClick={() => {
                        setShowReactionBar(false);
                      }}
                    >
                      <span>{reaction.emoji}</span>
                      <span className="reaction-label">{reaction.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mini Player Close Button */}
          {isMiniPlayer && (
            <button className="unify-mini-close-btn" onClick={toggleMiniPlayer}>
              <Icons.Close />
            </button>
          )}

          {/* ============================================
              Share Overlay
              ============================================ */}
          {enableShare && (
            <div className={`unify-share-overlay ${showShare ? 'is-visible' : ''}`} onClick={() => setShowShare(false)}>
              <div className="unify-share-panel" onClick={e => e.stopPropagation()}>
                <div className="unify-share-header">
                  <h3>Partager la vidÃ©o</h3>
                  <button className="unify-share-close" onClick={() => setShowShare(false)}>
                    <Icons.Close />
                  </button>
                </div>
                <div className="unify-share-body">
                  <div className="unify-share-options">
                    <button className="unify-share-option" onClick={() => {}}>
                      <div className="share-icon" style={{ background: '#003d5c' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </div>
                      <span className="share-label">Facebook</span>
                    </button>
                    <button className="unify-share-option" onClick={() => {}}>
                      <div className="share-icon" style={{ background: '#1da1f2' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                      </div>
                      <span className="share-label">Twitter</span>
                    </button>
                    <button className="unify-share-option" onClick={() => {}}>
                      <div className="share-icon" style={{ background: '#25d366' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </div>
                      <span className="share-label">WhatsApp</span>
                    </button>
                    <button className="unify-share-option" onClick={() => {}}>
                      <div className="share-icon" style={{ background: '#0077b5' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </div>
                      <span className="share-label">LinkedIn</span>
                    </button>
                    <button className="unify-share-option" onClick={() => {}}>
                      <div className="share-icon" style={{ background: '#ff4500' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                      </div>
                      <span className="share-label">Reddit</span>
                    </button>
                  </div>
                  <div className="unify-share-link-section">
                    <div className="unify-share-link-row">
                      <input
                        className="unify-share-link-input"
                        type="text"
                        value={typeof window !== 'undefined' ? window.location.href : ''}
                        readOnly
                        onClick={e => (e.target).select()}
                      />
                      <button className="unify-share-copy-btn" onClick={handleCopyLink}>
                        <Icons.Copy /> Copier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================
              Keyboard Shortcuts Overlay
              ============================================ */}
          {enableKeyboardShortcuts && (
            <div className={`unify-keyboard-overlay ${showKeyboard ? 'is-visible' : ''}`} onClick={() => setShowKeyboard(false)}>
              <div className="unify-keyboard-panel" onClick={e => e.stopPropagation()}>
                <h3>Raccourcis clavier</h3>
                <div className="unify-shortcut-grid">
                  {[
                    { keys: ['K', 'Espace'], desc: 'Lecture / Pause' },
                    { keys: ['â†'], desc: 'Reculer de 10 secondes' },
                    { keys: ['â†’'], desc: 'Avancer de 10 secondes' },
                    { keys: ['J'], desc: 'Reculer de 10 secondes' },
                    { keys: ['L'], desc: 'Avancer de 10 secondes' },
                    { keys: ['â†‘'], desc: 'Augmenter le volume' },
                    { keys: ['â†“'], desc: 'Diminuer le volume' },
                    { keys: ['M'], desc: 'Couper / Activer le son' },
                    { keys: ['F'], desc: 'Plein Ã©cran' },
                    { keys: ['P'], desc: 'Image dans l\'image' },
                    { keys: ['C'], desc: 'Sous-titres' },
                    { keys: ['Shift + <'], desc: 'Ralentir la lecture' },
                    { keys: ['Shift + >'], desc: 'AccÃ©lÃ©rer la lecture' },
                    { keys: ['Ã‰chap'], desc: 'Quitter le mode actuel' },
                    { keys: ['?'], desc: 'Afficher les raccourcis' },
                  ].map((shortcut, idx) => (
                    <div key={idx} className="unify-shortcut-row">
                      <div className="unify-shortcut-keys">
                        {shortcut.keys.map((key, kidx) => (
                          <span key={kidx} className="unify-key">{key}</span>
                        ))}
                      </div>
                      <span className="unify-shortcut-desc">{shortcut.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================
            Action Bar (Below video)
            ============================================ */}
        <div className="unify-action-bar">
          <div className="unify-action-buttons">
            <button
              className={`unify-action-btn ${isLiked ? 'is-liked' : ''}`}
              onClick={handleLike}
              onMouseEnter={() => enableReactions && setShowReactionBar(true)}
              onMouseLeave={() => setTimeout(() => setShowReactionBar(false), 500)}
            >
              <Icons.ThumbsUp />
              <span className="action-count">{likedCount > 0 ? likedCount : 'J\'aime'}</span>
            </button>
            <button className="unify-action-btn">
              <Icons.ThumbsDown />
            </button>
            <button className="unify-action-btn">
              <Icons.Comment />
              <span className="action-count">Commenter</span>
            </button>
            {enableShare && (
              <button className="unify-action-btn" onClick={() => setShowShare(true)}>
                <Icons.Share />
                <span className="action-count">Partager</span>
              </button>
            )}
          </div>
          <div className="unify-action-buttons">
            <button className={`unify-action-btn ${isSaved ? 'is-liked' : ''}`} onClick={handleSave}>
              <Icons.Bookmark />
              <span className="action-count">{isSaved ? 'EnregistrÃ©' : 'Enregistrer'}</span>
            </button>
            <button className="unify-action-btn">
              <Icons.More />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default UnifyVideoPlayer;

