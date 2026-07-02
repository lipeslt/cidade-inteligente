import React from 'react';

// Minimal mock of tamagui components for testing
const createMockComponent = (name: string) => {
  const Component = ({ children, ...props }: any) => {
    return children != null ? children : null;
  };
  Component.displayName = name;
  return Component;
};

export const YStack = createMockComponent('YStack');
export const XStack = createMockComponent('XStack');
export const Text = createMockComponent('Text');
export const Card = createMockComponent('Card');
export const Button = createMockComponent('Button');
export const Spinner = createMockComponent('Spinner');
export const Input = createMockComponent('Input');
export const Label = createMockComponent('Label');
export const Select = createMockComponent('Select');
export const Separator = createMockComponent('Separator');
