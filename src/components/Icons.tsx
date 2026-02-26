import React from 'react';
import { Path, Svg } from 'react-native-svg';

export const LocationIcon = ({ style }: { style?: any }) => (
  <Svg viewBox="0 0 20 20" fill="currentColor" style={style}>
    <Path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.1.4-.223.654-.369.625-.36.942-.598 1.275-1.118a11.035 11.035 0 001.144-1.762c.393-.722.684-1.597.868-2.611.203-1.15.22-2.315.22-3.411a5.5 5.5 0 00-11 0c0 1.096.017 2.261.22 3.411.184 1.014.475 1.889.868 2.611a11.035 11.035 0 001.144 1.762c.333.52.65 1.096 1.275 1.118.254.146.468.27.654.369a5.745 5.745 0 00.281.14l.018.008.006.003zM10 8.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
  </Svg>
);

export const CalendarIcon = ({ style }: { style?: any }) => (
  <Svg viewBox="0 0 20 20" fill="currentColor" style={style}>
    <Path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zM4.5 8.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25V8.5h-11z" clipRule="evenodd" />
  </Svg>
);

export const SparklesIcon = ({ style }: { style?: any }) => (
  <Svg viewBox="0 0 20 20" fill="currentColor" style={style}>
    <Path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.39-3.423 3.523.89 4.722 4.236 2.182 2.942 3.918 3.918-2.942 2.182-4.236 4.722-.89-3.523-3.423-.39-4.753-4.401-1.83z" clipRule="evenodd" />
  </Svg>
);