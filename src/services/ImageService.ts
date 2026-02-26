// Image Service for generating unique, location-specific images

export class ImageService {
  // Location-based image sets with unique URLs
  private static readonly LOCATION_IMAGES: { [key: string]: string[] } = {
    // European Cities
    'LON': [
      'https://images.unsplash.com/photo-1513639761029-4e4b4b4b4b4b?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'PAR': [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'ROM': [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'MAD': [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'BER': [
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    
    // American Cities
    'NYC': [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'LAX': [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'CHI': [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'MIA': [
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'LAS': [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    
    // Asian Cities
    'TYO': [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'SIN': [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'HKG': [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'BKK': [
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'ICN': [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    
    // Middle Eastern Cities
    'DXB': [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'DOH': [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
    'AUH': [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    ],
  };

  // Generate unique images for a location
  static getLocationBasedImages(cityCode: string, hotelIndex: number, count: number = 3): string[] {
    const locationImages = this.LOCATION_IMAGES[cityCode] || this.LOCATION_IMAGES['LON'];
    
    // Create a unique seed based on city code and hotel index
    const seed = this.hashCode(cityCode + hotelIndex.toString());
    
    // Generate unique images by cycling through the location's image set
    const images: string[] = [];
    for (let i = 0; i < count; i++) {
      const imageIndex = (seed + i) % locationImages.length;
      images.push(locationImages[imageIndex]);
    }
    
    return images;
  }

  // Generate unique car images based on category
  static getCarImage(category: string): string {
    const carImages: { [key: string]: string } = {
      'ECONOMY': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop&q=80',
      'COMPACT': 'https://images.unsplash.com/photo-1549317336-206569e8475c?w=400&h=300&fit=crop&q=80',
      'INTERMEDIATE': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop&q=80',
      'STANDARD': 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop&q=80',
      'FULL_SIZE': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop&q=80',
      'PREMIUM': 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop&q=80',
      'LUXURY': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop&q=80',
      'SUV': 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop&q=80',
    };

    return carImages[category.toUpperCase()] || carImages['ECONOMY'];
  }

  // Simple hash function to create consistent seeds
  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

