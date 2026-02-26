import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface ClimateVideoPlayerProps {
  videoUri: string;
  title: string;
  description: string;
  onVideoEnd?: () => void;
}

export const ClimateVideoPlayer: React.FC<ClimateVideoPlayerProps> = ({
  videoUri,
  title,
  description,
  onVideoEnd,
}) => {
  const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<Video>(null);

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    setStatus(playbackStatus);
    if (playbackStatus.isLoaded) {
      setIsPlaying(playbackStatus.isPlaying);
      if (playbackStatus.didJustFinish && onVideoEnd) {
        onVideoEnd();
      }
    }
  };

  const handleSeek = async (position: number) => {
    if (videoRef.current && status.isLoaded) {
      await videoRef.current.setPositionAsync(position);
    }
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (status.isLoaded && status.durationMillis) {
      return status.positionMillis / status.durationMillis;
    }
    return 0;
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoUri }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isLooping={false}
          onPlaybackStatusUpdate={handleVideoStatusUpdate}
          onLoad={() => setShowControls(true)}
        />
        
        {/* Video Overlay Controls */}
        <TouchableOpacity
          style={styles.videoOverlay}
          onPress={() => setShowControls(!showControls)}
          activeOpacity={1}
        >
          {showControls && (
            <View style={styles.controlsContainer}>
              {/* Play/Pause Button */}
              <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayPause}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={40}
                  color="white"
                />
              </TouchableOpacity>

              {/* Progress Bar */}
              {status.isLoaded && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${getProgress() * 100}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>
                      {formatTime(status.positionMillis || 0)}
                    </Text>
                    <Text style={styles.timeText}>
                      {formatTime(status.durationMillis || 0)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Video Info */}
      <View style={styles.infoContainer}>
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
          style={styles.infoGradient}
        >
          <Text style={styles.videoTitle}>{title}</Text>
          <Text style={styles.videoDescription}>{description}</Text>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  infoGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
});
