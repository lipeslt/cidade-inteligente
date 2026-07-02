import React from 'react';

// Mock react-native-maps for test environment
const MockMapView = ({ children, ...props }: any) => children ?? null;
MockMapView.displayName = 'MapView';

const MockMarker = (props: any) => null;
MockMarker.displayName = 'Marker';

export default MockMapView;
export const Marker = MockMarker;
