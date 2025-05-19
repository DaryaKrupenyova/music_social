import React, { createContext, useState, useContext, useRef, useEffect } from 'react';

interface MusicTrack {
  id: number;
  track_name: string;
  artist_name: string;
  genre: string;
  file_path: string;
}

interface MusicPlayerContextType {
  currentTrack: MusicTrack | null;
  playlist: MusicTrack[];
  queue: MusicTrack[];
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;
  playTrack: (track: MusicTrack) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToPlaylist: (track: MusicTrack) => void;
  addToQueue: (track: MusicTrack) => void;
  clearPlaylist: () => void;
  clearQueue: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  seekTo: (position: number) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
  const [queue, setQueue] = useState<MusicTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [volume, setVolumeState] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const isSeeking = useRef<boolean>(false);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    
    // Setup event listeners
    const audio = audioRef.current;
    
    const handleEnded = () => {
      nextTrack();
    };

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      if (!isSeeking.current && audio.currentTime) {
        setProgress(audio.currentTime);
      }
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    // Cleanup
    return () => {
      audio.pause();
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  // Update audio source when currentTrack changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (currentTrack) {
      audioRef.current.src = `http://localhost:8000/${currentTrack.file_path}`;
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
      
      // Reset progress
      setProgress(0);
    } else {
      audioRef.current.pause();
    }
  }, [currentTrack]);

  // Update volume when it changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    audioRef.current.volume = volume / 100;
    audioRef.current.muted = isMuted;
  }, [volume, isMuted]);

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const seekTo = (position: number) => {
    if (audioRef.current) {
      isSeeking.current = true;
      audioRef.current.currentTime = position;
      setProgress(position);
      
      // Reset seeking state after a short delay
      setTimeout(() => {
        isSeeking.current = false;
      }, 100);
    }
  };

  const playTrack = (track: MusicTrack) => {
    // If the track is already in the playlist, find its index
    const trackIndex = playlist.findIndex(t => t.id === track.id);
    
    if (trackIndex === -1) {
      // Not in playlist, add it
      setPlaylist([...playlist, track]);
      setCurrentIndex(playlist.length);
    } else {
      // Already in playlist, just set index
      setCurrentIndex(trackIndex);
    }
    
    setCurrentTrack(track);
    setIsPlaying(true);
    
    if (audioRef.current) {
      audioRef.current.src = `http://localhost:8000/${track.file_path}`;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const resumeTrack = () => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().catch(error => {
        console.error('Error resuming audio:', error);
      });
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    // First check if there are tracks in the queue
    if (queue.length > 0) {
      // Play the next track from the queue
      const nextQueueTrack = queue[0];
      const remainingQueue = queue.slice(1);
      setQueue(remainingQueue);
      
      // Add the current track to the playlist if it's not already there
      if (currentTrack && !playlist.some(t => t.id === currentTrack.id)) {
        setPlaylist([...playlist, currentTrack]);
      }
      
      // Play the queued track
      setCurrentTrack(nextQueueTrack);
      setIsPlaying(true);
      
      // Update current index if the track is in the playlist
      const trackIndex = playlist.findIndex(t => t.id === nextQueueTrack.id);
      if (trackIndex !== -1) {
        setCurrentIndex(trackIndex);
      } else {
        // Add to playlist and set as current
        setPlaylist([...playlist, nextQueueTrack]);
        setCurrentIndex(playlist.length);
      }
      
      return;
    }
    
    // If no queue, use playlist
    if (playlist.length === 0 || currentIndex === -1) return;
    
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    setCurrentTrack(playlist[nextIndex]);
    setIsPlaying(true);
  };

  const previousTrack = () => {
    if (playlist.length === 0 || currentIndex === -1) return;
    
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentIndex(prevIndex);
    setCurrentTrack(playlist[prevIndex]);
    setIsPlaying(true);
  };

  const addToPlaylist = (track: MusicTrack) => {
    // Check if track is already in playlist
    if (!playlist.some(t => t.id === track.id)) {
      setPlaylist([...playlist, track]);
    }
  };

  const addToQueue = (track: MusicTrack) => {
    // Check if track is already in queue
    if (!queue.some(t => t.id === track.id)) {
      setQueue([...queue, track]);
    }
  };

  const clearPlaylist = () => {
    setPlaylist([]);
    setCurrentIndex(-1);
    if (isPlaying) {
      pauseTrack();
    }
    setCurrentTrack(null);
  };

  const clearQueue = () => {
    setQueue([]);
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        playlist,
        queue,
        isPlaying,
        volume,
        isMuted,
        progress,
        duration,
        playTrack,
        pauseTrack,
        resumeTrack,
        nextTrack,
        previousTrack,
        addToPlaylist,
        addToQueue,
        clearPlaylist,
        clearQueue,
        setVolume,
        toggleMute,
        seekTo
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}; 