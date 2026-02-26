# Video Assets

## Climate Change Video
To add your climate change video about beaches and mountains:

1. Place your video file in this folder
2. Supported formats: MP4, MOV, AVI
3. Recommended resolution: 1920x1080 or higher
4. File size: Keep under 50MB for best performance

## Current Video
The app currently uses a sample video from Google's test bucket. Replace the video URL in LoginScreen.tsx with your local video:

```typescript
// In LoginScreen.tsx, replace:
source={{ uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }}

// With:
source={require('../assets/videos/your-climate-video.mp4')}
```

## Video Requirements
- Duration: 30-60 seconds recommended
- Format: MP4 (H.264 codec)
- Resolution: 1920x1080 or higher
- File size: Under 50MB
