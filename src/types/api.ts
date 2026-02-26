// API Types for Travel Services

export interface HotelSearchParams {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  roomQuantity: number;
  priceRange?: string;
  currency?: string;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  currency?: string;
}

export interface CarSearchParams {
  pickUpLocation: string;
  dropOffLocation?: string;
  pickUpDate: string;
  dropOffDate: string;
  driverAge: number;
  currency?: string;
}

export interface Hotel {
  id: string;
  name: string;
  rating: number;
  price: number;
  currency: string;
  address: string;
  amenities: string[];
  images: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    city: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  price: number;
  currency: string;
  class: string;
  aircraft: string;
}

export interface Car {
  id: string;
  company: string;
  model: string;
  category: string;
  transmission: string;
  fuelType: string;
  seats: number;
  price: number;
  currency: string;
  image: string;
  features: string[];
  location: string;
}

